#!/usr/bin/env python3
"""Direct MongoDB check for completed_at field"""

import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Import the database module correctly
from backend.app.database import get_database, is_connected
from datetime import datetime

async def check_completed_at_field():
    """Check if completed_at field is being saved properly in MongoDB"""
    
    print("🔍 Checking MongoDB for completed_at field issues")
    print("=" * 50)
    
    if not is_connected():
        print("❌ MongoDB is not connected")
        return
    
    print("✅ MongoDB is connected")
    
    try:
        db = get_database()
        sessions_collection = db.interview_sessions
        
        # Get all sessions
        print("📊 Checking interview sessions...")
        sessions = await sessions_collection.find({}).to_list(length=None)
        
        if not sessions:
            print("ℹ️ No interview sessions found in database")
            return
        
        print(f"Found {len(sessions)} interview sessions")
        print("\n" + "="*60)
        
        completed_count = 0
        null_completed_at_count = 0
        
        for i, session in enumerate(sessions):
            print(f"\n📋 Session {i+1}: {session.get('session_id', 'N/A')}")
            print(f"   User ID: {session.get('user_id', 'N/A')}")
            print(f"   Completed: {session.get('completed', 'N/A')}")
            print(f"   Started at: {session.get('started_at', 'N/A')}")
            print(f"   Completed at: {session.get('completed_at', 'N/A')}")
            print(f"   Duration: {session.get('actual_duration_seconds', 'N/A')} seconds")
            
            if session.get('completed'):
                completed_count += 1
                if session.get('completed_at') is None:
                    null_completed_at_count += 1
                    print("   🚨 ISSUE: completed=True but completed_at is null!")
        
        print("\n" + "="*60)
        print(f"📈 Summary:")
        print(f"   Total sessions: {len(sessions)}")
        print(f"   Completed sessions: {completed_count}")
        print(f"   Sessions with null completed_at: {null_completed_at_count}")
        
        if null_completed_at_count > 0:
            print(f"\n❌ PROBLEM CONFIRMED: {null_completed_at_count} completed sessions have null completed_at field")
        else:
            print(f"\n✅ All completed sessions have proper completed_at timestamps")
        
    except Exception as e:
        print(f"❌ Error checking database: {str(e)}")

if __name__ == "__main__":
    asyncio.run(check_completed_at_field())
