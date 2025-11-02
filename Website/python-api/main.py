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
from anthropic import AsyncAnthropic
from dotenv import load_dotenv

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
    Process CSV file - YOU WILL IMPLEMENT THE ACTUAL LOGIC HERE
    """
    try:
        # TODO: Add your actual CSV processing logic
        # Example with pandas:
        # import pandas as pd
        # df = pd.read_csv(io.BytesIO(file_bytes))
        # 
        # Then:
        # - Analyze columns and types
        # - Create schema
        # - Generate subsets (time series, distributions, correlations)
        
        # For now, return dummy data to show structure
        schema = FileSchema(
            columns=[
                {"name": "date", "type": "string", "description": "Transaction date"},
                {"name": "amount", "type": "number", "description": "Purchase amount"},
                {"name": "category", "type": "string", "description": "Purchase category"},
            ],
            rowCount=1500,
            summary=f"Data extracted from {file_name}. Contains 1,500 records with dates, amounts, and categories."
        )
        
        subsets = [
            DataSubset(
                description="Total purchases over time",
                xAxisName="Date",
                xAxisDescription="Transaction date (monthly aggregation)",
                yAxisName="Total Amount",
                yAxisDescription="Sum of all purchase amounts",
                dataPoints=[
                    {"x": "2024-01", "y": 45000},
                    {"x": "2024-02", "y": 52000},
                    {"x": "2024-03", "y": 48000},
                    {"x": "2024-04", "y": 55000},
                    {"x": "2024-05", "y": 51000},
                ]
            ),
            DataSubset(
                description="Purchase distribution by category",
                xAxisName="Category",
                xAxisDescription="Purchase categories",
                yAxisName="Count",
                yAxisDescription="Number of purchases in each category",
                dataPoints=[
                    {"x": "Electronics", "y": 250},
                    {"x": "Groceries", "y": 380},
                    {"x": "Clothing", "y": 180},
                    {"x": "Entertainment", "y": 120},
                    {"x": "Transportation", "y": 200},
                ]
            ),
        ]
        
        return FileProcessingResponse(
            success=True,
            file_schema=schema,
            subsets=subsets
        )
        
    except Exception as e:
        print(f"Error processing CSV: {str(e)}")
        raise

async def process_excel_file(file_bytes: bytes, file_name: str) -> FileProcessingResponse:
    """
    Process Excel file - YOU WILL IMPLEMENT THE ACTUAL LOGIC HERE
    """
    try:
        # TODO: Add your actual Excel processing logic
        # Example with pandas:
        # import pandas as pd
        # df = pd.read_excel(io.BytesIO(file_bytes))
        # 
        # Then same as CSV - analyze and generate schema/subsets
        
        # For now, return dummy data
        schema = FileSchema(
            columns=[
                {"name": "id", "type": "number", "description": "Record ID"},
                {"name": "name", "type": "string", "description": "Product name"},
                {"name": "price", "type": "number", "description": "Product price"},
            ],
            rowCount=850,
            summary=f"Data extracted from {file_name}. Contains 850 product records."
        )
        
        subsets = [
            DataSubset(
                description="Price distribution",
                xAxisName="Price Range",
                xAxisDescription="Product price ranges",
                yAxisName="Count",
                yAxisDescription="Number of products in each range",
                dataPoints=[
                    {"x": "$0-$50", "y": 200},
                    {"x": "$50-$100", "y": 350},
                    {"x": "$100-$200", "y": 180},
                    {"x": "$200+", "y": 120},
                ]
            ),
        ]
        
        return FileProcessingResponse(
            success=True,
            file_schema=schema,
            subsets=subsets
        )
        
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
