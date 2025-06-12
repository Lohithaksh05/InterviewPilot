import google.generativeai as genai
from decouple import config
import json
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        api_key = config('GEMINI_API_KEY', default='')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
    
    async def generate_content(self, prompt: str) -> str:
        """Generate content using Gemini API"""
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error generating content: {str(e)}")
            raise
    
    async def generate_questions(self, 
                               resume_text: str, 
                               job_description: str, 
                               interviewer_type: str,
                               num_questions: int = 5) -> List[str]:
        """Generate interview questions based on resume and job description"""
        
        interviewer_prompts = {
            "hr": """You are an HR interviewer. Generate {num_questions} HR-focused interview questions that assess:
            - Cultural fit
            - Communication skills
            - Career goals
            - Work experience
            - Behavioral aspects""",
            
            "tech_lead": """You are a Technical Lead interviewer. Generate {num_questions} technical interview questions that assess:
            - Technical skills mentioned in resume
            - Problem-solving abilities
            - System design knowledge
            - Coding experience
            - Technology stack expertise""",
            
            "behavioral": """You are a Behavioral interviewer. Generate {num_questions} behavioral interview questions that assess:
            - Leadership abilities
            - Teamwork and collaboration
            - Conflict resolution
            - Adaptability
            - Decision-making skills"""
        }
        
        prompt = f"""
        {interviewer_prompts.get(interviewer_type, interviewer_prompts['hr']).format(num_questions=num_questions)}
        
        RESUME:
        {resume_text}
        
        JOB DESCRIPTION:
        {job_description}
        
        Please generate exactly {num_questions} relevant interview questions. 
        Return the questions as a JSON array of strings.
        Example format: ["Question 1?", "Question 2?", "Question 3?"]
        """
        
        try:
            response = await self.generate_content(prompt)
            # Parse JSON response
            questions = json.loads(response)
            return questions if isinstance(questions, list) else [response]
        except json.JSONDecodeError:
            # Fallback: split by lines and clean up
            lines = response.strip().split('\n')
            questions = [line.strip() for line in lines if line.strip() and '?' in line]
            return questions[:num_questions]
    
    async def evaluate_answer(self, 
                            question: str, 
                            answer: str, 
                            interviewer_type: str,
                            job_description: str) -> Dict[str, Any]:
        """Evaluate interview answer and provide feedback"""
        
        evaluation_criteria = {
            "hr": "communication clarity, cultural fit, professional experience relevance",
            "tech_lead": "technical accuracy, problem-solving approach, depth of knowledge",
            "behavioral": "specific examples, leadership qualities, situational handling"
        }
        
        prompt = f"""
        You are a {interviewer_type} interviewer evaluating a candidate's answer.
        
        QUESTION: {question}
        CANDIDATE'S ANSWER: {answer}
        JOB DESCRIPTION: {job_description}
        
        Evaluate the answer based on: {evaluation_criteria.get(interviewer_type, 'overall quality')}
        
        Provide your evaluation in the following JSON format:
        {{
            "score": 0-10,
            "feedback": "detailed feedback on the answer",
            "strengths": ["strength 1", "strength 2"],
            "improvements": ["improvement 1", "improvement 2"],
            "follow_up_questions": ["follow up question 1", "follow up question 2"]
        }}
        """
        
        try:
            response = await self.generate_content(prompt)
            evaluation = json.loads(response)
            return evaluation
        except json.JSONDecodeError:
            return {
                "score": 5,
                "feedback": response,
                "strengths": [],
                "improvements": [],
                "follow_up_questions": []
            }
    
    async def generate_interview_summary(self, 
                                       questions: List[str], 
                                       answers: List[str], 
                                       interviewer_type: str) -> Dict[str, Any]:
        """Generate overall interview summary and recommendations"""
        
        qa_pairs = "\n".join([f"Q: {q}\nA: {a}\n" for q, a in zip(questions, answers)])
        
        prompt = f"""
        You are a {interviewer_type} interviewer providing final interview summary.
        
        INTERVIEW Q&A:
        {qa_pairs}
        
        Provide a comprehensive evaluation in JSON format:
        {{
            "overall_score": 0-10,
            "summary": "overall performance summary",
            "key_strengths": ["strength 1", "strength 2", "strength 3"],
            "areas_for_improvement": ["improvement 1", "improvement 2", "improvement 3"],
            "recommendation": "hire/reject/maybe with reasoning",
            "next_steps": ["step 1", "step 2"]
        }}
        """
        
        try:
            response = await self.generate_content(prompt)
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "overall_score": 5,
                "summary": response,
                "key_strengths": [],
                "areas_for_improvement": [],
                "recommendation": "Need more evaluation",
                "next_steps": []
            }
