from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, AsyncIterator
import uvicorn
import io
import base64
import json
import os
import sys
from anthropic import AsyncAnthropic
from dotenv import load_dotenv

# Fix Windows console encoding for emojis
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# Load environment variables
load_dotenv()

app = FastAPI(title="Noesis Python API", version="1.0.0")

# CORS middleware to allow requests from your React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3001", "http://localhost:3000"],  # Vite + Express
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Anthropic client
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
if not ANTHROPIC_API_KEY:
    print("⚠️  WARNING: ANTHROPIC_API_KEY not set in environment")
    print("   Create a .env file in python-api/ with: ANTHROPIC_API_KEY=your-key-here")

anthropic_client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

# ============================================
# Data Models
# ============================================

class DataSubset(BaseModel):
    description: str
    xAxisName: str
    xAxisDescription: str
    yAxisName: str
    yAxisDescription: str
    dataPoints: List[Dict[str, Any]]

class FileSchema(BaseModel):
    columns: List[Dict[str, str]]
    rowCount: int
    summary: str

class FileProcessingRequest(BaseModel):
    fileBuffer: str  # Base64 encoded file content
    fileName: str
    fileType: str

class FileProcessingResponse(BaseModel):
    success: bool
    file_schema: Optional[FileSchema] = None  # Renamed from 'schema' to avoid shadowing BaseModel.schema
    subsets: Optional[List[DataSubset]] = None
    error: Optional[str] = None

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class CanvasUpdateRequest(BaseModel):
    messages: List[ChatMessage]
    current_canvas: str  # JSON string of current canvas
    data_sources: List[Dict[str, Any]]  # All user's data files

# ============================================
# Routes
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint - verify Python API is running"""
    return {
        "status": "healthy",
        "message": "Python API is running!",
        "anthropic_configured": bool(ANTHROPIC_API_KEY)
    }

# ============================================
# CLAUDE AI FILE ANALYSIS
# ============================================

async def generate_subsets_with_claude(df, file_name: str, file_type: str) -> FileProcessingResponse:
    """
    Use Claude AI to analyze dataframe and generate intelligent visualization subsets
    """
    import pandas as pd
    import numpy as np
    
    if not anthropic_client:
        raise ValueError("Anthropic API key not configured")
    
    try:
        # Analyze dataframe structure
        row_count = len(df)
        col_count = len(df.columns)
        
        # Get column information
        column_info = []
        for col in df.columns:
            dtype = str(df[col].dtype)
            null_count = df[col].isnull().sum()
            unique_count = df[col].nunique()
            
            # Simplify dtype names
            if 'int' in dtype or 'float' in dtype:
                simple_type = 'number'
            elif 'datetime' in dtype:
                simple_type = 'date'
            elif 'bool' in dtype:
                simple_type = 'boolean'
            else:
                simple_type = 'string'
            
            # Get sample values, convert datetime to string
            sample_values = df[col].dropna().head(3).tolist() if len(df[col].dropna()) > 0 else []
            if 'datetime' in dtype:
                sample_values = [str(v) for v in sample_values]
            
            column_info.append({
                "name": str(col),
                "type": simple_type,
                "dtype": dtype,
                "null_count": int(null_count),
                "unique_count": int(unique_count),
                "sample_values": sample_values
            })
        
        # Prepare data for Claude - sample if too large
        MAX_ROWS = 5000
        
        # Convert datetime columns to strings for JSON serialization
        df_for_json = df.copy()
        for col in df_for_json.select_dtypes(include=['datetime64']).columns:
            df_for_json[col] = df_for_json[col].astype(str)
        
        if row_count > MAX_ROWS:
            sample_df = df_for_json.sample(n=min(1000, row_count), random_state=42)
            data_preview = sample_df.head(50).to_dict(orient='records')
            data_stats = df_for_json.describe(include='all').to_dict()
        else:
            data_preview = df_for_json.head(50).to_dict(orient='records')
            data_stats = df_for_json.describe(include='all').to_dict()
        
        # Build system prompt
        system_prompt = f"""You are an expert data visualization analyst. Your task is to analyze a dataset and create 5-15 diverse, meaningful visualization subsets.

DATASET INFORMATION:
- File: {file_name}
- Type: {file_type}
- Dimensions: {row_count} rows × {col_count} columns
- Columns: {json.dumps(column_info, indent=2)}

DATA PREVIEW (first 50 rows):
{json.dumps(data_preview, indent=2, default=str)}

STATISTICAL SUMMARY:
{json.dumps(data_stats, indent=2, default=str)}

YOUR TASK:
Analyze this data and create 5-15 visualization subsets that reveal different insights. Each subset should be optimized for a specific chart type.

