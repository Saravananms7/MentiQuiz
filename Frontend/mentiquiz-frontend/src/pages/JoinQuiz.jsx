import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { quizAPI } from '../services/api';
import socketService from '../services/socket';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Play
} from 'lucide-react';

const JoinQuiz = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [liveResults, setLiveResults] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await quizAPI.getQuiz(code);
        setQuiz(response.data);
        
        // Join the quiz
        const joinResponse = await quizAPI.joinQuiz(code);
        setJoined(true);
        
        // Connect to WebSocket
        socketService.connect();
        socketService.joinQuiz(code, user.id, user.name);
        
        // Set up event listeners
        socketService.onParticipantJoined((data) => {
          setParticipants(data.totalParticipants);
        });
        
        socketService.onParticipantLeft((data) => {
          setParticipants(data.totalParticipants);
        });
        
        socketService.onQuizStarted(() => {
          // Quiz started, show first question
        });
        
        socketService.onNextQuestion((data) => {
          setCurrentQuestion(data.question);
          setSubmitted(false);
          setSelectedOption(null);
          setLiveResults(null);
        });
        
        socketService.onAnswerSubmitted((data) => {
          setLiveResults(data);
        });
        
        socketService.onQuizEnded((data) => {
          navigate(`/result/${code}`, { state: { results: data } });
        });
        
        socketService.onQuizStatus((data) => {
          setParticipants(data.totalParticipants);
          if (data.currentQuestionId) {
            // Load current question
            loadQuestion(data.currentQuestionId);
          }
        });
        
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to join quiz');
      } finally {
        setLoading(false);
      }
    };

    if (code && user) {
      fetchQuiz();
    }

    return () => {
      if (code) {
        socketService.leaveQuiz(code);
      }
    };
  }, [code, user, navigate]);

  const loadQuestion = async (questionId) => {
    try {
      const response = await quizAPI.getQuestionResults(code, questionId);
      setCurrentQuestion(response.data);
    } catch (err) {
      console.error('Failed to load question:', err);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!selectedOption || submitted) return;
    
    try {
      setSubmitted(true);
      await quizAPI.submitAnswer(code, currentQuestion.questionId, selectedOption);
      socketService.submitAnswer(code, currentQuestion.questionId, selectedOption);
    } catch (err) {
      console.error('Failed to submit answer:', err);
      setSubmitted(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Joining quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary flex items-center mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Joining quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-gray-600">Quiz Code: {code}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-600">
                <Users className="h-5 w-5 mr-2" />
                <span>{participants} participants</span>
              </div>
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentQuestion ? (
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <Clock className="h-16 w-16 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Waiting for Quiz to Start
              </h2>
              <p className="text-gray-600 mb-6">
                The quiz host will start the quiz soon. You'll see the first question here.
              </p>
              <div className="flex items-center justify-center text-gray-500">
                <div className="animate-pulse">●</div>
                <span className="ml-2">Live connection active</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Question */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {currentQuestion.text}
              </h2>
              
              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => !submitted && setSelectedOption(option.id)}
                    disabled={submitted}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedOption === option.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${submitted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.text}</span>
                      {selectedOption === option.id && (
                        <CheckCircle className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              {!submitted && (
                <div className="mt-6">
                  <button
                    onClick={handleAnswerSubmit}
                    disabled={!selectedOption}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Answer
                  </button>
                </div>
              )}

              {submitted && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center text-green-800">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>Answer submitted successfully!</span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Results */}
            {liveResults && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Live Results
                </h3>
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => {
                    const count = liveResults.optionCounts[option.id] || 0;
                    const percentage = liveResults.totalResponses > 0 
                      ? (count / liveResults.totalResponses) * 100 
                      : 0;
                    
                    return (
                      <div key={option.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{option.text}</span>
                          <span className="text-gray-600">{count} votes</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  Total responses: {liveResults.totalResponses}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinQuiz;
