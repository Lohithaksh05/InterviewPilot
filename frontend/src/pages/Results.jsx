import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Download,
  Star,
  Target,
  Lightbulb,
  FileText,
  Trophy,
  Sparkles,
  Zap,
  Play,
  Pause,
  Volume2,
  Award,
  Brain,
  ClipboardList
} from 'lucide-react';
import toast from 'react-hot-toast';
import { interviewAPI } from '../services/api';
import jsPDF from 'jspdf';

const Results = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();  const [summary, setSummary] = useState(null);
  const [recordings, setRecordings] = useState({});
  const [loading, setLoading] = useState(true);
  const [audioLoading, setAudioLoading] = useState(false);

  // Utility function to format dates in IST
  const formatDateIST = (date = new Date()) => {
    return date.toLocaleDateString('en-IN', { 
      timeZone: 'Asia/Kolkata', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDateTimeIST = (date = new Date()) => {
    return date.toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata' 
    });
  };const fetchSummary = useCallback(async () => {
    try {
      console.log('Fetching summary for sessionId:', sessionId);
      const response = await interviewAPI.getSummary(sessionId);
      console.log('Summary response:', response);
      setSummary(response);
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast.error(error.message || 'Failed to load interview results');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [sessionId, navigate]);const fetchRecordings = useCallback(async () => {    try {
      setAudioLoading(true);
      const response = await interviewAPI.getSessionRecordings(sessionId);
      
      // Handle the response format from backend: { success: true, recordings: [...] }
      const recordingsArray = response.recordings || response || [];
      
      if (Array.isArray(recordingsArray) && recordingsArray.length > 0) {
        // Fetch audio data for each recording
        const recordingsWithAudio = {};
        
        for (const recording of recordingsArray) {
          if (recording.recording_id || recording._id) {
            try {
              const recordingId = recording.recording_id || recording._id;
              const audioResponse = await interviewAPI.getRecording(recordingId);
              const recordingWithAudio = audioResponse.recording || audioResponse;
                if (recordingWithAudio && recordingWithAudio.audio_data) {
                recordingsWithAudio[recording.question_index] = recordingWithAudio;
              }
            } catch (audioError) {
              console.warn(`Failed to fetch audio for recording ${recording.recording_id}:`, audioError);
            }
          }        }
        setRecordings(recordingsWithAudio);
      } else {
        setRecordings({});
      }
    } catch (error) {
      console.error('Error fetching recordings:', error);
      setRecordings({});
      // Don't show error toast for recordings - it's not critical unless user expects audio
    } finally {
      setAudioLoading(false);
    }
  }, [sessionId]);
  const getAudioSrc = useCallback((recording) => {
    if (!recording || !recording.audio_data) return null;
    
    try {
      // Convert base64 audio data to blob URL
      const audioData = recording.audio_data;
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
        // Use the recording's MIME type, default to audio/webm
      const mimeType = recording.mime_type || 'audio/webm';
      const blob = new Blob([bytes], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating audio URL:', error);
      return null;
    }
  }, []);
  useEffect(() => {
    if (sessionId) {
      fetchSummary();
      fetchRecordings();
    }
  }, [sessionId, fetchSummary, fetchRecordings]);

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };
  const downloadReport = async () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;
      
      // Helper function to add text with word wrapping
      const addTextWithWrap = (text, y, fontSize = 12, fontStyle = 'normal') => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        
        const lines = pdf.splitTextToSize(text, pageWidth - 40);
        lines.forEach((line, index) => {
          if (y + (index * 7) > pageHeight - 20) {
            pdf.addPage();
            y = 20;
          }
          pdf.text(line, 20, y + (index * 7));
        });
        
        return y + (lines.length * 7) + 5;
      };
      
      // Header
      pdf.setFillColor(59, 130, 246); // Blue
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('InterviewPilot Report', 20, 20);
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      yPosition = 40;
      
      // Session Info
      yPosition = addTextWithWrap(`Session ID: ${sessionId}`, yPosition, 12, 'normal');
      yPosition = addTextWithWrap(`Interviewer Type: ${summary?.interviewer_type?.replace('_', ' ').toUpperCase()}`, yPosition, 12, 'normal');
      yPosition = addTextWithWrap(`Date: ${formatDateIST()}`, yPosition, 12, 'normal');
      yPosition = addTextWithWrap(`Questions Answered: ${summary?.answered_questions}`, yPosition, 12, 'normal');
      yPosition += 10;
      
      // Overall Score Section
      pdf.setFillColor(240, 240, 240);
      pdf.rect(15, yPosition, pageWidth - 30, 30, 'F');
      pdf.setTextColor(0, 0, 0);
      yPosition = addTextWithWrap('OVERALL PERFORMANCE', yPosition + 10, 16, 'bold');
      yPosition = addTextWithWrap(`Score: ${summary?.average_score}/10`, yPosition, 14, 'bold');
      yPosition += 10;
      
      // Overall Summary
      if (summary?.overall_summary?.summary) {
        yPosition = addTextWithWrap('Interview Summary:', yPosition, 14, 'bold');
        yPosition = addTextWithWrap(summary.overall_summary.summary, yPosition, 11, 'normal');
        yPosition += 10;
      }
      
      // Key Strengths
      if (summary?.overall_summary?.key_strengths?.length > 0) {
        yPosition = addTextWithWrap('Key Strengths:', yPosition, 14, 'bold');
        summary.overall_summary.key_strengths.forEach(strength => {
          yPosition = addTextWithWrap(`• ${strength}`, yPosition, 11, 'normal');
        });
        yPosition += 10;
      }
      
      // Areas for Improvement
      if (summary?.overall_summary?.areas_for_improvement?.length > 0) {
        yPosition = addTextWithWrap('Areas for Improvement:', yPosition, 14, 'bold');
        summary.overall_summary.areas_for_improvement.forEach(improvement => {
          yPosition = addTextWithWrap(`• ${improvement}`, yPosition, 11, 'normal');
        });
        yPosition += 10;
      }
      
      // Recommendation
      if (summary?.overall_summary?.recommendation) {
        yPosition = addTextWithWrap('Recommendation:', yPosition, 14, 'bold');
        yPosition = addTextWithWrap(summary.overall_summary.recommendation, yPosition, 11, 'normal');
        yPosition += 10;
      }
      
      // Question-by-Question Analysis
      if (summary?.qa_pairs?.length > 0) {
        // Add new page for detailed analysis
        pdf.addPage();
        yPosition = 20;
        
        yPosition = addTextWithWrap('DETAILED QUESTION ANALYSIS', yPosition, 16, 'bold');
        yPosition += 10;
        
        summary.qa_pairs.forEach((qa, index) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 80) {
            pdf.addPage();
            yPosition = 20;
          }
          
          // Question header
          pdf.setFillColor(245, 245, 245);
          pdf.rect(15, yPosition, pageWidth - 30, 20, 'F');
          yPosition = addTextWithWrap(`Question ${index + 1} (Score: ${qa.feedback?.score || 'N/A'}/10)`, yPosition + 5, 12, 'bold');
          yPosition += 5;
          
          // Question text
          yPosition = addTextWithWrap(`Q: ${qa.question}`, yPosition, 11, 'bold');
          yPosition += 3;
          
          // Answer text
          yPosition = addTextWithWrap(`A: ${qa.answer}`, yPosition, 10, 'normal');
          yPosition += 5;
          
          // Feedback
          if (qa.feedback?.feedback) {
            yPosition = addTextWithWrap(`Feedback: ${qa.feedback.feedback}`, yPosition, 10, 'italic');
            yPosition += 5;
          }
          
          // Strengths
          if (qa.feedback?.strengths?.length > 0) {
            yPosition = addTextWithWrap('Strengths:', yPosition, 10, 'bold');
            qa.feedback.strengths.forEach(strength => {
              yPosition = addTextWithWrap(`  ✓ ${strength}`, yPosition, 9, 'normal');
            });
          }
          
          // Improvements
          if (qa.feedback?.improvements?.length > 0) {
            yPosition = addTextWithWrap('Areas to Improve:', yPosition, 10, 'bold');
            qa.feedback.improvements.forEach(improvement => {
              yPosition = addTextWithWrap(`  💡 ${improvement}`, yPosition, 9, 'normal');
            });
          }
          
          yPosition += 15;
        });
      }
      
      // Next Steps
      if (summary?.overall_summary?.next_steps?.length > 0) {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = 20;
        }
        
        yPosition = addTextWithWrap('RECOMMENDED NEXT STEPS', yPosition, 14, 'bold');
        yPosition += 5;
        
        summary.overall_summary.next_steps.forEach(step => {
          yPosition = addTextWithWrap(`→ ${step}`, yPosition, 11, 'normal');
        });
      }
      
      // Footer
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Generated by InterviewPilot - Page ${i} of ${totalPages}`, 20, pageHeight - 10);
        pdf.text(`Generated on ${formatDateTimeIST()}`, pageWidth - 80, pageHeight - 10);
      }
      
      // Save the PDF
      const fileName = `interview-report-${sessionId}-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
      toast.success('PDF report downloaded successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
      
      // Fallback to text report
      const report = `
Interview Results - InterviewPilot
=====================================

Session ID: ${sessionId}
Interviewer Type: ${summary?.interviewer_type}
Date: ${formatDateIST()}

Overall Score: ${summary?.average_score}/10

Questions & Answers:
${summary?.qa_pairs?.map((qa, index) => `
Question ${index + 1}: ${qa.question}
Answer: ${qa.answer}
Score: ${qa.feedback?.score || 'N/A'}/10
Feedback: ${qa.feedback?.feedback || 'N/A'}
`).join('\n')}

Overall Summary:
${summary?.overall_summary?.summary || 'N/A'}

Key Strengths:
${summary?.overall_summary?.key_strengths?.map(s => `• ${s}`).join('\n') || 'N/A'}

Areas for Improvement:
${summary?.overall_summary?.areas_for_improvement?.map(s => `• ${s}`).join('\n') || 'N/A'}

Recommendation: ${summary?.overall_summary?.recommendation || 'N/A'}
      `.trim();

      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-report-${sessionId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Text report downloaded as fallback!');
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-cyan-400 to-purple-500"></div>
          <div className="absolute inset-2 animate-spin rounded-full h-12 w-12 border-4 border-transparent bg-gradient-to-r from-purple-500 to-cyan-400" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          <div className="absolute inset-4 rounded-full h-8 w-8 bg-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-6 glass-card p-8 max-w-md">
          <div className="relative">
            <XCircle className="h-16 w-16 text-gray-400 mx-auto animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 rounded-full blur-xl"></div>
          </div>
          <h2 className="text-2xl font-bold text-white">Results Not Found</h2>
          <p className="text-gray-300">The interview results could not be found.</p>
          <Link 
            to="/dashboard" 
            className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 flex items-center space-x-2 mx-auto"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb bg-gradient-to-r from-cyan-400/20 to-purple-500/20 w-72 h-72 -top-36 -left-36"></div>
        <div className="floating-orb bg-gradient-to-r from-purple-500/20 to-pink-500/20 w-96 h-96 -top-48 -right-48 animation-delay-2000"></div>
        <div className="floating-orb bg-gradient-to-r from-blue-500/20 to-cyan-400/20 w-64 h-64 bottom-0 left-1/4 animation-delay-4000"></div>
        <div className="floating-orb bg-gradient-to-r from-pink-500/20 to-purple-500/20 w-80 h-80 bottom-0 right-0 animation-delay-6000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-6 lg:space-y-0 animate-fade-in-up">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x mb-4">
                Interview Results
              </h1>
              <p className="text-xl text-gray-300 font-medium">
                {summary.interviewer_type.replace('_', ' ').toUpperCase()} Interview • {summary.answered_questions} questions answered
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={downloadReport}
                className="group relative overflow-hidden bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 justify-center"
              >
                <FileText className="h-5 w-5 group-hover:animate-pulse transition-transform duration-300" />
                <span>Download PDF Report</span>
              </button>
              <Link 
                to="/interview" 
                className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-green-500/25 flex items-center space-x-2 justify-center"
              >
                <Sparkles className="h-5 w-5 group-hover:animate-spin transition-transform duration-300" />
                <span>New Interview</span>
              </Link>
            </div>
          </div>          {/* Overall Score Cards */}
          <div className="grid md:grid-cols-3 gap-6 animate-fade-in-up animation-delay-200">
            {/* Overall Score */}
            <div className="group glass-card relative overflow-hidden transform hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/25">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 text-center space-y-4 p-6">                <div className="relative inline-block">
                  <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                    {summary?.average_score || 0}/10
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full blur-lg opacity-50 animate-pulse"></div>
                </div>
                <p className="text-lg font-semibold text-white">Overall Score</p>
                <div className="flex justify-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 transition-all duration-300 ${
                        star <= Math.round((summary?.average_score || 0) / 2)
                          ? 'text-yellow-400 fill-yellow-400 animate-pulse'
                          : 'text-gray-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </div>
            
            {/* Questions Answered */}
            <div className="group glass-card relative overflow-hidden transform hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/25">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Target className="h-10 w-10 text-green-400 transition-all duration-300" />
                    <div className="absolute inset-0 bg-green-400/20 rounded-full blur-lg animate-ping opacity-75"></div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-white">{summary.answered_questions}</p>
                    <p className="text-sm text-gray-300">Questions Answered</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </div>
            
            {/* Recommendation */}
            <div className="group glass-card relative overflow-hidden transform hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/25">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <TrendingUp className="h-10 w-10 text-blue-400 group-hover:animate-bounce transition-all duration-300" />
                    <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-lg animate-ping opacity-75"></div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-white">
                      {summary.overall_summary?.recommendation?.includes('hire') ? 'Positive' : 'Needs Work'}
                    </p>
                    <p className="text-sm text-gray-300">Recommendation</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </div>
          </div>          {/* Overall Summary */}
          {summary.overall_summary && (
            <div className="glass-card animate-fade-in-up animation-delay-400 group transform hover:scale-[1.02] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                  <div className="relative">
                    <BarChart3 className="h-7 w-7 text-blue-400 group-hover:animate-pulse" />
                    <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-lg animate-ping opacity-50"></div>
                  </div>
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Interview Summary</span>
                </h2>
                <div className="relative p-6 bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-2xl border border-gray-600/30">
                  <p className="text-gray-200 leading-relaxed text-lg">
                    {summary.overall_summary.summary}
                  </p>
                  <div className="absolute top-2 right-2">
                    <Brain className="h-5 w-5 text-purple-400 opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          )}          {/* Strengths and Improvements */}
          <div className="grid md:grid-cols-2 gap-6 animate-fade-in-up animation-delay-600">
            {/* Strengths */}
            <div className="glass-card group transform hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/25">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-3">
                  <div className="relative">
                    <CheckCircle className="h-6 w-6 text-green-400 group-hover:animate-bounce" />
                    <div className="absolute inset-0 bg-green-400/20 rounded-full blur-lg animate-ping opacity-50"></div>
                  </div>
                  <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Key Strengths</span>
                </h3>
                {summary.overall_summary?.key_strengths?.length > 0 ? (
                  <div className="space-y-3">
                    {summary.overall_summary.key_strengths.map((strength, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20 group/item hover:bg-green-500/20 transition-colors duration-300">
                        <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 group-hover/item:animate-pulse" />
                        <span className="text-gray-200">{strength}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                    <p className="text-gray-300">No specific strengths identified.</p>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </div>

            {/* Areas for Improvement */}
            <div className="glass-card group transform hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-500/25">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-3">
                  <div className="relative">
                    <Lightbulb className="h-6 w-6 text-yellow-400 group-hover:animate-bounce" />
                    <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg animate-ping opacity-50"></div>
                  </div>
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Areas for Improvement</span>
                </h3>
                {summary.overall_summary?.areas_for_improvement?.length > 0 ? (
                  <div className="space-y-3">
                    {summary.overall_summary.areas_for_improvement.map((improvement, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20 group/item hover:bg-yellow-500/20 transition-colors duration-300">
                        <Lightbulb className="h-5 w-5 text-yellow-400 flex-shrink-0 group-hover/item:animate-pulse" />
                        <span className="text-gray-200">{improvement}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                    <p className="text-gray-300">Great job! No major areas for improvement identified.</p>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </div>          </div>          {/* Detailed Q&A Review */}
          {summary.qa_pairs?.length > 0 && (
            <div className="glass-card animate-fadeInUp" style={{ animationDelay: '0.8s' }}>              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <ClipboardList className="h-7 w-7 mr-3 text-cyan-400 animate-pulse" />
                  <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Detailed Q&A Review
                  </span>
                </h2>
              </div>
              
              {/* Audio Status Indicator */}
              <div className="flex items-center space-x-3 mb-8 p-4 rounded-lg bg-white/5 border border-white/10">
                {audioLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400"></div>
                    <span className="text-cyan-300 animate-pulse">Loading audio...</span>
                  </>
                ) : Object.keys(recordings).length > 0 ? (
                  <>
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-emerald-300 font-medium">
                      {Object.keys(recordings).length} audio recording(s) available
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-gray-400 rounded-full opacity-50"></div>
                    <span className="text-gray-400">No audio recordings found</span>
                  </>
                )}
              </div>

              <div className="space-y-8">
                {summary.qa_pairs?.map((qa, index) => {
                  const recording = recordings[index];
                  const audioSrc = recording ? getAudioSrc(recording) : null;
                  
                  return (
                    <div 
                      key={index} 
                      className="group glass-card hover:border-cyan-400/30 transition-all duration-500 transform hover:scale-[1.02] animate-fadeInUp"
                      style={{ animationDelay: `${0.9 + index * 0.1}s` }}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center">                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center justify-center text-black font-bold mr-3">
                            {index + 1}
                          </div>
                          Question {index + 1}
                        </h3>
                        <div className={`px-4 py-2 rounded-full text-sm font-bold transform transition-all duration-300 group-hover:scale-110 ${
                          getScoreBackground(qa.feedback?.score || 0)
                        } ${getScoreColor(qa.feedback?.score || 0)}`}>
                          {qa.feedback?.score || 'N/A'}/10
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                          <h4 className="text-cyan-300 font-semibold mb-3 flex items-center">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></span>
                            Question
                          </h4>
                          <p className="text-white font-medium leading-relaxed">{qa.question}</p>
                        </div>
                        
                        <div className="glass-card bg-gradient-to-br from-purple-500/10 to-cyan-500/10">
                          <h4 className="text-purple-300 font-semibold mb-3 flex items-center">
                            <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
                            Your Answer
                          </h4>
                          <p className="text-gray-200 leading-relaxed">{qa.answer}</p>
                        </div>

                        {/* Audio Player for Voice Recording */}
                        {recording && recording.audio_data ? (
                          <div className="glass-card bg-gradient-to-br from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 transition-all duration-300">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                🎤
                              </div>
                              <span className="text-emerald-300 font-semibold">Voice Recording</span>
                            </div>
                            <audio 
                              controls 
                              src={audioSrc}
                              className="w-full h-12 rounded-lg bg-black/20 filter-glass"
                              preload="metadata"
                              onLoadStart={() => console.log(`Audio ${index + 1}: loadstart`)}
                              onLoadedMetadata={(e) => console.log(`Audio ${index + 1}: loadedmetadata, duration:`, e.target.duration)}
                              onCanPlay={() => console.log(`Audio ${index + 1}: canplay`)}
                              onError={(e) => {
                                console.error(`Audio ${index + 1} error:`, e);
                                toast.error(`Failed to load audio for question ${index + 1}`);
                              }}
                            >
                              Your browser does not support the audio element.
                            </audio>
                            <div className="flex items-center justify-between mt-3 text-sm text-emerald-200">
                              <span>Question {index + 1} Recording</span>
                              <a 
                                href={audioSrc} 
                                download={`question-${index + 1}-recording.wav`}
                                className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                              >
                                <Download className="h-4 w-4" />
                                <span>Download</span>
                              </a>
                            </div>
                          </div>
                        ) : audioLoading ? (
                          <div className="glass-card bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                            <div className="flex items-center space-x-3">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                              <span className="text-blue-300 animate-pulse">Loading audio recordings...</span>
                            </div>
                          </div>
                        ) : null}
                        
                        {qa.feedback?.feedback && (
                          <div className="glass-card bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                            <h4 className="text-blue-300 font-semibold mb-3 flex items-center">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                              AI Feedback
                            </h4>
                            <p className="text-blue-100 leading-relaxed">{qa.feedback.feedback}</p>
                          </div>
                        )}

                        {qa.feedback?.strengths?.length > 0 && (
                          <div>
                            <h4 className="text-emerald-300 font-semibold mb-3 flex items-center">
                              <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                              Strengths
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              {qa.feedback.strengths.map((strength, i) => (
                                <span 
                                  key={i} 
                                  className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-200 text-sm font-medium border border-emerald-400/30 transform hover:scale-105 transition-all duration-200 cursor-default"
                                >
                                  ✓ {strength}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {qa.feedback?.improvements?.length > 0 && (
                          <div>
                            <h4 className="text-yellow-300 font-semibold mb-3 flex items-center">
                              <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
                              Areas for Improvement
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              {qa.feedback.improvements.map((improvement, i) => (
                                <span 
                                  key={i} 
                                  className="px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-200 text-sm font-medium border border-yellow-400/30 transform hover:scale-105 transition-all duration-200 cursor-default"
                                >
                                  💡 {improvement}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}      {/* Next Steps */}
      {summary.overall_summary?.next_steps?.length > 0 && (
        <div className="glass-card animate-fadeInUp bg-gradient-to-br from-indigo-500/10 to-purple-500/10" style={{ animationDelay: '1.2s' }}>
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center mr-3">
              🎯
            </div>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Recommended Next Steps
            </span>
          </h3>
          <ul className="space-y-4">
            {summary.overall_summary.next_steps.map((step, index) => (
              <li 
                key={index} 
                className="flex items-start space-x-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-400/30 transition-all duration-300 transform hover:scale-[1.02] group"
              >                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center flex-shrink-0 mt-1">
                  <ArrowLeft className="h-3 w-3 text-black rotate-180" />
                </div>
                <span className="text-gray-200 leading-relaxed group-hover:text-white transition-colors duration-200">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-6 animate-fadeInUp" style={{ animationDelay: '1.4s' }}>
        <Link 
          to="/dashboard" 
          className="glass-button group bg-gradient-to-r from-gray-500/20 to-gray-600/20 hover:from-gray-400/30 hover:to-gray-500/30"
        >
          <BarChart3 className="h-5 w-5 mr-2 group-hover:animate-pulse" />
          <span>View All Sessions</span>
        </Link>
        <Link 
          to="/interview" 
          className="glass-button group bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-400/30 hover:to-purple-400/30"
        >
          <Play className="h-5 w-5 mr-2 group-hover:animate-bounce" />
          <span>Start New Interview</span>
        </Link>
      </div>
    </div>
    </div>
    </div>
  );
};

export default Results;
