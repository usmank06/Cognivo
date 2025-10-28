"""
Test the file processing integration
Run this after both Express and Python APIs are running
"""

import requests
import json
import base64
from io import StringIO

def create_test_csv():
    """Create a simple test CSV in memory"""
    csv_content = """date,amount,category
2024-01-01,100.50,Food
2024-01-15,50.25,Transport
2024-02-01,200.00,Entertainment
2024-02-14,75.50,Food
2024-03-01,150.75,Transport
2024-03-15,300.00,Entertainment
2024-04-01,90.25,Food"""
    return csv_content.encode('utf-8')

def test_python_api_directly():
    """Test the Python API endpoint directly"""
    print("=" * 60)
    print("TEST 1: Python API Direct Test")
    print("=" * 60)
    
    try:
        # Create test CSV
        file_bytes = create_test_csv()
        file_base64 = base64.b64encode(file_bytes).decode('utf-8')
        
        # Call Python API
        response = requests.post(
            'http://localhost:8000/api/process-file',
            json={
                'fileBuffer': file_base64,
                'fileName': 'test.csv',
                'fileType': 'text/csv'
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Python API responded successfully!")
            print(f"\nSuccess: {result.get('success')}")
            
            if result.get('schema'):
                print(f"\nSchema:")
                print(f"  Rows: {result['schema']['rowCount']}")
                print(f"  Columns: {len(result['schema']['columns'])}")
                for col in result['schema']['columns']:
                    print(f"    - {col['name']} ({col['type']})")
            
            if result.get('subsets'):
                print(f"\nSubsets: {len(result['subsets'])} generated")
                for i, subset in enumerate(result['subsets']):
                    print(f"  {i+1}. {subset['description']}")
                    print(f"     Data points: {len(subset['dataPoints'])}")
            
            return True
        else:
            print(f"❌ Python API error: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_file_upload_flow():
    """Test the complete file upload flow through Express"""
    print("\n" + "=" * 60)
    print("TEST 2: Complete Upload Flow (Express → Python)")
    print("=" * 60)
    print("\nNote: You need to be logged in and have a valid username")
    print("This test simulates what the frontend does")
    
    try:
        # Create test CSV as a file-like object
        csv_bytes = create_test_csv()
        
        # Simulate multipart form upload
        files = {
            'files': ('test.csv', csv_bytes, 'text/csv')
        }
        data = {
            'username': 'testuser',
            'userId': 'test123'
        }
        
        response = requests.post(
            'http://localhost:3001/api/files/upload',
            files=files,
            data=data
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ File uploaded successfully!")
            print(f"Response: {json.dumps(result, indent=2)}")
            
            if result.get('success'):
                file_ids = [r.get('fileId') for r in result.get('results', [])]
                print(f"\nFile IDs: {file_ids}")
                print("\nℹ️  Processing is happening in the background")
                print("   Check the MongoDB 'datafiles' collection")
                print("   or use the frontend to see progress")
                return True
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nMake sure:")
        print("  1. Express API is running (port 3001)")
        print("  2. MongoDB is connected")
        return False

def test_health_checks():
    """Test that all services are running"""
    print("=" * 60)
    print("HEALTH CHECKS")
    print("=" * 60)
    
    services = {
        "Python API": "http://localhost:8000/health",
        "Express API": "http://localhost:3001/api/auth/login",  # Just check if reachable
    }
    
    all_healthy = True
    for name, url in services.items():
        try:
            response = requests.get(url, timeout=2)
            if response.status_code < 500:
                print(f"✅ {name} is running")
            else:
                print(f"⚠️  {name} responded but may have issues ({response.status_code})")
                all_healthy = False
        except requests.exceptions.ConnectionError:
            print(f"❌ {name} is not running")
            all_healthy = False
        except requests.exceptions.Timeout:
            print(f"⚠️  {name} timed out")
            all_healthy = False
    
    return all_healthy

if __name__ == "__main__":
    print("\n🧪 File Processing Integration Tests\n")
    
    # Check health first
    if not test_health_checks():
        print("\n⚠️  Some services are not running!")
        print("Start them with: npm run dev")
        exit(1)
    
    print()
    
    # Test Python API directly
    python_ok = test_python_api_directly()
    
    # Test complete flow
    # Note: This requires a valid user in the database
    # upload_ok = test_file_upload_flow()
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Python API: {'✅ PASS' if python_ok else '❌ FAIL'}")
    # print(f"Upload Flow: {'✅ PASS' if upload_ok else '❌ FAIL'}")
    
    print("\n📝 Next Steps:")
    print("1. Uncomment pandas in requirements.txt")
    print("2. Run: cd python-api && pip install -r requirements.txt")
    print("3. Implement the actual processing logic in main.py")
    print("4. Test with real CSV/Excel files via the frontend")
    print("\nSee: python-api/IMPLEMENTATION_GUIDE.md for details")
