/**
 * Example: Using Python API in your components
 * 
 * This file shows how to call the FastAPI Python server
 * from your React TypeScript components
 */

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  checkPythonAPIHealth, 
  processData, 
  analyzeData, 
  mlPredict 
} from '../api/pythonClient';

export function PythonAPIExample() {
  const [isHealthy, setIsHealthy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Check Python API health on mount
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    const healthy = await checkPythonAPIHealth();
    setIsHealthy(healthy);
    if (!healthy) {
      toast.error('Python API is not running');
    }
  };

  const handleProcessData = async () => {
    setLoading(true);
    try {
      const sampleData = [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 30 },
        { x: 4, y: 40 },
        { x: 5, y: 50 },
      ];

      const response = await processData(sampleData, 'normalize');
      
      if (response.success) {
        setResult(response.data);
        toast.success('Data processed successfully!');
      } else {
        toast.error(response.error || 'Processing failed');
      }
    } catch (error) {
      toast.error('Failed to process data');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeData = async () => {
    setLoading(true);
    try {
      const sampleData = {
        values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        column: 'sales'
      };

      const response = await analyzeData(sampleData);
      
      if (response.success) {
        setResult(response.data);
        toast.success('Analysis complete!');
      } else {
        toast.error(response.error || 'Analysis failed');
      }
    } catch (error) {
      toast.error('Failed to analyze data');
    } finally {
      setLoading(false);
    }
  };

  const handleMLPredict = async () => {
    setLoading(true);
    try {
      const features = {
        feature1: 1.5,
        feature2: 2.3,
        feature3: 0.8
      };

      const response = await mlPredict(features);
      
      if (response.success) {
        setResult(response.data);
        toast.success('Prediction complete!');
      } else {
        toast.error(response.error || 'Prediction failed');
      }
    } catch (error) {
      toast.error('Failed to make prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Python API Integration</CardTitle>
            <Badge variant={isHealthy ? 'default' : 'destructive'}>
              {isHealthy ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleProcessData} 
              disabled={loading || !isHealthy}
            >
              Process Data
            </Button>
            <Button 
              onClick={handleAnalyzeData} 
              disabled={loading || !isHealthy}
              variant="outline"
            >
              Analyze Data
            </Button>
            <Button 
              onClick={handleMLPredict} 
              disabled={loading || !isHealthy}
              variant="outline"
            >
              ML Predict
            </Button>
            <Button 
              onClick={checkHealth} 
              variant="ghost"
            >
              Check Health
            </Button>
          </div>

          {result && (
            <Card className="bg-muted">
              <CardContent className="pt-6">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. In Your Components:</h3>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">
{`import { processData, analyzeData } from '../api/pythonClient';

// Example: Process data
const response = await processData(myData, 'normalize');
if (response.success) {
  console.log(response.data);
}`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. In Your Python API:</h3>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">
{`# Add your pandas/numpy logic in python-api/main.py

@app.post("/api/process-data")
async def process_data(request: ProcessDataRequest):
    import pandas as pd
    df = pd.DataFrame(request.data)
    # Your processing logic here
    return {"success": True, "result": df.to_dict()}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
