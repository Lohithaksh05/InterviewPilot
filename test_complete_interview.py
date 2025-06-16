#!/usr/bin/env python3
"""Test script to check if complete interview functionality works properly"""

import asyncio
import requests
import json
from datetime import datetime

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_USER_ID = "test_user_123"

async def test_complete_interview():
    """Test the complete interview functionality"""
    
    print("🧪 Testing Complete Interview Functionality")
    print("=" * 50)
    
    # First, let's create a test interview session
    print("1. Creating a test interview session...")
    
    create_data = {
        "interviewer_type": "hr",
        "difficulty": "medium",
        "job_description": "Test job description",
        "resume_text": "Test resume content",
        "num_questions": 3
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer test_token_{TEST_USER_ID}"
    }
    
    try:
        # Create interview session
        response = requests.post(f"{BASE_URL}/interview/start", 
                               json=create_data, 
                               headers=headers)
        
        if response.status_code != 200:
            print(f"❌ Failed to create interview session: {response.status_code}")
            print(f"Response: {response.text}")
            return
        
        session_data = response.json()
        session_id = session_data["session_id"]
        print(f"✅ Created interview session: {session_id}")
        
        # Start the interview session
        print("2. Starting the interview session...")
        start_response = requests.post(f"{BASE_URL}/interview/start-session/{session_id}", 
                                     headers=headers)
        
        if start_response.status_code == 200:
            print("✅ Interview session started successfully")
        else:
            print(f"⚠️ Warning: Could not start session (status: {start_response.status_code})")
        
        # Wait a moment to simulate some time passing
        print("3. Simulating interview time...")
        await asyncio.sleep(2)
        
        # Complete the interview
        print("4. Completing the interview...")
        complete_response = requests.post(f"{BASE_URL}/interview/complete/{session_id}", 
                                        headers=headers)
        
        if complete_response.status_code != 200:
            print(f"❌ Failed to complete interview: {complete_response.status_code}")
            print(f"Response: {complete_response.text}")
            return
        
        complete_data = complete_response.json()
        print(f"✅ Interview completed successfully: {complete_data}")
        
        # Check the session to see if completed_at is set
        print("5. Checking session data...")
        session_response = requests.get(f"{BASE_URL}/interview/session/{session_id}", 
                                      headers=headers)
        
        if session_response.status_code != 200:
            print(f"❌ Failed to get session data: {session_response.status_code}")
            return
        
        session = session_response.json()
        print(f"📊 Session completed status: {session.get('completed', 'N/A')}")
        print(f"⏰ Session started_at: {session.get('started_at', 'N/A')}")
        print(f"🏁 Session completed_at: {session.get('completed_at', 'N/A')}")
        print(f"⏱️ Actual duration: {session.get('actual_duration_seconds', 'N/A')} seconds")
        
        # Check if completed_at is properly set
        if session.get('completed_at'):
            print("✅ SUCCESS: completed_at field is properly set!")
        else:
            print("❌ ISSUE: completed_at field is null or missing!")
            
        # Clean up - delete the test session
        print("6. Cleaning up test session...")
        delete_response = requests.delete(f"{BASE_URL}/interview/session/{session_id}", 
                                        headers=headers)
        
        if delete_response.status_code == 200:
            print("✅ Test session cleaned up successfully")
        else:
            print(f"⚠️ Warning: Could not clean up test session (status: {delete_response.status_code})")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {str(e)}")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_complete_interview())
