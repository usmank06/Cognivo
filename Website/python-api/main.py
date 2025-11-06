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
from pathlib import Path
from anthropic import AsyncAnthropic
from dotenv import load_dotenv

# Fix Windows console encoding for emojis
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# Load environment variables from root directory
root_env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=root_env_path)

app = FastAPI(title="Cognivo Python API", version="1.0.0")

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
    print("[Python API] Warning: ANTHROPIC_API_KEY not set")

anthropic_client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

# System prompt configuration
INCLUDE_RAW_FILE_DATA = os.getenv("INCLUDE_RAW_FILE_DATA", "false").lower() in ("true", "1", "yes")

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
                pass  # Silent tracking
    except Exception:
        pass  # Silent fail - don't break on tracking errors

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
- Pie charts: Part-to-whole distributions - MUST use nameKey for category labels, yKey for values. Data MUST be array of objects with name/value pairs like: [{{"name": "Cat A", "value": 30}}, {{"name": "Cat B", "value": 45}}]
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
        
        return FileProcessingResponse(
            success=True,
            file_schema=schema,
            subsets=subsets
        )
        
    except json.JSONDecodeError as e:
        raise ValueError(f"Claude returned invalid JSON: {str(e)}")
    
    except Exception as e:
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
        else:
            # Concatenate all sheets vertically
            all_dfs = []
            for sheet_name, sheet_df in sheets_dict.items():
                # Add a column to track which sheet the data came from
                sheet_df['_source_sheet'] = sheet_name
                all_dfs.append(sheet_df)
            
            df = pd.concat(all_dfs, ignore_index=True)
        
        if df.empty:
            raise ValueError("Excel sheet is empty")
        
        # Generate subsets using Claude AI
        return await generate_subsets_with_claude(df, file_name, "Excel", username)
        
    except Exception as e:
        raise

# ============================================
# AI CHAT ENDPOINTS
# ============================================

class ChatTitleRequest(BaseModel):
    user_message: str

@app.post("/api/chat/generate-title")
async def generate_chat_title(request: ChatTitleRequest):
    """
    Generate an emoji + short title for a chat based on the user's first message
    """
    if not anthropic_client:
        raise HTTPException(status_code=500, detail="Anthropic API key not configured")
    
    try:
        response = await anthropic_client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=100,
            temperature=0.7,
            messages=[{
                "role": "user",
                "content": f"""Generate a short, catchy title (max 4-5 words) with a relevant emoji for a chat conversation that starts with this message:

"{request.user_message}"

Respond with ONLY the emoji + title, nothing else. Examples:
- 📊 Sales Analytics Dashboard
- 💰 Budget Planning Report
- 🎨 Design Portfolio Review
- 📈 Q4 Performance Metrics

Your response:"""
            }]
        )
        
        title = response.content[0].text.strip()
        return {"title": title}
        
    except Exception as e:
        # Return a fallback title
        return {"title": "💬 New Chat"}

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
                    else:
                        pass
                
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
    
    # Parse raw file data and include FULL spreadsheet data (ONLY if enabled)
    full_raw_data = []
    if INCLUDE_RAW_FILE_DATA:
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

**⚡ CRITICAL: MESSAGE FLOW WHEN EDITING CANVAS**
When you use the edit_canvas tool, you MUST follow this exact pattern:
1. **Before editing:** Send a brief message saying what you're about to do (e.g., "I'll create those charts for you")
2. **Tool use:** Use the edit_canvas tool to make the changes
3. **After editing:** Send a completion message confirming what you did (e.g., "I've added 12 charts showing your sales data")

**IMPORTANT:** You MUST send text both BEFORE and AFTER using edit_canvas. Never just use the tool silently.
- Pre-edit message: 1 sentence about what you're doing
- Post-edit message: 1-2 sentences about what you created

Example conversation:
User: "Make a dashboard"
You: "I'll create a comprehensive dashboard with multiple visualizations"
[edit_canvas tool executes]
You: "I've added 12 charts including sales trends, product comparisons, and profit analysis"

