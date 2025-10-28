"""
Quick test script to verify Python API is working
Run this after installing dependencies: python test_api.py
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test the health endpoint"""
    print("Testing /health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
        print("   Make sure the Python API is running: python main.py")

def test_process_data():
    """Test the process-data endpoint"""
    print("\nTesting /api/process-data endpoint...")
    try:
        data = {
            "data": [
                {"x": 1, "y": 10},
                {"x": 2, "y": 20},
                {"x": 3, "y": 30}
            ],
            "operation": "normalize"
        }
        response = requests.post(f"{BASE_URL}/api/process-data", json=data)
        if response.status_code == 200:
            print("✅ Process data passed")
            print(f"   Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"❌ Process data failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_analyze():
    """Test the analyze endpoint"""
    print("\nTesting /api/analyze endpoint...")
    try:
        data = {
            "values": [1, 2, 3, 4, 5],
            "column": "test_data"
        }
        response = requests.post(f"{BASE_URL}/api/analyze", json=data)
        if response.status_code == 200:
            print("✅ Analyze passed")
            print(f"   Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"❌ Analyze failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("Python API Test Suite")
    print("=" * 50)
    
    test_health()
    test_process_data()
    test_analyze()
    
    print("\n" + "=" * 50)
    print("Tests complete!")
    print("=" * 50)
    print("\nNext steps:")
    print("1. Visit http://localhost:8000/docs for interactive API docs")
    print("2. Use pythonClient.ts to call these endpoints from TypeScript")
