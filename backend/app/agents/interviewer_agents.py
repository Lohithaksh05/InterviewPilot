from abc import ABC, abstractmethod
from typing import List, Dict, Any
from ..services.gemini_service import GeminiService
from ..models.interview_models import InterviewerType

class BaseInterviewer(ABC):
    """Base class for all interviewer agents"""
    
    def __init__(self, gemini_service: GeminiService):
        self.gemini_service = gemini_service
        self.interviewer_type = None
        self.personality = ""
        self.focus_areas = []
    @abstractmethod
    async def generate_questions(self, resume_text: str, job_description: str, difficulty: str = "medium", num_questions: int = 5) -> List[str]:
        """Generate interview questions based on agent's specialty"""
        pass
    
    @abstractmethod
    async def evaluate_answer(self, question: str, answer: str, job_description: str) -> Dict[str, Any]:
        """Evaluate answer based on agent's criteria"""
        pass
    
    async def get_follow_up_question(self, original_question: str, answer: str) -> str:
        """Generate a follow-up question based on the answer"""
        prompt = f"""
        As a {self.interviewer_type} interviewer, you asked: "{original_question}"
        The candidate answered: "{answer}"
        
        Generate ONE relevant follow-up question to dig deeper into their response.
        Make it specific and insightful based on their answer.
        """
        
        return await self.gemini_service.generate_content(prompt)

class HRInterviewer(BaseInterviewer):
    """HR Interviewer Agent - Focuses on culture fit, communication, and soft skills"""
    
    def __init__(self, gemini_service: GeminiService):
        super().__init__(gemini_service)
        self.interviewer_type = InterviewerType.HR
        self.personality = "Professional, empathetic, and focused on cultural alignment"
        self.focus_areas = [
            "Cultural fit and values alignment",
            "Communication and interpersonal skills", 
            "Career goals and motivation",
            "Work-life balance and team dynamics",
            "Company culture adaptation"
        ]
    async def generate_questions(self, resume_text: str, job_description: str, difficulty: str = "medium", num_questions: int = 5) -> List[str]:
        """Generate HR-focused interview questions"""
        return await self.gemini_service.generate_questions(
            resume_text, job_description, "hr", difficulty, num_questions
        )
    
    async def evaluate_answer(self, question: str, answer: str, job_description: str) -> Dict[str, Any]:
        """Evaluate answer from HR perspective"""
        return await self.gemini_service.evaluate_answer(
            question, answer, "hr", job_description
        )

class TechLeadInterviewer(BaseInterviewer):
    """Technical Lead Interviewer Agent - Focuses on technical skills and problem-solving"""
    
    def __init__(self, gemini_service: GeminiService):
        super().__init__(gemini_service)
        self.interviewer_type = InterviewerType.TECH_LEAD
        self.personality = "Analytical, detail-oriented, and technically rigorous"
        self.focus_areas = [
            "Technical expertise and depth",
            "Problem-solving methodology",
            "System design and architecture",
            "Code quality and best practices",
            "Technology stack proficiency"
        ]
    async def generate_questions(self, resume_text: str, job_description: str, difficulty: str = "medium", num_questions: int = 5) -> List[str]:
        """Generate technical interview questions"""
        return await self.gemini_service.generate_questions(
            resume_text, job_description, "tech_lead", difficulty, num_questions
        )
    
    async def evaluate_answer(self, question: str, answer: str, job_description: str) -> Dict[str, Any]:
        """Evaluate answer from technical perspective"""
        return await self.gemini_service.evaluate_answer(
            question, answer, "tech_lead", job_description
        )

class BehavioralInterviewer(BaseInterviewer):
    """Behavioral Interviewer Agent - Focuses on past experiences and situational responses"""
    
    def __init__(self, gemini_service: GeminiService):
        super().__init__(gemini_service)
        self.interviewer_type = InterviewerType.BEHAVIORAL
        self.personality = "Insightful, probing, and focused on real examples"
        self.focus_areas = [
            "Leadership and influence",
            "Conflict resolution and teamwork",
            "Adaptability and learning agility",
            "Decision-making under pressure",
            "Achievement orientation and results"
        ]
    
    async def generate_questions(self, resume_text: str, job_description: str, difficulty: str = "medium", num_questions: int = 5) -> List[str]:
        """Generate behavioral interview questions"""
        prompt = f"""
        You are an experienced Behavioral interviewer with a {self.personality} approach.
        Your focus areas are: {', '.join(self.focus_areas)}
        
        Based on the following resume and job description, generate {num_questions} behavioral interview questions.
        
        RESUME:
        {resume_text}
        
        JOB DESCRIPTION:
        {job_description}
        
        Generate STAR method questions that assess:
        - Past leadership experiences and team management
        - How they've handled difficult situations or conflicts
        - Examples of innovation or process improvement
        - Times they've had to learn quickly or adapt
        - Specific achievements and how they accomplished them
        
        Use "Tell me about a time when..." or "Give me an example of..." format.
        Make questions relevant to their experience level and the role requirements.
        
        Return exactly {num_questions} questions as a JSON array.        """
        
        return await self.gemini_service.generate_questions(
            resume_text, job_description, "behavioral", difficulty, num_questions
        )
    
    async def evaluate_answer(self, question: str, answer: str, job_description: str) -> Dict[str, Any]:
        """Evaluate answer from behavioral perspective"""
        return await self.gemini_service.evaluate_answer(
            question, answer, "behavioral", job_description
        )

class InterviewerFactory:
    """Factory class to create interviewer agents"""
    
    @staticmethod
    def create_interviewer(interviewer_type: InterviewerType, gemini_service: GeminiService) -> BaseInterviewer:
        """Create an interviewer based on type"""
        if interviewer_type == InterviewerType.HR:
            return HRInterviewer(gemini_service)
        elif interviewer_type == InterviewerType.TECH_LEAD:
            return TechLeadInterviewer(gemini_service)
        elif interviewer_type == InterviewerType.BEHAVIORAL:
            return BehavioralInterviewer(gemini_service)
        else:
            raise ValueError(f"Unknown interviewer type: {interviewer_type}")
    
    @staticmethod
    def get_all_interviewer_types() -> List[InterviewerType]:
        """Get all available interviewer types"""
        return [InterviewerType.HR, InterviewerType.TECH_LEAD, InterviewerType.BEHAVIORAL]