**🎯 CORE PRINCIPLE: CREATE COMPREHENSIVE VISUALIZATIONS**
- When asked for visualizations, create **10-15+ diverse charts** minimum
- When asked for a report/dashboard, create **9-12+ charts** in dense horizontal rows (3-4 per row)
- **NEVER** create just 1-2 charts unless specifically requested
- Use ALL available data subsets and explore multiple perspectives
- Think "executive dashboard" - pack as much insight as possible

**CRITICAL: PREVENT OVERLAPPING GRAPHS**
When placing ANY chart or element on the canvas, you MUST:
- **Check existing node positions and sizes** before placing new elements
- **Calculate the bottom-right corner** of each existing element (x + width, y + height)
- **Position new elements** so they DO NOT overlap with existing ones
- **Leave adequate spacing** (at least 20-40px) between elements
- If unsure, place elements in a new row below existing content or to the right with proper spacing
- **NEVER place two graphs at the same x,y coordinates or overlapping areas**

**MARKDOWN FORMATTING:**
Your text responses support markdown formatting. You can use:
- **Bold text** using **text** or __text__
- *Italic text* using *text* or _text_
- Bullet lists using - or * at the start of lines
- Numbered lists using 1. 2. 3. etc.
- `Inline code` using backticks
- Line breaks for paragraphs

