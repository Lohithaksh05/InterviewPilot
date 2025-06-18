# InterviewPilot

AI-powered interview preparation platform with multi-agent system for realistic interview practice.

## Features

### Core Interview System
- **AI-Powered Interviews**: Leverages Google Gemini AI for dynamic question generation and real-time evaluation
- **Multi-Agent System**: Three specialized interviewer personas:
  - **HR Interviewer**: Focuses on cultural fit, communication skills, and soft skills
  - **Technical Lead**: Evaluates technical expertise, problem-solving, and system design
  - **Behavioral Interviewer**: Uses STAR method to assess past experiences and leadership
- **Resume Analysis**: Upload and parse resumes in PDF, DOCX, or text format with intelligent content extraction
- **Job Description Matching**: Analyzes job requirements to generate personalized interview questions

### Voice & Audio Features
- **Voice Recording**: Record interview responses with high-quality audio capture
- **Live Speech Recognition**: Real-time speech-to-text transcription during interviews
- **Voice Analysis**: Advanced audio analysis including:
  - Speech clarity and confidence scoring
  - Filler word detection (um, uh, like, etc.)
  - Speaking pace and rhythm analysis
  - Voice confidence metrics
- **Audio Playback**: Review recorded responses with built-in audio player

### Interview Templates
- **Interview Templates**: Pre-built templates for different roles and industries
- **Role-Based Questions**: Customized question sets based on job position
- **Key Skills Mapping**: Templates include relevant technical and soft skills assessment

### Performance Analytics & Insights
- **Comprehensive Dashboard**: Track interview performance across multiple sessions
- **Progress Tracking**: Monitor improvement over time with detailed metrics
- **Performance Scoring**: AI-powered scoring system for responses and overall performance
- **Personalized Recommendations**: Get specific advice based on your performance patterns
- **Session Analytics**: Detailed breakdown of each interview session including:
  - Response quality scores
  - Time management analysis
  - Areas for improvement
  - Strengths identification

### Technical Features
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **Real-time Feedback**: Get instant AI-powered feedback on your responses
- **Session Management**: Persistent interview sessions with MongoDB storage
- **User Authentication**: Secure user accounts and interview history
- **Cross-Platform**: Works on desktop and mobile devices

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Google Gemini**: AI/LLM for question generation and evaluation
- **MongoDB**: Database for persistent storage and user data
- **Pydantic**: Data validation and settings management
- **Python libraries**: PyPDF2, python-docx, textblob for resume parsing
- **Audio Processing**: Speech recognition and voice analysis capabilities

### Frontend
- **React.js**: UI library with Vite build tool
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **React Hot Toast**: Toast notifications
- **Lucide React**: Icon library
- **Web Audio API**: For voice recording and audio processing

## Project Structure

```
InterviewPilot/
├── backend/
│   ├── main.py                    # FastAPI application entry point
│   ├── requirements.txt           # Python dependencies
│   ├── render.yaml               # Render.com deployment config
│   ├── .env.example              # Environment variables template
│   └── app/
│       ├── models/               # Pydantic models
│       │   ├── interview_models.py
│       │   ├── user_models.py
│       │   ├── template_models.py
│       │   ├── voice_models.py
│       │   └── analytics_models.py
│       ├── services/             # Business logic
│       │   ├── gemini_service.py
│       │   ├── resume_parser.py
│       │   ├── interview_service.py
│       │   ├── template_service.py
│       │   ├── voice_analysis_service.py
│       │   └── auth_service.py
│       ├── agents/               # Multi-agent interviewer system
│       │   └── interviewer_agents.py
│       ├── routes/               # API endpoints
│       │   ├── interview.py
│       │   ├── resume.py
│       │   ├── agents.py
│       │   ├── templates.py
│       │   ├── voice_analysis.py
│       │   └── auth.py
│       └── database/             # Database integration
│           ├── mongodb.py
│           └── memory_db.py
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable React components
│   │   │   ├── VoiceRecorder.jsx
│   │   │   ├── InterviewTemplates.jsx
│   │   │   ├── PerformanceAnalytics.jsx
│   │   │   └── VoiceAnalysis.jsx
│   │   ├── pages/               # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Interview.jsx
│   │   │   ├── Results.jsx
│   │   │   └── Analytics.jsx
│   │   ├── services/            # API service layer
│   │   │   ├── api.js
│   │   │   └── audioTranscription.js
│   │   └── hooks/               # Custom React hooks
│   │       ├── useVoiceRecording.js
│   │       └── useLiveVoiceRecording.js
│   ├── package.json             # Node.js dependencies
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── vite.config.js           # Vite build configuration
│   └── vercel.json              # Vercel deployment config
├── DEPLOYMENT.md                # Deployment documentation
├── SIMPLE_DEPLOY.md            # Quick deployment guide
└── README.md                   # Project documentation
```

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- MongoDB (local installation or MongoDB Atlas)
- Google Gemini API key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # macOS/Linux
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create environment file:
   ```bash
   copy .env.example .env  # Windows
   # cp .env.example .env  # macOS/Linux
   ```

