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
# Claude Pricing Configuration
# ============================================
# Claude Sonnet 4 pricing (as of 2025)
CLAUDE_INPUT_PRICE_PER_MTOK = 1.0   # $1 per 1M input tokens
CLAUDE_OUTPUT_PRICE_PER_MTOK = 5.0  # $5 per 1M output tokens

def calculate_claude_cost(input_tokens: int, output_tokens: int) -> float:
    """Calculate cost in USD for Claude API usage"""
    input_cost = (input_tokens / 1_000_000) * CLAUDE_INPUT_PRICE_PER_MTOK
    output_cost = (output_tokens / 1_000_000) * CLAUDE_OUTPUT_PRICE_PER_MTOK
    return input_cost + output_cost

async def track_token_usage(username: str, input_tokens: int, output_tokens: int):
    """Track token usage to MongoDB via Express API"""
    try:
        import aiohttp
        total_tokens = input_tokens + output_tokens
        cost = calculate_claude_cost(input_tokens, output_tokens)
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"http://localhost:3001/api/user/track-tokens",
                json={"username": username, "tokens": total_tokens, "cost": cost}
            ) as response:
                if response.status == 200:
                    print(f"💰 Tracked {total_tokens} tokens (${cost:.6f}) for {username}")
                else:
                    print(f"⚠️  Failed to track tokens: {response.status}")
    except Exception as e:
        print(f"❌ Error tracking tokens: {str(e)}")

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
    username: str  # Username for token tracking

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
    username: str  # Username for token tracking

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

async def generate_subsets_with_claude(df, file_name: str, file_type: str, username: str) -> FileProcessingResponse:
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

        # Call Claude API with streaming (required for large requests)
        print(f"📊 Sending data to Claude for analysis ({row_count} rows, {col_count} columns)...")
        
        response_text = ""
        input_tokens = 0
        output_tokens = 0
        
        async with anthropic_client.messages.stream(
            model="claude-haiku-4-5",
            max_tokens=32000,  # Large enough for comprehensive file analysis with multiple subsets
            temperature=0.3,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_message}
            ]
        ) as stream:
            async for text in stream.text_stream:
                response_text += text
            
            # Get final message for token usage
            final_message = await stream.get_final_message()
            input_tokens = final_message.usage.input_tokens
            output_tokens = final_message.usage.output_tokens
        
        print(f"✅ Claude response received ({len(response_text)} chars)")
        
        # Track token usage
        await track_token_usage(username, input_tokens, output_tokens)
        
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
            result = await process_csv_file(file_bytes, request.fileName, request.username)
        elif request.fileType.lower().endswith(('.xlsx', '.xls')) or 'spreadsheet' in request.fileType.lower() or 'excel' in request.fileType.lower():
            result = await process_excel_file(file_bytes, request.fileName, request.username)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {request.fileType}")
        
        return result
        
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        return FileProcessingResponse(
            success=False,
            error=str(e)
        )

async def process_csv_file(file_bytes: bytes, file_name: str, username: str) -> FileProcessingResponse:
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
        return await generate_subsets_with_claude(df, file_name, "CSV", username)
        
    except Exception as e:
        print(f"Error processing CSV: {str(e)}")
        raise