REQUIREMENTS:
1. Identify temporal patterns (if date/time columns exist) → line/area charts
2. Compare categories → bar/pie charts
3. Show distributions → bar/histogram charts
4. Reveal correlations → scatter plots
5. Aggregate by time periods (daily/monthly/yearly if applicable)
6. Group by categorical dimensions
7. Calculate meaningful metrics (sum, average, count, percentage)
8. Create comparison views (year-over-year, category comparisons)
9. Apply transformations where useful (growth rates, cumulative, moving averages)
10. Ensure variety in chart types and perspectives

IMPORTANT CHART TYPE GUIDANCE:
- Line charts: Time series, trends (xKey=date/time, yKey=metric)
- Bar charts: Category comparisons (xKey=category, yKey=value)
- Pie charts: Part-to-whole distributions (nameKey=category, yKey=value)
- Area charts: Cumulative trends over time (xKey=date, yKey=cumulative)
- Scatter: Correlations between two metrics (xKey=metric1, yKey=metric2)
- Composed: Multiple metrics on same timeline (xKey=date, yKey=primary, secondaryKey=secondary)

OUTPUT FORMAT (strict JSON):
{{
  "file_schema": {{
    "columns": [
      {{"name": "column_name", "type": "number|string|date|boolean", "description": "what this column represents"}}
    ],
    "rowCount": {row_count},
    "summary": "2-3 sentence overview of what this dataset contains"
  }},
  "subsets": [
    {{
      "description": "Clear description of what insight this visualization shows",
      "xAxisName": "Short label for X-axis",
      "xAxisDescription": "Detailed description of what X-axis represents",
      "yAxisName": "Short label for Y-axis",
      "yAxisDescription": "Detailed description of what Y-axis represents",
      "dataPoints": [{{"x": "value", "y": number}}]
    }}
  ]
}}

