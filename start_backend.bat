@echo off
echo Starting InterviewPilot Backend...
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