async def process_excel_file(file_bytes: bytes, file_name: str, username: str) -> FileProcessingResponse:
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
        return await generate_subsets_with_claude(df, file_name, "Excel", username)
        
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
            model="claude-haiku-4-5",  # Latest Claude model
            max_tokens=30000,  # Increased for complex canvas operations
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
                        print("📝 Text block started")
                    elif hasattr(event, 'content_block') and event.content_block.type == "tool_use":
                        # Starting tool use
                        current_tool_use = event.content_block.name
                        tool_input_buffer = ""
                        print(f"🔧 Tool use started: {current_tool_use}")
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
                        print(f"✅ Tool use finished, buffer length: {len(tool_input_buffer)}")
                        try:
                            tool_input = json.loads(tool_input_buffer)
                            canvas_json = tool_input.get("canvas_json", "")
                            explanation = tool_input.get("explanation", "")
                            
                            print(f"🎨 Parsed tool input - canvas length: {len(canvas_json)}")
                            
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
                            print(f"❌ JSON decode error: {str(e)}")
                            yield (json.dumps({
                                "type": "error",
                                "error": f"Invalid canvas JSON: {str(e)}"
                            }) + "\n").encode()
                        
                        current_tool_use = None
                        tool_input_buffer = ""
                    else:
                        print(f"📝 Content block stopped (tool: {current_tool_use}, buffer: {len(tool_input_buffer) if tool_input_buffer else 0})")
                
                elif event.type == "message_stop":
                    # Handle any remaining tool use before finishing
                    if current_tool_use == "edit_canvas" and tool_input_buffer:
                        # Tool wasn't properly finished - process it now
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
                    
                    # Stream complete
                    usage = {}
                    if hasattr(stream, 'get_final_message'):
                        final_msg = await stream.get_final_message()
                        if hasattr(final_msg, 'usage'):
                            usage = {
                                "input_tokens": final_msg.usage.input_tokens,
                                "output_tokens": final_msg.usage.output_tokens,
                            }
                            # Track token usage for this chat interaction
                            await track_token_usage(
                                request.username,
                                final_msg.usage.input_tokens,
                                final_msg.usage.output_tokens
                            )
                    
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
    
    # Parse raw file data and include FULL spreadsheet data
    full_raw_data = []
    for ds in data_sources:
        file_name = ds.get("originalFileName", "Unknown")
        raw_file_data = ds.get("rawFileData")
        
        if raw_file_data:
            file_buffer = raw_file_data.get("fileBuffer")
            file_type = raw_file_data.get("fileType", "")
            
            if file_buffer:
                try:
                    import pandas as pd
                    
                    # Decode base64 buffer
                    file_bytes = base64.b64decode(file_buffer)
                    
                    full_raw_data.append(f"\n**RAW FILE DATA: {file_name}**")
                    
                    # Parse based on file type
                    if 'csv' in file_type.lower() or file_name.lower().endswith('.csv'):
                        df = pd.read_csv(io.BytesIO(file_bytes))
                        full_raw_data.append(f"Format: CSV")
                        full_raw_data.append(f"Rows: {len(df)}, Columns: {len(df.columns)}")
                        full_raw_data.append(f"Column Names: {list(df.columns)}")
                        full_raw_data.append(f"\nFULL DATA (all {len(df)} rows):")
                        full_raw_data.append(df.to_json(orient='records', date_format='iso'))
                        
                    elif 'excel' in file_type.lower() or 'spreadsheet' in file_type.lower() or file_name.lower().endswith(('.xlsx', '.xls')):
                        # Read all sheets
                        sheets_dict = pd.read_excel(io.BytesIO(file_bytes), sheet_name=None)
                        
                        full_raw_data.append(f"Format: Excel")
                        full_raw_data.append(f"Total Sheets: {len(sheets_dict)}")
                        
                        for sheet_name, sheet_df in sheets_dict.items():
                            full_raw_data.append(f"\n--- SHEET: {sheet_name} ---")
                            full_raw_data.append(f"Rows: {len(sheet_df)}, Columns: {len(sheet_df.columns)}")
                            full_raw_data.append(f"Column Names: {list(sheet_df.columns)}")
                            full_raw_data.append(f"\nFULL DATA (all {len(sheet_df)} rows):")
                            full_raw_data.append(sheet_df.to_json(orient='records', date_format='iso'))
                        
                except Exception as e:
                    full_raw_data.append(f"Error parsing raw data: {str(e)}")
    
    # Include FULL data from ALL subsets in context
    full_subsets_data = []
    for ds in data_sources:
        file_id = ds.get("_id", "unknown")
        file_name = ds.get("originalFileName", "Unknown")
        subsets = ds.get("subsets", [])
        
        if subsets:
            full_subsets_data.append(f"\n**File: {file_name} (ID: {file_id})**")
            full_subsets_data.append(f"Total subsets: {len(subsets)}\n")
            
            # Include ALL subsets with COMPLETE data
            for i, subset in enumerate(subsets):
                desc = subset.get("description", "")
                x_axis = subset.get("xAxisName", "")
                x_axis_desc = subset.get("xAxisDescription", "")
                y_axis = subset.get("yAxisName", "")
                y_axis_desc = subset.get("yAxisDescription", "")
                data_points = subset.get("dataPoints", [])
                
                full_subsets_data.append(f"--- SUBSET {i+1} ---")
                full_subsets_data.append(f"Description: {desc}")
                full_subsets_data.append(f"X-Axis: {x_axis} ({x_axis_desc})")
                full_subsets_data.append(f"Y-Axis: {y_axis} ({y_axis_desc})")
                full_subsets_data.append(f"Data Points ({len(data_points)} total):")
                full_subsets_data.append(json.dumps(data_points, indent=2))
                full_subsets_data.append("")
    
    system_prompt = f"""You are an AI assistant helping users build data visualizations on a canvas.

**YOUR PRIMARY TASK:** Whenever a user asks to add, modify, or remove visualizations, you MUST use the edit_canvas tool to make the changes. Always respond with both text explanation AND canvas edits.

**Current Canvas State:**
- Nodes: {node_count}
- Edges: {edge_count}
- Full JSON: {current_canvas}

**Available Data Sources:**
{chr(10).join(data_summary) if data_summary else "No data sources uploaded yet"}

**COMPLETE RAW FILE DATA (ALL SHEETS, ALL ROWS):**
{chr(10).join(full_raw_data) if full_raw_data else "No raw data available"}

**Pre-generated Subsets with FULL DATA:**
{chr(10).join(full_subsets_data) if full_subsets_data else "No subsets available yet"}

**CRITICAL: Chart Node Structure**

When creating chart nodes, you MUST embed ALL data directly in the node. DO NOT reference external files.

**Chart Node Format (REQUIRED):**
{{
  "id": "unique-chart-id",
  "type": "chart",
  "position": {{"x": 100, "y": 100}},
  "style": {{"width": 420, "height": 300}},
  "data": {{
    "label": "Chart Title",
    "kind": "line|bar|area|pie|scatter|composed|radar|radialBar|funnel|treemap|sankey",
    "xKey": "fieldName",
    "yKey": "valueField",
    "style": {{
      "showGrid": true,
      "showLegend": true,
      "showTooltip": true,
      "strokeColor": "#3b82f6",
      "fillColor": "#3b82f6",
      "strokeWidth": 2,
      "lineType": "monotone|step|linear",
      "showDots": true,
      "barSize": 35,
      "fillOpacity": 0.6,
      "secondaryKey": "optionalSecondMetric"
    }},
    "data": [
      {{"fieldName": "value1", "valueField": 100}},
      {{"fieldName": "value2", "valueField": 200}}
    ]
  }}
}}

**Element Node Format (for titles, text, dividers):**
{{
  "id": "unique-element-id",
  "type": "element",
  "position": {{"x": 0, "y": 0}},
  "style": {{"width": 1200, "height": 100}},
  "data": {{
    "kind": "title|sectionHeader|text|horizontalDivider|verticalDivider",
    "text": "Content here",
    "fontSize": 28,
    "fontWeight": "bold|600|normal",
    "textAlign": "left|center|right",
    "textColor": "#1f2937",
    "backgroundColor": "#dbeafe",
    "dividerColor": "#3b82f6",
    "dividerThickness": 3
  }}
}}

**Chart Types & Usage:**
- **line**: Time series, trends (xKey=date/category, yKey=metric, lineType=monotone/step/linear)
- **bar**: Category comparisons (xKey=category, yKey=value, barSize=20-50)
- **area**: Cumulative trends (xKey=date, yKey=value, fillOpacity=0.3-0.8)
- **pie**: Distributions (nameKey=category, yKey=value)
- **scatter**: Correlations (xKey=metric1, yKey=metric2)
- **composed**: Multiple metrics (xKey=shared, yKey=primary, secondaryKey=secondary, tertiaryKey=third)
- **radar**: Multi-dimensional (subject=dimension, A/B/C=metrics, fullMark=max)
- **radialBar**: Circular bars (name=category, value=amount, fill=color)
- **funnel**: Conversion stages (name=stage, value=count, fill=color)
- **treemap**: Hierarchical (name=category, size=value, fill=color)
- **sankey**: Flow diagrams (nodes array, links array with source/target/value)

**IMPORTANT RULES:**
1. **Embed data**: ALWAYS include the full "data" array with all data points in the chart node
2. **Complete access**: You have the COMPLETE raw spreadsheet data (all sheets, all rows) provided above in COMPLETE RAW FILE DATA section
3. **Use raw data**: You can transform and use the raw data directly, or use the pre-generated subsets - you have everything!
4. **All sheets available**: For Excel files, ALL sheets are provided separately - you can create visualizations from ANY sheet
5. **Custom aggregations**: You can aggregate, filter, group, or transform the raw data however you want before creating visualizations
6. **Match keys**: Ensure xKey and yKey match the field names in your data array
7. **Position wisely**: Spread nodes out (x: 0, 440, 880, etc. y: increment by 300-400)
8. **Include styling**: Always set width/height in style, and chart styling in data.style

**Example - Adding a Bar Chart:**
User: "Add a bar chart showing sales by month"

You should use edit_canvas with:
{{
  "nodes": [
    {{
      "id": "sales-bar-chart",
      "type": "chart",
      "position": {{"x": 100, "y": 100}},
      "style": {{"width": 500, "height": 350}},
      "data": {{
        "label": "Monthly Sales",
        "kind": "bar",
        "xKey": "month",
        "yKey": "sales",
        "style": {{
          "showGrid": true,
          "showLegend": true,
          "showTooltip": true,
          "fillColor": "#10b981",
          "barSize": 40
        }},
        "data": [
          {{"month": "Jan", "sales": 4000}},
          {{"month": "Feb", "sales": 3000}},
          {{"month": "Mar", "sales": 5000}},
          {{"month": "Apr", "sales": 4500}},
          {{"month": "May", "sales": 6000}},
          {{"month": "Jun", "sales": 5500}}
        ]
      }}
    }}
  ],
  "edges": []
}}

**Guidelines:**
- When editing canvas, provide the COMPLETE new JSON structure
- Always merge existing nodes with new ones (don't delete existing nodes unless asked)
- Position new nodes so they don't overlap with existing ones
- Use descriptive labels and clear chart titles
- Choose appropriate chart types for the data
- Keep the conversation natural and explain what you're doing

Be creative, helpful, and make beautiful visualizations with ALL data embedded!"""
    
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
