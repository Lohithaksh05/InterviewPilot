# InterviewPilot

AI-powered interview preparation platform with multi-agent system for realistic interview practice.

## Features

- **Multi-Agent Interviewer System**: Practice with specialized AI agents (HR, Technical Lead, Behavioral)
- **Resume Parsing**: Upload PDF, DOCX, or text resumes for personalized questions
- **Real-time Feedback**: Get detailed AI feedback using Google Gemini
- **Performance Analytics**: Track progress with comprehensive scoring and recommendations
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Google Gemini**: AI/LLM for question generation and evaluation
- **Pydantic**: Data validation and settings management
- **Python libraries**: PyPDF2, python-docx, textblob for resume parsing

### Frontend
- **React.js**: UI library with Vite build tool
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **React Hot Toast**: Toast notifications
- **Lucide React**: Icon library

## Project Structure

```
InterviewPilot/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example           # Environment variables template
│   └── app/
│       ├── models/            # Pydantic models
│       ├── services/          # Business logic (Gemini, Resume parsing)
│       ├── agents/            # Multi-agent interviewer system
│       └── routes/            # API endpoints
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/            # Page components
│   │   └── services/         # API service layer
│   ├── package.json          # Node.js dependencies
│   └── tailwind.config.js    # Tailwind CSS configuration
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
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

5. Add your Google Gemini API key to `.env`:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
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

## Usage

1. **Start Interview**: Upload your resume and job description
2. **Choose Interviewer**: Select from HR, Technical Lead, or Behavioral interviewer
3. **Practice**: Answer AI-generated questions tailored to your profile
4. **Get Feedback**: Receive detailed feedback and improvement suggestions
5. **Track Progress**: View your performance analytics in the dashboard

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

### Agents
- `GET /api/agents/types` - Get interviewer types
- `POST /api/agents/questions` - Generate questions
- `POST /api/agents/evaluate` - Evaluate answers
- `POST /api/agents/follow-up` - Generate follow-up questions

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
