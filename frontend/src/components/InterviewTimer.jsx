import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Clock, AlertTriangle, Timer } from 'lucide-react';
import toast from 'react-hot-toast';

const InterviewTimer = React.forwardRef(({ 
  durationMinutes = 30, 
  onTimeUp, 
  isActive = true, 
  showWarnings = true 
}, ref) => {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60); // Convert to seconds
  const [isRunning, setIsRunning] = useState(isActive);
  const [initialized, setInitialized] = useState(false);

  // Expose methods to parent component
  React.useImperativeHandle(ref, () => ({
    getCurrentTimeLeftMinutes: () => Math.ceil(timeLeft / 60), // Return minutes left (rounded up)
    getCurrentTimeLeftSeconds: () => timeLeft
  }));const warningsShownRef = useRef({
    halfTime: false,
    fiveMin: false,
    oneMin: false
  });
  const onTimeUpRef = useRef(onTimeUp);
  const intervalRef = useRef(null);
  const showWarningsRef = useRef(showWarnings);
  const durationMinutesRef = useRef(durationMinutes);

  // Always keep the latest values in refs
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
    showWarningsRef.current = showWarnings;
    durationMinutesRef.current = durationMinutes;
  }, [onTimeUp, showWarnings, durationMinutes]);

  // Format time display (MM:SS)
  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);
  // Get color based on time remaining
  const getTimeColor = useCallback((seconds) => {
    const totalSeconds = durationMinutesRef.current * 60;
    const percentage = (seconds / totalSeconds) * 100;
    
    if (percentage <= 10) return 'text-red-400';
    if (percentage <= 25) return 'text-orange-400';
    if (percentage <= 50) return 'text-yellow-400';
    return 'text-green-400';
  }, []);

  // Get background color for timer box
  const getBgColor = useCallback((seconds) => {
    const totalSeconds = durationMinutesRef.current * 60;
    const percentage = (seconds / totalSeconds) * 100;
    
    if (percentage <= 10) return 'bg-red-500/20 border-red-500/30';
    if (percentage <= 25) return 'bg-orange-500/20 border-orange-500/30';
    if (percentage <= 50) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-green-500/20 border-green-500/30';
  }, []);// Always keep the latest onTimeUp callback in ref
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Initialize timer only once
  useEffect(() => {
    if (!initialized && isActive) {
      setInitialized(true);
      setTimeLeft(durationMinutes * 60);
      setIsRunning(true);
    }
  }, [durationMinutes, isActive, initialized]);
  // Timer logic - completely independent of parent state
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            // Time's up!
            if (onTimeUpRef.current) {
              onTimeUpRef.current();
            }
            return 0;
          }
          
          const newTime = prevTime - 1;
            // Show warnings at specific intervals only if showWarnings is true
          if (showWarningsRef.current) {
            const totalSeconds = durationMinutesRef.current * 60;
            const percentage = (newTime / totalSeconds) * 100;
            
            // Half time warning
            if (percentage <= 50 && percentage > 49 && !warningsShownRef.current.halfTime) {
              warningsShownRef.current.halfTime = true;
              toast.warn('⏰ Half time remaining!', { duration: 3000 });
            }
            
            // 5 minute warning
            if (newTime <= 300 && newTime > 299 && !warningsShownRef.current.fiveMin) {
              warningsShownRef.current.fiveMin = true;
              toast.warn('⚠️ Only 5 minutes left!', { duration: 4000 });
            }
            
            // 1 minute warning
            if (newTime <= 60 && newTime > 59 && !warningsShownRef.current.oneMin) {
              warningsShownRef.current.oneMin = true;
              toast.error('🚨 Final minute! Prepare to submit!', { duration: 5000 });
            }
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeLeft]); // Removed showWarnings and durationMinutes from dependencies

  // Update isRunning when isActive prop changes
  useEffect(() => {
    if (initialized) {
      setIsRunning(isActive);
    }
  }, [isActive, initialized]);
  // Progress percentage for visual indicator
  const progressPercentage = ((durationMinutesRef.current * 60 - timeLeft) / (durationMinutesRef.current * 60)) * 100;
  return (
    <div className={`fixed top-20 right-4 z-40 p-4 rounded-xl border backdrop-blur-sm ${getBgColor(timeLeft)}`}>
      <div className="flex items-center gap-3">
        {/* Timer Icon */}
        <div className="flex items-center gap-2">
          {timeLeft <= 60 ? (
            <AlertTriangle className={`w-5 h-5 ${getTimeColor(timeLeft)} animate-pulse`} />
          ) : (
            <Clock className={`w-5 h-5 ${getTimeColor(timeLeft)}`} />
          )}
          
          {/* Time Display */}
          <div className="text-center">
            <div className={`text-xl font-mono font-bold ${getTimeColor(timeLeft)}`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-xs text-gray-400">
              {Math.floor(timeLeft / 60)}m left
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div            className={`h-full transition-all duration-1000 ${
              timeLeft <= 60 ? 'bg-red-500' : 
              timeLeft <= 300 ? 'bg-orange-500' : 
              timeLeft <= durationMinutesRef.current * 30 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Time's Up Overlay */}
      {timeLeft === 0 && (
        <div className="absolute inset-0 bg-red-500/90 rounded-xl flex items-center justify-center">
          <div className="text-center text-white">
            <Timer className="w-8 h-8 mx-auto mb-2 animate-bounce" />
            <div className="font-bold">Time's Up!</div>
            <div className="text-xs">Auto-submitting...</div>
          </div>
        </div>
      )}
    </div>  );
});

export default memo(InterviewTimer);
