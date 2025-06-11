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
        self.model = genai.GenerativeModel('gemini-2.0-flash')
    
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
                               difficulty: str = "medium",
                               num_questions: int = 5) -> List[str]:
        """Generate interview questions based on resume, job description, and difficulty level"""
        
        difficulty_guidelines = {
            "easy": {
                "hr": "Basic questions about background, motivation, and simple behavioral scenarios. Focus on straightforward experiences and clear yes/no situations.",
                "tech_lead": "Fundamental technical concepts, basic coding practices, and simple problem-solving scenarios. Avoid complex system design.",
                "behavioral": "Simple STAR method questions about common workplace situations. Focus on direct, uncomplicated scenarios."
            },
            "medium": {
                "hr": "Moderate complexity questions involving situational judgment, team dynamics, and multi-step problem solving.",
                "tech_lead": "Intermediate technical concepts, system design basics, debugging scenarios, and trade-off discussions.",
                "behavioral": "Complex behavioral scenarios requiring detailed analysis, leadership challenges, and cross-functional collaboration."
            },
            "hard": {
                "hr": "Complex strategic thinking, conflict resolution, cultural transformation, and executive-level decision making scenarios.",
                "tech_lead": "Advanced system architecture, scalability challenges, complex debugging, performance optimization, and technical leadership scenarios.",
                "behavioral": "High-stakes leadership situations, organizational change management, complex stakeholder management, and crisis leadership."
            }
        }
        
        interviewer_prompts = {
            "hr": f"""You are an HR interviewer conducting a {difficulty.upper()} level interview. Generate {{num_questions}} HR-focused interview questions that assess:
            - Cultural fit and values alignment
            - Communication and interpersonal skills
            - Career goals and motivation
            - Work experience and achievements
            - Behavioral competencies
            
            {difficulty_guidelines[difficulty]["hr"]}""",
            
            "tech_lead": f"""You are a Technical Lead interviewer conducting a {difficulty.upper()} level interview. Generate {{num_questions}} technical interview questions that assess:
            - Technical skills mentioned in resume
            - Problem-solving and analytical abilities
            - System design and architecture knowledge
            - Coding experience and best practices
            - Technology stack expertise
            
            {difficulty_guidelines[difficulty]["tech_lead"]}""",
            
            "behavioral": f"""You are a Behavioral interviewer conducting a {difficulty.upper()} level interview. Generate {{num_questions}} behavioral interview questions that assess:
            - Leadership abilities and experience
            - Teamwork and collaboration skills
            - Conflict resolution and negotiation
            - Adaptability and change management
            - Decision-making and strategic thinking
            
            {difficulty_guidelines[difficulty]["behavioral"]}"""
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
        }}        """
        
        try:
            response = await self.generate_content(prompt)
            
            # Handle cases where Gemini returns JSON wrapped in markdown code blocks
            if response.strip().startswith('```json'):
                # Extract JSON from markdown code block
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                json_str = response[json_start:json_end]
                evaluation = json.loads(json_str)
            else:
                evaluation = json.loads(response)
            
            # Ensure all required fields exist
            if not isinstance(evaluation, dict):
                raise json.JSONDecodeError("Invalid response format", "", 0)
                
            # Validate and set defaults for missing fields
            evaluation.setdefault("score", 5)
            evaluation.setdefault("feedback", "No feedback provided")
            evaluation.setdefault("strengths", [])
            evaluation.setdefault("improvements", [])
            evaluation.setdefault("follow_up_questions", [])
            
            # Ensure score is within valid range
            score = evaluation.get("score", 5)
            if isinstance(score, str):
                try:
                    score = float(score)
                except (ValueError, TypeError):
                    score = 5
            evaluation["score"] = max(0, min(10, score))
            
            return evaluation
            
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            logger.error(f"Error parsing evaluation response: {str(e)}")
            logger.error(f"Raw response: {response}")
            return {
                "score": 5,
                "feedback": f"Error parsing AI response: {response}",
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
            
            # Handle cases where Gemini returns JSON wrapped in markdown code blocks
            if response.strip().startswith('```json'):
                # Extract JSON from markdown code block
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                json_str = response[json_start:json_end]
                summary = json.loads(json_str)
            else:
                summary = json.loads(response)
            
            # Ensure all required fields exist and validate data types
            if not isinstance(summary, dict):
                raise json.JSONDecodeError("Invalid response format", "", 0)
                
            # Validate and set defaults for missing fields
            summary.setdefault("overall_score", 5)
            summary.setdefault("summary", "Overall performance evaluation")
            summary.setdefault("key_strengths", [])
            summary.setdefault("areas_for_improvement", [])
            summary.setdefault("recommendation", "Need more evaluation")
            summary.setdefault("next_steps", [])
            
            # Ensure score is within valid range
            score = summary.get("overall_score", 5)
            if isinstance(score, str):
                try:
                    score = float(score)
                except (ValueError, TypeError):
                    score = 5
            summary["overall_score"] = max(0, min(10, score))
              # Ensure arrays are actually arrays
            for field in ["key_strengths", "areas_for_improvement", "next_steps"]:
                if not isinstance(summary.get(field), list):
                    summary[field] = []
            
            return summary
            
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            logger.error(f"Error parsing summary response: {str(e)}")
            logger.error(f"Raw response: {response}")
            
            # Try to extract meaningful content from the raw response
            clean_summary = response.strip()
            
            # If the response looks like JSON, try to clean it up
            if clean_summary.startswith('{') and clean_summary.endswith('}'):
                clean_summary = "The interview evaluation was completed, but there was an issue formatting the detailed feedback. Please contact support if this persists."
            
            # Limit the length of the summary to avoid displaying very long raw responses
            if len(clean_summary) > 500:
                clean_summary = clean_summary[:500] + "... [Response truncated due to formatting issues]"
            
            return {
                "overall_score": 5,
                "summary": clean_summary,
                "key_strengths": ["Communication skills demonstrated"],
                "areas_for_improvement": ["Technical formatting of AI response needs improvement"],
                "recommendation": "Please try generating the summary again or contact support",
                "next_steps": ["Review interview recording", "Request manual evaluation if needed"]
            }
