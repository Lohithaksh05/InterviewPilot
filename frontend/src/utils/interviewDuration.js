// Utility function to calculate interview duration based on parameters
export const calculateInterviewDuration = (interviewParams) => {
  const {
    numQuestions = 5,
    difficulty = 'medium',
    interviewerType = 'hr',
    selectedTemplate = null
  } = interviewParams;

  // If template is selected, use its duration (check both template and template_settings)
  if (selectedTemplate) {
    // Handle both direct template object and template_settings from session
    const templateDuration = selectedTemplate.duration_minutes || 
                           (selectedTemplate.template_settings && selectedTemplate.template_settings.duration_minutes);
    if (templateDuration) {
      return templateDuration;
    }
  }

  // Base time per question based on difficulty
  const baseTimePerQuestion = {
    easy: 3,     // 3 minutes per question
    medium: 4,   // 4 minutes per question  
    hard: 6      // 6 minutes per question
  };

  // Additional time based on interviewer type
  const interviewerTimeMultiplier = {
    hr: 1.0,           // Standard time
    tech_lead: 1.5,    // 50% more time for technical depth
    behavioral: 1.2    // 20% more time for storytelling
  };

  // Calculate base duration
  const timePerQuestion = baseTimePerQuestion[difficulty] || baseTimePerQuestion.medium;
  const multiplier = interviewerTimeMultiplier[interviewerType] || 1.0;
    // Calculate total duration
  const totalMinutes = Math.ceil(numQuestions * timePerQuestion * multiplier);
  
  // Add buffer time (15% of total time, minimum 5 minutes)
  const bufferTime = Math.max(5, Math.ceil(totalMinutes * 0.15));
  
  // Total duration before rounding
  const rawDuration = totalMinutes + bufferTime;
  
  // Round to standard intervals: 20, 30, 40, 50, 60 minutes
  const standardIntervals = [20, 30, 40, 50, 60];
  
  // Find the closest standard interval (rounding up for safety)
  for (let interval of standardIntervals) {
    if (rawDuration <= interval) {
      return interval;
    }
  }
  
  // If it exceeds 60 minutes, cap at 60
  return 60;
};

// Get human-readable duration breakdown
export const getDurationBreakdown = (interviewParams) => {
  const duration = calculateInterviewDuration(interviewParams);
  const {
    numQuestions = 5,
    difficulty = 'medium',
    interviewerType = 'hr',
    selectedTemplate = null
  } = interviewParams;

  // If template is used, show template reason
  if (selectedTemplate) {
    const templateDuration = selectedTemplate.duration_minutes || 
                           (selectedTemplate.template_settings && selectedTemplate.template_settings.duration_minutes);
    if (templateDuration) {
      return {
        totalMinutes: duration,
        source: 'template',
        breakdown: `Template: ${selectedTemplate.name || 'Selected Template'}`,
        description: `This template is designed for ${duration}-minute interviews`
      };
    }
  }

  // Calculate what this duration allows
  const timePerQuestion = Math.floor(duration / numQuestions);
  
  const difficultyLabels = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard'
  };

  const interviewerLabels = {
    hr: 'HR',
    tech_lead: 'Technical',
    behavioral: 'Behavioral'
  };

  return {
    totalMinutes: duration,
    source: 'calculated',
    timePerQuestion,
    difficulty,
    interviewerType,
    numQuestions,
    breakdown: `${duration} min (${difficultyLabels[difficulty]} ${interviewerLabels[interviewerType]})`,
    description: `≈${timePerQuestion} min per question + buffer time`
  };
};

// Interview type descriptions for UI
export const getInterviewTypeDescription = (interviewerType) => {
  const descriptions = {
    hr: 'HR interviews focus on cultural fit and general questions',
    tech_lead: 'Technical interviews include coding and system design',
    behavioral: 'Behavioral interviews use STAR method for past experiences'
  };
  
  return descriptions[interviewerType] || 'Standard interview format';
};

// Difficulty descriptions
export const getDifficultyDescription = (difficulty) => {
  const descriptions = {
    easy: 'Basic questions suitable for entry-level positions',
    medium: 'Standard questions for mid-level positions',
    hard: 'Advanced questions for senior-level positions'
  };
  
  return descriptions[difficulty] || 'Standard difficulty level';
};
