from typing import Dict, List, Any, Optional
from ..models.template_models import InterviewTemplate, JobRole, QuestionCategory, TemplateQuestion
import json
import logging

logger = logging.getLogger(__name__)

class InterviewTemplateService:
    def __init__(self):
        self.templates = self._initialize_templates()
        
    def _initialize_templates(self) -> Dict[str, InterviewTemplate]:
        """Initialize predefined interview templates"""
        templates = {}
        
        # Software Engineer Template
        templates["software_engineer"] = InterviewTemplate(
            id="software_engineer",
            job_role=JobRole.SOFTWARE_ENGINEER,
            name="Software Engineer",
            description="Comprehensive technical interview focusing on coding, system design, and problem-solving",
            duration_minutes=60,
            question_distribution={
                "technical": 6,
                "behavioral": 2,
                "problem_solving": 2
            },
            difficulty_breakdown={
                "easy": 3,
                "medium": 5,
                "hard": 2
            },
            interviewer_types=["tech_lead", "behavioral"],
            key_skills=[
                "Programming languages", "Data structures", "Algorithms", 
                "System design", "Database design", "API development",
                "Testing", "Git/Version Control", "Problem solving"
            ],
            common_questions=[
                {
                    "text": "Explain the difference between abstract classes and interfaces",
                    "category": "technical",
                    "difficulty": "medium"
                },
                {
                    "text": "Design a URL shortener like bit.ly",
                    "category": "problem_solving", 
                    "difficulty": "hard"
                },
                {
                    "text": "Tell me about a challenging bug you fixed",
                    "category": "behavioral",
                    "difficulty": "medium"
                }
            ],
            evaluation_criteria=[
                "Code quality and structure",
                "Problem-solving approach",
                "System design thinking",
                "Communication of technical concepts",
                "Debugging skills"
            ],
            industry_focus="Technology",
            experience_level="mid"
        )
        
        # Product Manager Template
        templates["product_manager"] = InterviewTemplate(
            id="product_manager",
            job_role=JobRole.PRODUCT_MANAGER,
            name="Product Manager",
            description="Strategic product management interview covering product sense, analytics, and leadership",
            duration_minutes=60,
            question_distribution={
                "behavioral": 4,
                "situational": 3,
                "problem_solving": 2,
                "leadership": 1
            },
            difficulty_breakdown={
                "easy": 2,
                "medium": 6,
                "hard": 2
            },
            interviewer_types=["hr", "behavioral"],
            key_skills=[
                "Product strategy", "Market analysis", "User research",
                "Data analysis", "Roadmap planning", "Stakeholder management",
                "A/B testing", "Agile methodology", "Leadership"
            ],
            common_questions=[
                {
                    "text": "How would you prioritize features for our mobile app?",
                    "category": "problem_solving",
                    "difficulty": "medium"
                },
                {
                    "text": "Tell me about a time you had to make a difficult product decision",
                    "category": "behavioral",
                    "difficulty": "medium"
                },
                {
                    "text": "Design a product for elderly users",
                    "category": "problem_solving",
                    "difficulty": "hard"
                }
            ],
            evaluation_criteria=[
                "Strategic thinking",
                "Data-driven decision making",
                "User empathy",
                "Communication skills",
                "Leadership potential"
            ],
            industry_focus="Technology",
            experience_level="mid"
        )
        
        # Data Scientist Template
        templates["data_scientist"] = InterviewTemplate(
            id="data_scientist",
            job_role=JobRole.DATA_SCIENTIST,
            name="Data Scientist",
            description="Technical data science interview covering statistics, ML, and analytical thinking",
            duration_minutes=60,
            question_distribution={
                "technical": 5,
                "problem_solving": 3,
                "behavioral": 2
            },
            difficulty_breakdown={
                "easy": 2,
                "medium": 6,
                "hard": 2
            },
            interviewer_types=["tech_lead", "behavioral"],
            key_skills=[
                "Statistics", "Machine Learning", "Python/R", "SQL",
                "Data visualization", "Experimental design", "Big data tools",
                "Business acumen", "Communication"
            ],
            common_questions=[
                {
                    "text": "Explain the bias-variance tradeoff",
                    "category": "technical",
                    "difficulty": "medium"
                },
                {
                    "text": "How would you detect fraud in credit card transactions?",
                    "category": "problem_solving",
                    "difficulty": "hard"
                },
                {
                    "text": "Describe a project where your analysis changed business strategy",
                    "category": "behavioral",
                    "difficulty": "medium"
                }
            ],
            evaluation_criteria=[
                "Statistical knowledge",
                "ML algorithm understanding",
                "Data interpretation skills",
                "Business impact thinking",
                "Technical communication"
            ],
            industry_focus="Technology/Analytics",
            experience_level="mid"
        )
        
        # UI/UX Designer Template
        templates["ui_ux_designer"] = InterviewTemplate(
            id="ui_ux_designer",
            job_role=JobRole.UI_UX_DESIGNER,
            name="UI/UX Designer",
            description="Design-focused interview covering user experience, visual design, and design thinking",
            duration_minutes=60,
            question_distribution={
                "technical": 4,
                "problem_solving": 3,
                "behavioral": 2,
                "cultural_fit": 1
            },
            difficulty_breakdown={
                "easy": 3,
                "medium": 5,
                "hard": 2
            },
            interviewer_types=["tech_lead", "behavioral"],
            key_skills=[
                "User research", "Wireframing", "Prototyping", "Visual design",
                "Design systems", "Usability testing", "Figma/Sketch", 
                "Design thinking", "Accessibility"
            ],
            common_questions=[
                {
                    "text": "Walk me through your design process for a mobile app",
                    "category": "problem_solving",
                    "difficulty": "medium"
                },
                {
                    "text": "How do you handle feedback on your designs?",
                    "category": "behavioral",
                    "difficulty": "easy"
                }
            ],
            evaluation_criteria=[
                "Design thinking process",
                "User empathy",
                "Visual design skills",
                "Problem-solving approach",
                "Communication of design decisions"
            ],
            industry_focus="Technology",
            experience_level="mid"
        )

        # Marketing Manager Template
        templates["marketing_manager"] = InterviewTemplate(
            id="marketing_manager",
            job_role=JobRole.MARKETING_MANAGER,
            name="Marketing Manager",
            description="Marketing strategy interview covering campaigns, analytics, and brand management",
            duration_minutes=60,
            question_distribution={
                "behavioral": 4,
                "problem_solving": 3,
                "situational": 2,
                "leadership": 1
            },
            difficulty_breakdown={
                "easy": 3,
                "medium": 5,
                "hard": 2
            },
            interviewer_types=["hr", "behavioral"],
            key_skills=[
                "Campaign management", "Digital marketing", "Analytics", "SEO/SEM",
                "Content strategy", "Brand management", "Social media", 
                "Budget management", "A/B testing"
            ],
            common_questions=[
                {
                    "text": "How would you launch a product in a new market?",
                    "category": "problem_solving",
                    "difficulty": "hard"
                },
                {
                    "text": "Describe a successful marketing campaign you managed",
                    "category": "behavioral",
                    "difficulty": "medium"
                }
            ],
            evaluation_criteria=[
                "Strategic thinking",
                "Creativity",
                "Data-driven approach",
                "Campaign execution",
                "ROI understanding"
            ],
            industry_focus="General",
            experience_level="mid"        )

        # Sales Representative Template
        templates["sales_representative"] = InterviewTemplate(
            id="sales_representative",
            job_role=JobRole.SALES_REPRESENTATIVE,
            name="Sales Representative",
            description="Sales-focused interview covering prospecting, relationship building, and closing techniques",
            duration_minutes=50,
            question_distribution={
                "behavioral": 5,
                "situational": 3,
                "problem_solving": 2
            },
            difficulty_breakdown={
                "easy": 4,
                "medium": 4,
                "hard": 2
            },
            interviewer_types=["hr", "behavioral"],
            key_skills=[
                "Prospecting", "Lead qualification", "Relationship building", 
                "Negotiation", "Closing techniques", "CRM usage", 
                "Pipeline management", "Customer needs analysis", "Objection handling"
            ],
            common_questions=[
                {
                    "text": "How do you handle rejection from prospects?",
                    "category": "behavioral",
                    "difficulty": "medium"
                },
                {
                    "text": "Walk me through your sales process",
                    "category": "situational",
                    "difficulty": "easy"
                }
            ],
            evaluation_criteria=[
                "Sales methodology",
                "Resilience",
                "Communication skills",
                "Customer focus",
                "Results orientation"
            ],
            industry_focus="General",
            experience_level="junior"
        )

        # Business Analyst Template
        templates["business_analyst"] = InterviewTemplate(
            id="business_analyst",
            job_role=JobRole.BUSINESS_ANALYST,
            name="Business Analyst",
            description="Analytical interview covering requirements gathering, process improvement, and stakeholder management",
            duration_minutes=60,
            question_distribution={
                "technical": 3,
                "problem_solving": 4,
                "behavioral": 2,
                "situational": 1
            },
            difficulty_breakdown={
                "easy": 2,
                "medium": 6,
                "hard": 2
            },
            interviewer_types=["tech_lead", "behavioral"],
            key_skills=[
                "Requirements analysis", "Process mapping", "Data analysis", "SQL",
                "Stakeholder management", "Documentation", "Agile methodology", 
                "Business process improvement", "Risk assessment"
            ],
            common_questions=[
                {
                    "text": "How do you gather requirements from stakeholders?",
                    "category": "situational",
                    "difficulty": "medium"
                },
                {
                    "text": "Analyze this business scenario and recommend improvements",
                    "category": "problem_solving",
                    "difficulty": "hard"
                }
            ],
            evaluation_criteria=[
                "Analytical thinking",
                "Requirements gathering",
                "Process improvement mindset",
                "Stakeholder communication",
                "Problem-solving approach"
            ],
            industry_focus="General",
            experience_level="mid"
        )

        # Project Manager Template
        templates["project_manager"] = InterviewTemplate(
            id="project_manager",
            job_role=JobRole.PROJECT_MANAGER,
            name="Project Manager",
            description="Project management interview covering planning, execution, and team leadership",
            duration_minutes=60,
            question_distribution={
                "behavioral": 4,
                "situational": 3,
                "leadership": 2,
                "problem_solving": 1
            },
            difficulty_breakdown={
                "easy": 3,
                "medium": 5,
                "hard": 2
            },
            interviewer_types=["hr", "behavioral"],
            key_skills=[
                "Project planning", "Risk management", "Team leadership", "Agile/Scrum",
                "Budget management", "Stakeholder communication", "Resource allocation", 
                "Timeline management", "Conflict resolution"
            ],
            common_questions=[
                {
                    "text": "How do you handle a project that's falling behind schedule?",
                    "category": "problem_solving",
                    "difficulty": "medium"
                },
                {
                    "text": "Describe how you managed a difficult team member",
                    "category": "leadership",
                    "difficulty": "hard"
                }
            ],
            evaluation_criteria=[
                "Project management methodology",
                "Leadership skills",
                "Risk mitigation",
                "Communication effectiveness",
                "Adaptability"
            ],
            industry_focus="General",
            experience_level="mid"
        )

        # Customer Success Template
        templates["customer_success"] = InterviewTemplate(
            id="customer_success",
            job_role=JobRole.CUSTOMER_SUCCESS,
            name="Customer Success Manager",
            description="Customer-focused interview covering relationship management, retention, and growth strategies",
            duration_minutes=50,
            question_distribution={
                "behavioral": 5,
                "situational": 3,
                "problem_solving": 2
            },
            difficulty_breakdown={
                "easy": 4,
                "medium": 4,
                "hard": 2
            },
            interviewer_types=["hr", "behavioral"],
            key_skills=[
                "Customer relationship management", "Account management", "Retention strategies",
                "Upselling/Cross-selling", "Customer onboarding", "Data analysis", 
                "Communication", "Problem resolution", "Customer advocacy"
            ],
            common_questions=[
                {
                    "text": "How do you identify at-risk customers?",
                    "category": "problem_solving",
                    "difficulty": "medium"
                },
                {
                    "text": "Tell me about a time you turned around a dissatisfied customer",
                    "category": "behavioral",
                    "difficulty": "medium"
                }
            ],
            evaluation_criteria=[
                "Customer empathy",
                "Problem-solving skills",
                "Relationship building",
                "Data-driven approach",
                "Proactive mindset"
            ],
            industry_focus="Technology",
            experience_level="mid"
        )

        # HR Generalist Template
        templates["hr_generalist"] = InterviewTemplate(
            id="hr_generalist",
            job_role=JobRole.HR_GENERALIST,
            name="HR Generalist",
            description="Human resources interview covering recruitment, employee relations, and HR policies",
            duration_minutes=60,
            question_distribution={
                "behavioral": 4,
                "situational": 4,
                "problem_solving": 2
            },
            difficulty_breakdown={
                "easy": 3,
                "medium": 5,
                "hard": 2
            },
            interviewer_types=["hr", "behavioral"],
            key_skills=[
                "Recruitment", "Employee relations", "Performance management", "HR policies",
                "Conflict resolution", "Training and development", "Compliance", 
                "Compensation and benefits", "HRIS systems"
            ],
            common_questions=[
                {
                    "text": "How do you handle employee conflicts?",
                    "category": "situational",
                    "difficulty": "medium"
                },
                {
                    "text": "Describe your approach to diversity and inclusion",
                    "category": "behavioral",
                    "difficulty": "medium"
                }
            ],
            evaluation_criteria=[
                "HR knowledge",
                "Interpersonal skills",
                "Conflict resolution",
                "Ethical judgment",
                "Strategic HR thinking"
            ],
            industry_focus="General",
            experience_level="mid"
        )

        # Add sample questions to templates
        for template in templates.values():
            # Add sample questions to Software Engineer template
            if template.job_role == JobRole.SOFTWARE_ENGINEER:
                template.sample_questions = [
                    "Tell me about yourself and your background in software development.",
                    "How do you approach debugging a complex technical issue?",
                    "Describe a challenging project you worked on and how you overcame obstacles.",
                    "How do you stay updated with the latest technologies and best practices?",
                    "Walk me through your process for designing a scalable system.",
                    "What's your experience with version control and collaborative development?"
                ]
            # Add sample questions to Product Manager template
            elif template.job_role == JobRole.PRODUCT_MANAGER:
                template.sample_questions = [
                    "How do you prioritize features in a product roadmap?",
                    "Describe a time when you had to make a difficult product decision.",
                    "How do you gather and analyze user feedback?",
                    "Walk me through your process for launching a new feature.",
                    "How do you work with engineering teams to deliver products?",
                    "Describe a product failure and what you learned from it."
                ]
            # Add sample questions to Data Scientist template
            elif template.job_role == JobRole.DATA_SCIENTIST:
                template.sample_questions = [
                    "Explain a machine learning project you've worked on from start to finish.",
                    "How do you handle missing data in your datasets?",
                    "Describe your approach to feature engineering.",
                    "How do you validate and test your machine learning models?",
                    "Walk me through your data visualization and storytelling process.",
                    "How do you communicate technical findings to non-technical stakeholders?"
                ]
            # Add sample questions to UI/UX Designer template
            elif template.job_role == JobRole.UI_UX_DESIGNER:
                template.sample_questions = [
                    "Walk me through your design process for a mobile app.",
                    "How do you conduct user research and usability testing?",
                    "Describe a design challenge and how you solved it.",
                    "How do you ensure accessibility in your designs?",
                    "Explain your approach to creating design systems.",
                    "How do you handle feedback and iterate on designs?"
                ]
            # Add sample questions to Marketing Manager template
            elif template.job_role == JobRole.MARKETING_MANAGER:
                template.sample_questions = [
                    "How do you develop and execute marketing campaigns?",
                    "Describe your experience with digital marketing channels.",
                    "How do you measure and analyze marketing performance?",
                    "Walk me through a successful campaign you've managed.",
                    "How do you identify and target your ideal customer?",
                    "Describe your approach to brand positioning and messaging."
                ]
            else:
                # Default sample questions for other roles
                template.sample_questions = [
                    "Tell me about yourself and your professional background.",
                    "What interests you about this role and our company?",
                    "Describe a challenging situation you faced and how you handled it.",
                    "How do you prioritize tasks and manage your time?",
                    "What are your greatest strengths and areas for improvement?",
                    "Where do you see yourself in the next 3-5 years?"
                ]
        
        return templates
    
    def get_template(self, template_id: str) -> Optional[InterviewTemplate]:
        """Get a specific interview template"""
        return self.templates.get(template_id)
    
    def get_all_templates(self) -> List[InterviewTemplate]:
        """Get all available templates"""
        return list(self.templates.values())
    
    def get_templates_by_role(self, job_role: JobRole) -> List[InterviewTemplate]:
        """Get templates for a specific job role"""
        return [template for template in self.templates.values() 
                if template.job_role == job_role]
    
    def customize_template(self, template_id: str, customizations: Dict[str, Any]) -> InterviewTemplate:
        """Customize a template with user preferences"""
        template = self.get_template(template_id)
        if not template:
            raise ValueError(f"Template {template_id} not found")
        
        # Create a copy and apply customizations
        template_dict = template.dict()
        
        # Apply customizations
        if "difficulty_breakdown" in customizations:
            template_dict["difficulty_breakdown"].update(customizations["difficulty_breakdown"])
        
        if "question_distribution" in customizations:
            template_dict["question_distribution"].update(customizations["question_distribution"])
            
        if "duration_minutes" in customizations:
            template_dict["duration_minutes"] = customizations["duration_minutes"]
        
        return InterviewTemplate(**template_dict)
    
    def generate_questions_from_template(self, template: InterviewTemplate, 
                                       resume_text: str, job_description: str) -> Dict[str, Any]:
        """Generate interview structure based on template"""
        
        questions_by_interviewer = {}
        total_questions = sum(template.question_distribution.values())
        
        for interviewer_type in template.interviewer_types:
            # Calculate questions per interviewer
            if interviewer_type == "tech_lead":
                categories = ["technical", "problem_solving"]
            elif interviewer_type == "behavioral":
                categories = ["behavioral", "situational", "leadership"]
            else:  # hr
                categories = ["cultural_fit", "communication", "behavioral"]
            
            # Distribute questions based on template
            interviewer_questions = []
            for category in categories:
                if category in template.question_distribution:
                    count = template.question_distribution[category]
                    if interviewer_type in ["tech_lead"] and category in ["technical", "problem_solving"]:
                        interviewer_questions.extend([category] * count)
                    elif interviewer_type in ["behavioral", "hr"] and category in ["behavioral", "situational", "leadership", "cultural_fit", "communication"]:
                        interviewer_questions.extend([category] * count)
            
            questions_by_interviewer[interviewer_type] = {
                "question_count": len(interviewer_questions),
                "categories": interviewer_questions,
                "difficulty_mix": template.difficulty_breakdown
            }
        
        return {
            "template_info": template,
            "questions_by_interviewer": questions_by_interviewer,
            "total_duration": template.duration_minutes,
            "evaluation_criteria": template.evaluation_criteria,
            "key_skills": template.key_skills
        }