CRITICAL:
- Ensure dataPoints array contains actual data from the dataset
- Use real column names and values
- All numbers must be valid (no NaN or Infinity)
- X-axis values should be strings or numbers (not complex objects)
- Y-axis values must be numbers
- Return ONLY valid JSON, no markdown or explanations"""

        user_message = f"Please analyze this {file_type} file and generate intelligent visualization subsets as specified."

        # Call Claude API
        print(f"📊 Sending data to Claude for analysis ({row_count} rows, {col_count} columns)...")
        
        response = await anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=16000,
            temperature=0.3,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_message}
            ]
        )
        
        # Extract response
        response_text = response.content[0].text
        print(f"✅ Claude response received ({len(response_text)} chars)")
        
        # Parse JSON (handle markdown code blocks if present)
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Parse the JSON
        result = json.loads(response_text)
        
        # Validate structure
        if "file_schema" not in result or "subsets" not in result:
            raise ValueError("Invalid response structure from Claude")
        
        if not isinstance(result["subsets"], list) or len(result["subsets"]) == 0:
            raise ValueError("No subsets generated by Claude")
        
        # Convert to Pydantic models
        schema = FileSchema(**result["file_schema"])
        subsets = [DataSubset(**subset) for subset in result["subsets"]]
        
        print(f"✨ Successfully generated {len(subsets)} subsets")
        
        return FileProcessingResponse(
            success=True,
            file_schema=schema,
            subsets=subsets
        )
        
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse Claude response as JSON: {str(e)}")
        print(f"Response text: {response_text[:500]}...")
        raise ValueError(f"Claude returned invalid JSON: {str(e)}")
    
    except Exception as e:
        print(f"❌ Error in Claude analysis: {str(e)}")
        raise

# ============================================
# FILE PROCESSING ENDPOINTS
# ============================================

@app.post("/api/process-file", response_model=FileProcessingResponse)
async def process_file(request: FileProcessingRequest):
    """
    Process uploaded file: parse, create schema, generate subsets
    This is called by the Express server after file upload
    """
    try:
        # Decode the base64 file buffer
        file_bytes = base64.b64decode(request.fileBuffer)
        
        # Determine file type and process accordingly
        if request.fileType.lower().endswith('.csv') or 'csv' in request.fileType.lower():
            result = await process_csv_file(file_bytes, request.fileName)
        elif request.fileType.lower().endswith(('.xlsx', '.xls')) or 'spreadsheet' in request.fileType.lower() or 'excel' in request.fileType.lower():
            result = await process_excel_file(file_bytes, request.fileName)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {request.fileType}")
        
        return result
        
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        return FileProcessingResponse(
            success=False,
            error=str(e)
        )

async def process_csv_file(file_bytes: bytes, file_name: str) -> FileProcessingResponse:
    """
    Process CSV file using Claude AI to generate intelligent subsets
    """
    try:
        import pandas as pd
        
        # Read CSV file
        df = pd.read_csv(io.BytesIO(file_bytes))
        
        if df.empty:
            raise ValueError("CSV file is empty")
        
        # Generate subsets using Claude AI
        return await generate_subsets_with_claude(df, file_name, "CSV")
        
    except Exception as e:
        print(f"Error processing CSV: {str(e)}")
        raise

async def process_excel_file(file_bytes: bytes, file_name: str) -> FileProcessingResponse:
    """
    Process Excel file using Claude AI to generate intelligent subsets
    """
    try:
        import pandas as pd
        
        # Read Excel file (read all sheets)
        sheets_dict = pd.read_excel(io.BytesIO(file_bytes), sheet_name=None)
        
        if not sheets_dict:
            raise ValueError("Excel file contains no sheets")
        
        # Combine all sheets into one dataframe
        if len(sheets_dict) == 1:
            df = list(sheets_dict.values())[0]
            print(f"Excel has 1 sheet with {len(df)} rows")
        else:
            # Concatenate all sheets vertically
            all_dfs = []
            for sheet_name, sheet_df in sheets_dict.items():
                # Add a column to track which sheet the data came from
                sheet_df['_source_sheet'] = sheet_name
                all_dfs.append(sheet_df)
            
            df = pd.concat(all_dfs, ignore_index=True)
            print(f"Excel has {len(sheets_dict)} sheets, combined into {len(df)} total rows")
        
        if df.empty:
            raise ValueError("Excel sheet is empty")
        
        # Generate subsets using Claude AI
        return await generate_subsets_with_claude(df, file_name, "Excel")
        
    except Exception as e:
        print(f"Error processing Excel: {str(e)}")
        raise

# ============================================
# AI CHAT ENDPOINTS
# ============================================

@app.post("/api/chat/stream")
async def stream_chat(request: CanvasUpdateRequest):
    """
    Stream AI chat responses with canvas editing capabilities
    
    Response format (Server-Sent Events / JSON lines):
    - {"type": "text_delta", "text": "..."}  → Stream text token by token
    - {"type": "tool_start", "tool_name": "edit_canvas", "message": "Editing canvas..."}  → Show spinner
    - {"type": "tool_finish", "tool_name": "edit_canvas"}  → Hide spinner
    - {"type": "canvas_update", "canvas": "{...}"}  → New canvas JSON
    - {"type": "done", "usage": {...}}  → End of stream
    - {"type": "error", "error": "..."}  → Error occurred
    """
    
    if not anthropic_client:
        return StreamingResponse(
            iter([json.dumps({"type": "error", "error": "Anthropic API key not configured"}).encode() + b"\n"]),
            media_type="text/plain"
        )
    
    return StreamingResponse(
        stream_ai_response(request),
        media_type="text/plain"
    )

async def stream_ai_response(request: CanvasUpdateRequest) -> AsyncIterator[bytes]:
    """
    Generate streaming AI responses with canvas editing
    """
    try:
        # Build conversation history for Claude
        claude_messages = []
        for msg in request.messages:
            claude_messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Build system prompt with context
        system_prompt = build_system_prompt(request.current_canvas, request.data_sources)
        
        # Define tools that Claude can use
        tools = [
            {
                "name": "edit_canvas",
                "description": "Edit the canvas by modifying its JSON structure. Use this to add, remove, or modify nodes and edges on the canvas.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "canvas_json": {
                            "type": "string",
                            "description": "The complete new canvas JSON structure with nodes and edges"
                        },
                        "explanation": {
                            "type": "string",
                            "description": "Brief explanation of what was changed"
                        }
                    },
                    "required": ["canvas_json", "explanation"]
                }
            }
        ]
        
        # Start streaming from Claude
        async with anthropic_client.messages.stream(
            model="claude-sonnet-4-20250514",  # Latest Claude model
            max_tokens=4096,
            system=system_prompt,
            messages=claude_messages,
            tools=tools,
            temperature=0.7,
        ) as stream:
            
            # Track tool usage
            current_tool_use = None
            tool_input_buffer = ""
            
            async for event in stream:
                
                # Text streaming
                if event.type == "content_block_start":
                    if hasattr(event, 'content_block') and event.content_block.type == "text":
                        # Starting to stream text
                        pass
                    elif hasattr(event, 'content_block') and event.content_block.type == "tool_use":
                        # Starting tool use
                        current_tool_use = event.content_block.name
                        tool_input_buffer = ""
                        yield (json.dumps({
                            "type": "tool_start",
                            "tool_name": current_tool_use,
                            "message": f"🔧 Editing canvas..."
                        }) + "\n").encode()
                
                elif event.type == "content_block_delta":
                    if hasattr(event.delta, 'text'):
                        # Stream text token by token
                        yield (json.dumps({
                            "type": "text_delta",
                            "text": event.delta.text
                        }) + "\n").encode()
                    
                    elif hasattr(event.delta, 'partial_json'):
                        # Accumulate tool input JSON
                        tool_input_buffer += event.delta.partial_json
                
                elif event.type == "content_block_stop":
                    if current_tool_use == "edit_canvas" and tool_input_buffer:
                        # Tool finished - parse and send canvas update
                        try:
                            tool_input = json.loads(tool_input_buffer)
                            canvas_json = tool_input.get("canvas_json", "")
                            explanation = tool_input.get("explanation", "")
                            
                            # Validate it's valid JSON
                            json.loads(canvas_json)
                            
                            yield (json.dumps({
                                "type": "canvas_update",
                                "canvas": canvas_json,
                                "explanation": explanation
                            }) + "\n").encode()
                            
                            yield (json.dumps({
                                "type": "tool_finish",
                                "tool_name": "edit_canvas"
                            }) + "\n").encode()
                            
                        except json.JSONDecodeError as e:
                            yield (json.dumps({
                                "type": "error",
                                "error": f"Invalid canvas JSON: {str(e)}"
                            }) + "\n").encode()
                        
                        current_tool_use = None
                        tool_input_buffer = ""
                
                elif event.type == "message_stop":
                    # Stream complete
                    usage = {}
                    if hasattr(stream, 'get_final_message'):
                        final_msg = await stream.get_final_message()
                        if hasattr(final_msg, 'usage'):
                            usage = {
                                "input_tokens": final_msg.usage.input_tokens,
                                "output_tokens": final_msg.usage.output_tokens,
                            }
                    
                    yield (json.dumps({
                        "type": "done",
                        "usage": usage
                    }) + "\n").encode()
        
    except Exception as e:
        print(f"Error in stream_ai_response: {str(e)}")
        yield (json.dumps({
            "type": "error",
            "error": str(e)
        }) + "\n").encode()

def build_system_prompt(current_canvas: str, data_sources: List[Dict[str, Any]]) -> str:
    """
    Build system prompt with context about canvas and data sources
    """
    
    # Parse canvas to understand current state
    try:
        canvas_obj = json.loads(current_canvas)
        node_count = len(canvas_obj.get("nodes", []))
        edge_count = len(canvas_obj.get("edges", []))
    except:
        node_count = 0
        edge_count = 0
    
    # Summarize data sources
    data_summary = []
    for ds in data_sources:
        file_name = ds.get("originalFileName", "Unknown")
        schema = ds.get("fileSchema", {})
        columns = schema.get("columns", [])
        row_count = schema.get("rowCount", 0)
        subsets = ds.get("subsets", [])
        
        data_summary.append(
            f"- {file_name}: {len(columns)} columns, {row_count} rows, {len(subsets)} pre-generated visualizations"
        )
    
    system_prompt = f"""You are an AI assistant helping users build data visualizations on a canvas.

