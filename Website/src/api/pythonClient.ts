/**
 * Python API Client
 * Helper functions to call the FastAPI Python server
 */

const PYTHON_API_URL = 'http://localhost:8000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Generic API call helper
 */
async function callPythonAPI<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<ApiResponse<T>> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${PYTHON_API_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Python API call failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if Python API is healthy
 */
export async function checkPythonAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PYTHON_API_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Process data using Python backend
 */
export async function processData(
  data: any[],
  operation: string
): Promise<ApiResponse<any>> {
  return callPythonAPI('/api/process-data', 'POST', { data, operation });
}

/**
 * Analyze data using Python
 */
export async function analyzeData(data: any): Promise<ApiResponse<any>> {
  return callPythonAPI('/api/analyze', 'POST', data);
}

/**
 * Make ML predictions
 */
export async function mlPredict(features: any): Promise<ApiResponse<any>> {
  return callPythonAPI('/api/ml/predict', 'POST', features);
}

/**
 * Example: Parse CSV data using Python pandas
 * Add this endpoint to your Python API if needed
 */
export async function parseCSV(
  fileContent: string,
  options?: any
): Promise<ApiResponse<any>> {
  return callPythonAPI('/api/parse-csv', 'POST', { 
    content: fileContent, 
    options 
  });
}

/**
 * Example: Generate data statistics
 * Add this endpoint to your Python API if needed
 */
export async function generateStatistics(
  data: any[]
): Promise<ApiResponse<any>> {
  return callPythonAPI('/api/statistics', 'POST', { data });
}
