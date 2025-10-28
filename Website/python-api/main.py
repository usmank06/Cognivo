from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import io
import base64

app = FastAPI(title="Noesis Python API", version="1.0.0")

# CORS middleware to allow requests from your React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3001"],  # Vite + Express
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# ============================================
# Routes
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint - verify Python API is running"""
    return {
        "status": "healthy",
        "message": "Python API is running!"
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
