<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# InterviewPilot - Copilot Instructions

This is an AI-powered interview preparation platform built with FastAPI (Python) backend and React.js frontend.

## Project Context

InterviewPilot helps job seekers practice interviews with AI-powered multi-agent interviewers. The system uses Google Gemini for generating questions and providing feedback.

## Tech Stack
- **Backend**: FastAPI, Python, Google Gemini AI, Pydantic
- **Frontend**: React.js, Vite, Tailwind CSS, React Router
- **AI/LLM**: Google Gemini for question generation and evaluation
- **File Processing**: PyPDF2, python-docx for resume parsing

## Architecture

### Multi-Agent System
- **HR Interviewer**: Focuses on cultural fit, communication, soft skills
- **Technical Lead**: Evaluates technical expertise, problem-solving, system design
- **Behavioral Interviewer**: Uses STAR method, assesses past experiences

### Key Features
- Resume upload and parsing (PDF, DOCX, TXT)
- Job description analysis
- Personalized question generation
- Real-time feedback and scoring
- Interview session management
- Performance analytics dashboard

## Code Style Guidelines

### Python/FastAPI (Backend)
- Use async/await for all route handlers
- Follow FastAPI best practices for dependency injection
- Use Pydantic models for request/response validation
- Implement proper error handling with HTTPException
- Use typing hints consistently
- Follow PEP 8 style guidelines

### React/JavaScript (Frontend)
- Use functional components with hooks
- Implement proper error boundaries
- Use React Router for navigation
- Apply Tailwind CSS utility classes
- Follow component composition patterns
- Use proper state management with useState/useEffect

### API Design
- RESTful endpoints with clear naming
- Consistent error response format
- Proper HTTP status codes
- Input validation on all endpoints
- CORS configuration for frontend integration

## File Structure
- `backend/app/models/` - Pydantic models
- `backend/app/services/` - Business logic (Gemini, resume parsing)
- `backend/app/agents/` - Multi-agent interviewer implementations
- `backend/app/routes/` - API route definitions
- `frontend/src/components/` - Reusable React components
- `frontend/src/pages/` - Page-level components
- `frontend/src/services/` - API service layer

## Important Considerations
- Handle Gemini API rate limits and errors gracefully
- Ensure resume parsing works with various file formats
- Implement proper loading states and user feedback
- Maintain responsive design for mobile compatibility
- Follow accessibility guidelines for UI components