**Current Canvas State:**
- Nodes: {node_count}
- Edges: {edge_count}
- Full JSON: {current_canvas}

**Available Data Sources:**
{chr(10).join(data_summary) if data_summary else "No data sources uploaded yet"}

**Your Capabilities:**
1. Have conversations about data analysis and visualization
2. Use the `edit_canvas` tool to modify the canvas by providing new JSON
3. Add nodes (charts, text, shapes) and connections (edges)
4. Reference data sources in visualizations

**Canvas JSON Format:**
{{
  "nodes": [
    {{
      "id": "unique-id",
      "type": "text|shape|chart|table",
      "position": {{"x": 100, "y": 100}},
      "data": {{
        "label": "Node content",
        "dataSource": "file-id",  // Optional: link to data
        "subset": "subset-description"  // Optional: which visualization
      }}
    }}
  ],
  "edges": [
    {{
      "id": "edge-id",
      "source": "node-id-1",
      "target": "node-id-2"
    }}
  ]
}}

**Guidelines:**
- When editing canvas, provide the COMPLETE new JSON structure
- Position nodes logically (spread them out, don't overlap)
- Use clear, descriptive labels
- Explain what you're doing before using the tool
- If user asks to add a chart, use node type "chart" and reference available data
- Keep the conversation natural and helpful

Be creative, helpful, and make beautiful visualizations!"""
    
    return system_prompt

# ============================================
# Run the server
# ============================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )
