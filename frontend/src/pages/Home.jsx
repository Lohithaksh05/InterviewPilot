import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Users, BarChart3, ArrowRight, CheckCircle, Star } from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: <Users className="h-8 w-8 text-primary-600" />,
      title: "Multi-Agent Interviewers",
      description: "Practice with AI-powered HR, Technical Lead, and Behavioral interviewers, each with their unique expertise and questioning style."
    },
    {
      icon: <Brain className="h-8 w-8 text-primary-600" />,
      title: "AI-Powered Feedback",
      description: "Get detailed, personalized feedback on your answers with specific suggestions for improvement from Google Gemini AI."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary-600" />,
      title: "Performance Analytics",
      description: "Track your progress with comprehensive analytics, scoring, and recommendations to ace your next interview."
    }
  ];

  const interviewerTypes = [
    {
      type: "HR Interviewer",
      description: "Focuses on cultural fit, communication skills, and soft skills assessment",
      color: "bg-blue-50 border-blue-200",
      icon: "👥"
    },
    {
      type: "Technical Lead",
      description: "Evaluates technical expertise, problem-solving, and system design capabilities",
      color: "bg-green-50 border-green-200",
      icon: "💻"
    },
    {
      type: "Behavioral Expert",
      description: "Uses STAR method to assess past experiences and situational responses",
      color: "bg-purple-50 border-purple-200",
      icon: "🎯"
    }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            Master Your
            <span className="text-primary-600 block">Interview Skills</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Practice with AI-powered multi-agent interviewers. Get personalized feedback, 
            improve your responses, and land your dream job with confidence.
          </p>
        </div>        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/interview"
            className="btn-primary btn-lg inline-flex items-center space-x-2"
          >
            <span>Start Practice Interview</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/dashboard"
            className="btn-secondary btn-lg inline-flex items-center space-x-2"
          >
            <BarChart3 className="h-5 w-5" />
            <span>View Dashboard</span>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Why Choose InterviewPilot?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our AI-powered platform provides realistic interview practice with instant feedback
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card text-center space-y-4">
              <div className="flex justify-center">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interviewer Types Section */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Meet Your AI Interviewers</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Practice with specialized AI agents, each designed to simulate real interview scenarios
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {interviewerTypes.map((interviewer, index) => (
            <div key={index} className={`card border-2 ${interviewer.color} space-y-4`}>
              <div className="text-4xl text-center">{interviewer.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 text-center">
                {interviewer.type}
              </h3>
              <p className="text-gray-600 text-center">{interviewer.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get started in just a few simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: "1", title: "Upload Resume", desc: "Upload your resume or paste the job description" },
            { step: "2", title: "Choose Interviewer", desc: "Select from HR, Technical, or Behavioral interviewer" },
            { step: "3", title: "Practice Interview", desc: "Answer AI-generated questions tailored to your profile" },
            { step: "4", title: "Get Feedback", desc: "Receive detailed feedback and improvement suggestions" }
          ].map((item, index) => (
            <div key={index} className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-black rounded-2xl p-12 text-center space-y-6">
        <h2 className="text-3xl font-bold">Ready to Ace Your Next Interview?</h2>
        <p className="text-xl text-primary-100 max-w-2xl mx-auto">
          Join thousands of job seekers who have improved their interview skills with InterviewPilot
        </p>        <Link
          to="/interview"
          className="btn-primary btn-lg inline-flex items-center space-x-2"
        >
          <span>Start Your First Interview</span>
          <ArrowRight className="h-5 w-5" />
        </Link>
      </section>
    </div>
  );
};

export default Home;
