def _initialize_templates(self) -> List[InterviewTemplate]:
    """Initialize predefined interview templates with sample questions"""
    # ...existing template definitions...
    
    templates = [
        # All existing template definitions remain the same
        # Just adding sample_questions to each template dictionary before creating InterviewTemplate objects
    ]
    
    # Add sample questions to each template data before creating objects
    for template_data in templates:
        job_role = template_data.get("job_role", "")
        
        if job_role == "software_engineer":
            template_data["sample_questions"] = [
                "Tell me about yourself and your background in software development.",
                "How do you approach debugging a complex technical issue?",
                "Describe a challenging project you worked on and how you overcame obstacles.",
                "How do you stay updated with the latest technologies and best practices?",
                "Walk me through your process for designing a scalable system."
            ]
        elif job_role == "product_manager":
            template_data["sample_questions"] = [
                "How do you prioritize features in a product roadmap?",
                "Describe a time when you had to make a difficult product decision.",
                "How do you gather and analyze user feedback?",
                "Walk me through your process for launching a new feature.",
                "How do you work with engineering teams to deliver products?"
            ]
        elif job_role == "data_scientist":
            template_data["sample_questions"] = [
                "Explain a machine learning project you've worked on from start to finish.",
                "How do you handle missing data in your datasets?", 
                "Describe your approach to feature engineering.",
                "How do you validate and test your machine learning models?",
                "Walk me through your data visualization process."
            ]
        else:
            # Default sample questions for other roles
            template_data["sample_questions"] = [
                "Tell me about yourself and your professional background.",
                "What interests you about this role and our company?",
                "Describe a challenging situation you faced and how you handled it.",
                "How do you prioritize tasks and manage your time?",
                "What are your greatest strengths and areas for improvement?"
            ]
    
    # Create InterviewTemplate objects from dictionaries (now with sample_questions)
    return [InterviewTemplate(**template_data) for template_data in templates]