5. Configure environment variables in `.env`:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   MONGODB_URL=mongodb://localhost:27017/interviewpilot
   # Or for MongoDB Atlas:
   # MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/interviewpilot
   ```

6. Run the server:
   ```bash
   python main.py
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## Deployment

InterviewPilot can be deployed to various platforms. The project includes configuration files for easy deployment:

### Production Environment Setup

1. **Environment Variables**: Copy `.env.example` files and configure:
   ```bash
   # Backend
   cp backend/.env.example backend/.env.production
   
   # Frontend  
   cp frontend/.env.example frontend/.env.production
   ```

2. **Database**: Set up MongoDB Atlas or local MongoDB instance
3. **API Keys**: Configure Google Gemini API key in production environment

### Deployment Options

- **Render**: Use `backend/render.yaml` for backend deployment
- **Vercel**: Use `frontend/vercel.json` for frontend deployment  
- **Docker**: Container support available
- **Traditional Hosting**: Standard web server deployment

For detailed deployment instructions, see:
- `DEPLOYMENT.md` - Comprehensive deployment guide
- `SIMPLE_DEPLOY.md` - Quick deployment steps

## Usage

1. **Start Interview**: Upload your resume and job description
2. **Choose Interviewer**: Select from HR, Technical Lead, or Behavioral interviewer
3. **Practice**: Answer AI-generated questions tailored to your profile
4. **Record Responses**: Use voice recording for realistic practice
5. **Get Feedback**: Receive detailed feedback and improvement suggestions
6. **Analyze Performance**: Review voice analysis and speaking metrics
7. **Track Progress**: View your performance analytics in the dashboard

## API Endpoints

### Resume
- `POST /api/resume/upload` - Upload resume file
- `POST /api/resume/parse-text` - Parse resume from text

### Interview
- `POST /api/interview/start` - Start new interview session
- `GET /api/interview/session/{id}` - Get session details
- `POST /api/interview/answer` - Submit answer
- `GET /api/interview/summary/{id}` - Get interview summary
- `GET /api/interview/sessions` - List all sessions
- `DELETE /api/interview/session/{id}` - Delete session

### Templates
- `GET /api/templates/` - Get all interview templates
- `POST /api/templates/` - Create new template
- `GET /api/templates/{id}` - Get specific template
- `PUT /api/templates/{id}` - Update template
- `DELETE /api/templates/{id}` - Delete template

### Voice Analysis
- `POST /api/voice/analyze` - Analyze voice recording
- `POST /api/voice/transcribe` - Transcribe audio to text
- `GET /api/voice/analysis/{id}` - Get voice analysis results

### Agents
- `GET /api/agents/types` - Get interviewer types
- `POST /api/agents/questions` - Generate questions
- `POST /api/agents/evaluate` - Evaluate answers
- `POST /api/agents/follow-up` - Generate follow-up questions

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

## Multi-Agent System

### HR Interviewer
- Focuses on cultural fit and communication skills
- Assesses soft skills and team dynamics
- Evaluates career goals and motivation

### Technical Lead
- Tests technical expertise and problem-solving
- Evaluates system design knowledge
- Assesses coding practices and methodologies

### Behavioral Interviewer
- Uses STAR method for situational questions
- Focuses on past experiences and achievements
- Evaluates leadership and decision-making skills

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Getting Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `.env` file

## Troubleshooting

### Common Issues

1. **Gemini API errors**: Ensure your API key is valid and has sufficient quota
2. **CORS errors**: Make sure the backend is running on port 8000
3. **File upload issues**: Check file size limits and supported formats
4. **Build errors**: Ensure all dependencies are installed correctly

### Support

For issues and questions, please create an issue in the GitHub repository.