Keep formatting simple and clean. DO NOT use:
- Headers (# ## ###) - they won't render well in chat bubbles
- Block code fences (```) - use inline code instead
- Tables - they're too complex for chat
- Images or links - not supported in this chat interface
- Complex nested structures
- **Emojis** - NEVER use emojis anywhere in your responses

**CRITICAL: RESPONSE STYLE - BE CONCISE**
- **Keep ALL responses extremely brief and concise**
- Maximum 2-3 short sentences per response
- Get straight to the point - no fluff or unnecessary words
- Use bullet points only when absolutely necessary
- **DO NOT provide detailed explanations unless specifically asked**
- **DO NOT be verbose or wordy**
- Focus on being helpful and efficient with minimal text
- **NEVER use emojis** - use plain text only

**EXCEPTION: When using edit_canvas tool:**
- ALWAYS send a brief message BEFORE editing (1 sentence)
- ALWAYS send a completion message AFTER editing (1-2 sentences)
- This creates a better user experience with clear communication

Your responses should be SHORT. Think "tweet-length" not "essay-length".

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**
**📊 CRITICAL: MAXIMIZE VISUALIZATIONS - CREATE COMPREHENSIVE DASHBOARDS**
**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

**GOLDEN RULE: ALWAYS CREATE AS MANY GRAPHS AS POSSIBLE!**

**General Visualization Requests:**
When a user asks for general visualizations, dashboards, or to "show me the data":
- **MINIMUM 10-15 charts** showing different perspectives of the data
- Create diverse chart types: line, bar, pie, area, scatter, radar, etc.
- Show different aggregations, time periods, categories
- Explore ALL interesting relationships in the data
- Use 3-4 charts per row layout (width: ~240-260px each)
- Stack multiple rows vertically
- **DO NOT BE CONSERVATIVE** - use all available data subsets!

**Layout Pattern for General Dashboards:**
- Row 1: 3-4 key metric charts (y: 20)
- Row 2: 3-4 trend charts (y: 300)
- Row 3: 3-4 comparison charts (y: 580)
- Row 4: 3-4 distribution charts (y: 860)
- Continue adding rows as needed
- Spacing: 20px horizontal gap, 280px vertical gap between rows

**Report Requests:**
When user asks for a "report" or "dashboard":
- **MINIMUM 8-12 charts on a single page**
- Use 3-4 charts per row (width: 240-260px for 3 per row, 180-200px for 4 per row)
- Height: 220-250px per chart to fit multiple rows
- Add title + section headers + summary cards
- **PACK AS MUCH INFORMATION AS POSSIBLE**
- Think: Executive dashboard, KPI overview, comprehensive report

**3 Charts Per Row Layout (RECOMMENDED FOR REPORTS):**
```
Title: x: 0, y: 0, width: 794, height: 60

Row 1 (y: 80):
- Chart 1: x: 20, width: 240, height: 240
- Chart 2: x: 280, width: 240, height: 240  
- Chart 3: x: 540, width: 240, height: 240

Row 2 (y: 350):
- Chart 4: x: 20, width: 240, height: 240
- Chart 5: x: 280, width: 240, height: 240
- Chart 6: x: 540, width: 240, height: 240

Row 3 (y: 620):
- Chart 7: x: 20, width: 240, height: 240
- Chart 8: x: 280, width: 240, height: 240
- Chart 9: x: 540, width: 240, height: 240

Summary: x: 0, y: 890, width: 794, height: 60
```

**4 Charts Per Row Layout (ULTRA-DENSE):**
```
Row spacing: 260px vertical
Charts: x: 10, 210, 410, 610
Width: 180px each
Height: 220px each
Can fit 12+ charts on one page!
```

**What to Visualize:**
1. **Key Metrics**: Total, average, count, sum
2. **Trends Over Time**: Line/area charts by day/month/year
3. **Comparisons**: Bar charts comparing categories
4. **Distributions**: Pie charts showing proportions
5. **Correlations**: Scatter plots between variables
6. **Top/Bottom N**: Best/worst performers
7. **Growth Rates**: Year-over-year, month-over-month
8. **Breakdowns**: By category, region, segment
9. **Combinations**: Composed charts with multiple metrics
10. **Specialty**: Radar, funnel, treemap for specific insights

**Examples of Comprehensive Requests:**
- "Visualize the data" → Create 12-15 diverse charts
- "Make a dashboard" → 10-12 charts in rows of 3-4
- "Show me everything" → 15-20 charts exploring all angles
- "Create a report" → 8-12 charts + title + sections, report format
- "Analyze this data" → 10+ charts showing different insights

**CRITICAL RULES:**
1. **NEVER create just 1-2 charts** unless specifically asked for a single visualization
2. **ALWAYS use multiple chart types** for variety and insight
3. **UTILIZE ALL AVAILABLE DATA** - if there are 10 subsets, use all 10!
4. **THINK COMPREHENSIVE** - what would a data analyst want to see?
5. **DENSELY PACK INFORMATION** - use horizontal rows, not vertical stacking
6. **BE CREATIVE** - different aggregations, filters, groupings of same data

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

**SPECIAL: REPORT FORMAT**
If the user mentions "report" or asks for a report-style layout, you MUST create a canvas designed for a standard A4 page format:
- **Width**: Set canvas width to approximately 794 pixels (matches A4 width at 96 DPI)
- **Height**: CRITICAL - Total canvas height must NOT exceed 1123 pixels (matches A4 height at 96 DPI)
  - This ensures everything fits on ONE page when exported to PDF
  - Plan your layout carefully to fit within this height constraint
  - If content doesn't fit, reduce chart heights or remove less important elements
- **Layout**: DENSE HORIZONTAL ROWS - Arrange 3-4 charts side-by-side in rows to maximize space
  - **PREFERRED: 3 charts per row** for balance of size and information density
  - **ALTERNATIVE: 4 charts per row** for maximum information on single page
  - This allows fitting 9-12+ charts on one page!
  - Stack rows vertically as needed
- **Structure**: Include proper report elements with horizontal chart arrangement:
  1. Title/Header section at the top (element node with kind="title", height ~50-60px, full width)
  2. Optional section headers (element node with kind="sectionHeader", height ~35px, full width)
  3. **Charts in DENSE ROWS**: Position 3-4 charts horizontally per row
     - **For 3 charts per row (RECOMMENDED)**: width ~240-250px each, positioned at x: 20, x: 280, x: 540, chart height: 220-240px
     - **For 4 charts per row (ULTRA-DENSE)**: width ~180-190px each, positioned at x: 10, x: 210, x: 410, x: 610, chart height: 200-220px
     - Row vertical spacing: 260-280px between rows
  4. Optional compact summary cards (element node with kind="text", height ~40-50px, full width)
  5. Optional dividers between sections (element node with kind="horizontalDivider", minimal height)

**POSITIONING EXAMPLE - 3 Charts Per Row (RECOMMENDED FOR REPORTS):**
```
Title:   x: 0,   y: 0,   width: 794, height: 55

Row 1 (y: 75):
- Chart 1: x: 20,  y: 75,  width: 245, height: 235
- Chart 2: x: 280, y: 75,  width: 245, height: 235
- Chart 3: x: 540, y: 75,  width: 245, height: 235

Row 2 (y: 340):
- Chart 4: x: 20,  y: 340, width: 245, height: 235
- Chart 5: x: 280, y: 340, width: 245, height: 235
- Chart 6: x: 540, y: 340, width: 245, height: 235

Row 3 (y: 605):
- Chart 7: x: 20,  y: 605, width: 245, height: 235
- Chart 8: x: 280, y: 605, width: 245, height: 235
- Chart 9: x: 540, y: 605, width: 245, height: 235

Summary: x: 0, y: 870, width: 794, height: 50
Total: 9 charts + title + summary = ~920px (fits perfectly!)
```

**POSITIONING EXAMPLE - 4 Charts Per Row (MAXIMUM DENSITY):**
```
Title:   x: 0, y: 0, width: 794, height: 50

Row 1 (y: 65):
- Chart 1: x: 10,  y: 65,  width: 185, height: 215
- Chart 2: x: 210, y: 65,  width: 185, height: 215
- Chart 3: x: 410, y: 65,  width: 185, height: 215
- Chart 4: x: 610, y: 65,  width: 185, height: 215

Row 2 (y: 305):
- Chart 5: x: 10,  y: 305, width: 185, height: 215
- Chart 6: x: 210, y: 305, width: 185, height: 215
- Chart 7: x: 410, y: 305, width: 185, height: 215
- Chart 8: x: 610, y: 305, width: 185, height: 215

Row 3 (y: 545):
- Chart 9:  x: 10,  y: 545, width: 185, height: 215
- Chart 10: x: 210, y: 545, width: 185, height: 215
- Chart 11: x: 410, y: 545, width: 185, height: 215
- Chart 12: x: 610, y: 545, width: 185, height: 215

Summary: x: 0, y: 785, width: 794, height: 45
Total: 12 charts + title + summary = ~830px (PERFECT!)
```

- **Styling**: Use professional colors, clear hierarchy, and compact spacing for a polished, information-rich report

**WHEN CREATING REPORTS: Aim for 9-12 charts minimum to create a comprehensive, executive-ready dashboard that fits on one page!**

**Current Canvas State:**
- Nodes: {node_count}
- Edges: {edge_count}
- Full JSON: {current_canvas}

**Available Data Sources:**
{chr(10).join(data_summary) if data_summary else "No data sources uploaded yet"}

**COMPLETE RAW FILE DATA (ALL SHEETS, ALL ROWS):**
{chr(10).join(full_raw_data) if full_raw_data else ("Raw file data not included (disabled in configuration)" if not INCLUDE_RAW_FILE_DATA else "No raw data available")}

**Pre-generated Subsets with FULL DATA:**
{chr(10).join(full_subsets_data) if full_subsets_data else "No subsets available yet"}

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**
**🎨 DESIGN SYSTEM - COGNIVO PLATFORM**
**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

**CRITICAL: ALL visualizations MUST follow this modern, professional design system.**

**COLOR PALETTE:**

**Chart Data Colors** (USE THESE for all data visualizations):
- Primary Palette: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1']
  → Blue, Purple, Green, Orange, Red, Cyan, Pink, Indigo
- Use colors in sequence for multi-series charts
- First series: #3b82f6 (Blue)
- Second series: #8b5cf6 (Purple)
- Third series: #10b981 (Green)

**Element Colors:**
- Text: #334155 (neutral gray)
- Titles: #1e293b (dark gray)
- Section Headers: #1e293b with #3b82f6 accent
- Backgrounds: #ffffff (white) or #f8fafc (light gray)
- Dividers: #cbd5e1 (medium gray)

**STYLING STANDARDS:**

**Charts:**
- Border: 1.5px solid #e2e8f0
- Border Radius: 12px
- Box Shadow: 0 4px 12px rgba(0, 0, 0, 0.08)
- Background: #ffffff
- Title Background: #f8fafc
- Font: 'Poppins', sans-serif

**Default Chart Style Values:**
{{
  "showGrid": true,
  "showLegend": true,
  "showTooltip": true,
  "strokeColor": "#3b82f6",      // Primary blue
  "fillColor": "#3b82f6",        // Primary blue
  "strokeWidth": 2.5,            // Slightly thicker for visibility
  "fillOpacity": 0.85,           // Rich, solid colors
  "lineType": "monotone",        // Smooth curves
  "showDots": true,              // Show data points
  "barSize": 24,                 // Well-proportioned bars
  "innerRadius": 0,              // Full pie (use 40-60 for donut)
  "outerRadius": 85,             // Generous size
  "radarFillOpacity": 0.7        // Balanced transparency
}}

**Chart Dimensions:**
- Minimum: 280px × 200px
- Standard: 420px × 320px
- Large: 560px × 400px
- Report (2 per row): 370px × 250px
- Report (3 per row): 240px × 250px

**Element Nodes:**
- **Title**: fontSize: 24, fontWeight: 700, color: #1e293b, padding: 16px 20px
- **Section Header**: fontSize: 18, fontWeight: 600, color: #1e293b, background: #f8fafc, borderBottom: 2px solid #3b82f6
- **Text**: fontSize: 14, fontWeight: 400, color: #334155, padding: 12px 16px
- **Dividers**: color: #cbd5e1, thickness: 2px

**SPACING & LAYOUT:**
- Minimum gap between elements: 24px
- Standard margin: 16-20px
- Charts per row: 2-3 maximum for readability
- Vertical spacing between rows: 20-30px

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

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
      "secondaryKey": "optionalSecondMetric",
      "pieColors": ["#3b82f6", "#8b5cf6", "#10b981"]  // Optional: custom colors for pie chart slices
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
- **pie**: Distributions - CRITICAL: Use nameKey for labels, yKey for values. Data format: [{{"name": "Category A", "value": 30}}, {{"name": "Category B", "value": 45}}] OR use custom nameKey like [{{"category": "A", "amount": 30}}] with nameKey="category", yKey="amount"
- **scatter**: Correlations (xKey=metric1, yKey=metric2)
- **composed**: Multiple metrics (xKey=shared, yKey=primary, secondaryKey=secondary, tertiaryKey=third)
- **radar**: Multi-dimensional (subject=dimension, A/B/C=metrics, fullMark=max)
- **radialBar**: Circular bars (name=category, value=amount, fill=color)
- **funnel**: Conversion stages (name=stage, value=count, fill=color)
- **treemap**: Hierarchical (name=category, size=value, fill=color)
- **sankey**: Flow diagrams (nodes array, links array with source/target/value)

**IMPORTANT RULES:**
1. **CREATE MANY GRAPHS**: For general requests, create 10-15+ charts. For reports, create 8-12+ charts in dense rows
2. **Embed data**: ALWAYS include the full "data" array with all data points in the chart node
3. **Data access**: {"You have the COMPLETE raw spreadsheet data (all sheets, all rows) provided above in COMPLETE RAW FILE DATA section" if INCLUDE_RAW_FILE_DATA else "Use the pre-generated subsets provided above - they contain aggregated and processed data ready for visualization"}
4. **Use available data**: {"You can transform and use the raw data directly, or use the pre-generated subsets - you have everything!" if INCLUDE_RAW_FILE_DATA else "Use the pre-generated subsets which contain carefully selected data perspectives optimized for different chart types"}
5. **Sheets availability**: {"For Excel files, ALL sheets are provided separately - you can create visualizations from ANY sheet" if INCLUDE_RAW_FILE_DATA else "Pre-generated subsets may include data from multiple sheets where applicable"}
6. **Data transformations**: {"You can aggregate, filter, group, or transform the raw data however you want before creating visualizations" if INCLUDE_RAW_FILE_DATA else "Use the pre-generated subsets which are already aggregated and processed for optimal visualization"}
7. **Match keys**: Ensure xKey and yKey match the field names in your data array
8. **Position wisely**: Use dense horizontal rows (3-4 charts per row) with proper spacing. Row gap: ~260-280px vertical
9. **Include styling**: Always set width/height in style, and chart styling in data.style
10. **USE ALL DATA**: If there are 10 subsets available, try to use ALL 10 in different chart types and perspectives

**Example - Adding a Bar Chart (FOLLOW THIS PATTERN):**
User: "Add a bar chart showing sales by month"

You should use edit_canvas with:
{{
  "nodes": [
    {{
      "id": "sales-bar-chart",
      "type": "chart",
      "position": {{"x": 100, "y": 100}},
      "style": {{"width": 420, "height": 320}},
      "data": {{
        "label": "Monthly Sales",
        "kind": "bar",
        "xKey": "month",
        "yKey": "sales",
        "style": {{
          "showGrid": true,
          "showLegend": true,
          "showTooltip": true,
          "fillColor": "#3b82f6",
          "strokeWidth": 2.5,
          "fillOpacity": 0.85,
          "barSize": 24
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

**Example - Adding a Pie Chart (FOLLOW THIS PATTERN):**
User: "Add a pie chart showing sales by region"

CRITICAL: Pie charts MUST use "name" and "value" keys (or set custom nameKey/yKey):
Note: Pie chart colors can be customized:
  - Default: Uses modern color palette in sequence (#3b82f6, #8b5cf6, #10b981, etc.)
  - Monochrome: Set "fillColor" in style to use single color (e.g., "#64748b" for gray)
  - Custom: Set "pieColors" array in style for specific colors per slice (e.g., ["#3b82f6", "#8b5cf6", "#10b981"])
{{
  "nodes": [
    {{
      "id": "region-pie-chart",
      "type": "chart",
      "position": {{"x": 100, "y": 100}},
      "style": {{"width": 420, "height": 320}},
      "data": {{
        "label": "Sales by Region",
        "kind": "pie",
        "nameKey": "name",
        "yKey": "value",
        "style": {{
          "showLegend": true,
          "showTooltip": true,
          "outerRadius": 85,
          "innerRadius": 0,
          "showLabels": false,
          // For monochrome: "fillColor": "#64748b"
          // For custom colors: "pieColors": ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"]
        }},
        "data": [
          {{"name": "North", "value": 4500}},
          {{"name": "South", "value": 3200}},
          {{"name": "East", "value": 5100}},
          {{"name": "West", "value": 2800}}
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

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**
**📋 QUICK REFERENCE CARD**
**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

**Request Type → Response:**
- "Show data" / "Visualize" → 10-15+ diverse charts
- "Dashboard" → 10-12+ charts in 3-4 per row layout
- "Report" → 9-12+ charts, A4 format, dense rows
- "Analyze" → 12-15+ charts exploring all angles
- Single chart request → 1 chart as requested

**Layout Templates:**
- **Standard Dashboard**: 3 charts/row, 245px wide, 235px tall, rows at y: 75, 340, 605
- **Dense Report**: 4 charts/row, 185px wide, 215px tall, rows at y: 65, 305, 545
- **General Canvas**: 3-4 charts/row, spacing: 20px horizontal, 280px vertical

**Color Usage:**
- Chart 1: #3b82f6 (Blue)
- Chart 2: #8b5cf6 (Purple)  
- Chart 3: #10b981 (Green)
- Chart 4: #f59e0b (Orange)
- Continue pattern through 8 colors

**Remember:**
✓ CREATE MANY GRAPHS - don't be conservative!
✓ USE ALL AVAILABLE DATA SUBSETS
✓ DENSE HORIZONTAL ROWS (3-4 per row)
✓ DIVERSE CHART TYPES for different insights
✓ PROFESSIONAL DESIGN SYSTEM colors & styling

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

Be creative, helpful, and make beautiful, COMPREHENSIVE visualizations with ALL data embedded!"""
    
    return system_prompt

# ============================================
# Run the server
# ============================================

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.getenv("PYTHON_API_PORT", "8000"))
    
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=port,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )
