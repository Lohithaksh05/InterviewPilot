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
        
        logger.info(f"Generating {num_questions} questions for {interviewer_type} interviewer (difficulty: {difficulty})")
        
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
        
        IMPORTANT: You MUST generate exactly {num_questions} interview questions. No more, no less.
        
        Return the questions as a JSON array of strings.
        Example format: ["Question 1?", "Question 2?", "Question 3?"]
        
        Ensure each question:
        1. Ends with a question mark
        2. Is relevant to the role and candidate
        3. Matches the {difficulty} difficulty level
        4. Is unique and well-formed
        
        Generate exactly {num_questions} questions now.
        """
        
        try:
            response = await self.generate_content(prompt)
            
            # Try to parse as JSON first
            try:
                questions = json.loads(response.strip())
                if isinstance(questions, list):
                    # Ensure we have exactly the right number of questions
                    if len(questions) >= num_questions:
                        final_questions = questions[:num_questions]
                        logger.info(f"Successfully generated {len(final_questions)} questions (JSON parsing)")
                        return final_questions
                    else:
                        logger.warning(f"Generated only {len(questions)} questions, need {num_questions}. Generating additional...")
                        # If we don't have enough, generate more
                        return await self._ensure_question_count(questions, num_questions, resume_text, job_description, interviewer_type, difficulty)
                else:
                    raise json.JSONDecodeError("Not a list", response, 0)
            except json.JSONDecodeError:
                # Fallback: parse line by line and ensure count
                questions = self._parse_questions_from_text(response)
                if len(questions) >= num_questions:
                    return questions[:num_questions]
                else:
                    return await self._ensure_question_count(questions, num_questions, resume_text, job_description, interviewer_type, difficulty)
                    
        except Exception as e:
            logger.error(f"Error generating questions: {str(e)}")
            # Last resort: return generic questions
            return self._get_fallback_questions(interviewer_type, num_questions)
    
    def _parse_questions_from_text(self, text: str) -> List[str]:
        """Parse questions from text response"""
        lines = text.strip().split('\n')
        questions = []
        
        for line in lines:
            line = line.strip()
            # Remove numbering, bullets, quotes
            line = line.lstrip('0123456789.- "\'[]')
            line = line.rstrip('"\'[]')
            
            if line and ('?' in line or len(line) > 10):  # Likely a question
                if not line.endswith('?'):
                    line += '?'
                questions.append(line)
        
        return questions
    
    async def _ensure_question_count(self, existing_questions: List[str], target_count: int, 
                                   resume_text: str, job_description: str, 
                                   interviewer_type: str, difficulty: str) -> List[str]:
        """Ensure we have exactly the target number of questions"""
        logger.info(f"Ensuring question count: have {len(existing_questions)}, need {target_count}")
        
        if len(existing_questions) >= target_count:
            final_questions = existing_questions[:target_count]
            logger.info(f"Trimmed to {len(final_questions)} questions")
            return final_questions
        
        needed = target_count - len(existing_questions)
        logger.info(f"Need to generate {needed} additional questions")
        
        # Generate additional questions
        additional_prompt = f"""
        Generate exactly {needed} additional {interviewer_type} interview questions for this candidate.
        Make them different from these existing questions: {existing_questions}
        
        Return as JSON array: ["Question 1?", "Question 2?"]
        """
        
        try:
            response = await self.generate_content(additional_prompt)
            additional_questions = json.loads(response.strip())
            if isinstance(additional_questions, list):
                all_questions = existing_questions + additional_questions
                return all_questions[:target_count]
        except:
            pass
        
        # If all else fails, use fallback questions
        fallback = self._get_fallback_questions(interviewer_type, needed)
        return (existing_questions + fallback)[:target_count]
    
    def _get_fallback_questions(self, interviewer_type: str, count: int) -> List[str]:
        """Provide fallback questions if AI generation fails"""
        fallback_questions = {
            "hr": [
                "Tell me about yourself and your professional background?",
                "Why are you interested in this position?",
                "How do you handle challenges and pressure at work?",
                "Describe your ideal work environment?",
                "Where do you see yourself in the next 5 years?",
                "What motivates you in your professional life?",
                "How do you prioritize tasks when you have multiple deadlines?",
                "Tell me about a time you worked effectively in a team?",
                "What are your greatest strengths and weaknesses?",
                "Why should we hire you for this role?"
            ],
            "tech_lead": [
                "Explain your approach to system design and architecture?",
                "How do you ensure code quality in your projects?",
                "Describe a challenging technical problem you solved?",
                "How do you stay updated with new technologies?",
                "Explain your experience with debugging complex issues?",
                "How do you handle performance optimization?",
                "Describe your experience with version control and collaboration?",
                "How do you approach testing and quality assurance?",
                "Explain your understanding of scalable systems?",
                "How do you mentor junior developers?"
            ],
            "behavioral": [
                "Tell me about a time you overcame a significant challenge?",
                "Describe a situation where you had to lead a team through change?",
                "How do you handle conflicts with colleagues?",
                "Tell me about a time you failed and what you learned?",
                "Describe a situation where you had to make a difficult decision?",
                "How do you handle feedback and criticism?",
                "Tell me about a time you exceeded expectations?",
                "Describe your experience working with difficult stakeholders?",
                "How do you manage stress and maintain work-life balance?",
                "Tell me about a time you had to learn something new quickly?"
            ]
        }
        
        questions = fallback_questions.get(interviewer_type, fallback_questions["hr"])
        return questions[:count]
    
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
        
        IMPORTANT SCORING GUIDELINES:
        - Score 0-1: Completely irrelevant, random text, no attempt to answer the question, nonsensical response
        - Score 2-3: Partially relevant but mostly off-topic, very poor quality, missing key points
        - Score 4-5: Somewhat relevant but lacks depth, basic answer with significant gaps
        - Score 6-7: Good answer that addresses the question with some detail and relevance
        - Score 8-9: Excellent answer with strong relevance, good examples, and comprehensive coverage
        - Score 10: Outstanding answer that perfectly addresses the question with exceptional insight
        
        STRICT EVALUATION CRITERIA:
        1. First check if the answer is actually attempting to respond to the question asked
        2. If the answer is random text, gibberish, or completely unrelated - give 0 points
        3. If the answer shows no understanding of the question - give 0-1 points
        4. Only give higher scores if the answer demonstrates genuine effort and relevance
        
        Evaluate based on: {evaluation_criteria.get(interviewer_type, 'overall quality')}
        
        BE STRICT: Random typing, irrelevant responses, or non-answers should receive 0 points.
        
        Provide your evaluation in the following JSON format:
        {{
            "score": 0-10,
            "feedback": "detailed feedback explaining why this score was given",
            "strengths": ["strength 1", "strength 2"],
            "improvements": ["improvement 1", "improvement 2"],
            "follow_up_questions": ["follow up question 1", "follow up question 2"],
            "relevance_check": "Is this answer relevant to the question? (Yes/No)",
            "reasoning": "Brief explanation of the scoring decision"
        }}"""
        
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
            if not isinstance(evaluation, dict):                raise json.JSONDecodeError("Invalid response format", "", 0)
            
            # Validate and set defaults for missing fields
            evaluation.setdefault("score", 0)  # Default to 0 instead of 5 for failed parsing
            evaluation.setdefault("feedback", "No feedback provided")
            evaluation.setdefault("strengths", [])
            evaluation.setdefault("improvements", ["Answer should be more relevant to the question"])
            evaluation.setdefault("follow_up_questions", [])
            evaluation.setdefault("relevance_check", "No")
            evaluation.setdefault("reasoning", "Failed to parse evaluation properly")
            
            # Ensure score is within valid range
            score = evaluation.get("score", 0)
            if isinstance(score, str):
                try:
                    score = float(score)
                except (ValueError, TypeError):
                    score = 0  # Default to 0 for parsing errors
            evaluation["score"] = max(0, min(10, score))
            
            # Additional check for obviously irrelevant answers
            answer_lower = answer.lower().strip()
            if (len(answer_lower) < 5 or 
                answer_lower in ['test', 'testing', 'random', 'abc', 'xyz', 'asdf', 'qwerty'] or
                all(c in 'abcdefghijklmnopqrstuvwxyz0123456789 ' for c in answer_lower) and len(set(answer_lower.replace(' ', ''))) <= 3):
                evaluation["score"] = 0
                evaluation["feedback"] = "Answer appears to be random text or not a genuine attempt to respond to the question."
                evaluation["improvements"] = ["Please provide a relevant answer that addresses the question asked"]
                evaluation["relevance_check"] = "No"
            
            return evaluation
            
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            logger.error(f"Error parsing evaluation response: {str(e)}")
            logger.error(f"Raw response: {response}")
            
            # For parsing errors, be conservative and check if answer seems irrelevant
            answer_lower = answer.lower().strip()
            is_likely_random = (len(answer_lower) < 5 or 
                              answer_lower in ['test', 'testing', 'random', 'abc', 'xyz', 'asdf', 'qwerty'] or
                              (all(c in 'abcdefghijklmnopqrstuvwxyz0123456789 ' for c in answer_lower) and 
                               len(set(answer_lower.replace(' ', ''))) <= 3))
            
            fallback_score = 0 if is_likely_random else 1
            
            return {
                "score": fallback_score,
                "feedback": f"Unable to properly evaluate this answer. {'Appears to be random text.' if is_likely_random else 'Please provide a more detailed response.'}",
                "strengths": [] if is_likely_random else ["Attempted to provide an answer"],
                "improvements": ["Please provide a relevant answer that clearly addresses the question asked"],
                "follow_up_questions": [],
                "relevance_check": "No" if is_likely_random else "Unclear",
                "reasoning": "Evaluation parsing failed"
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
