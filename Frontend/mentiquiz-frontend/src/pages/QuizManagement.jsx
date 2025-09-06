import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import socketService from '../services/socket';
import { 
  Play, 
  Pause, 
  Users, 
  BarChart3, 
  ArrowRight,
  ArrowLeft,
  Copy,
  Eye,
  CheckCircle,
  Clock
} from 'lucide-react';

const QuizManagement = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [liveResults, setLiveResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await adminAPI.getQuizQuestions(code);
        setQuiz(response.data);
      } catch (error) {
        console.error('Failed to fetch quiz:', error);
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchQuiz();
      
      // Connect to WebSocket
      socketService.connect();
      
      // Set up event listeners
      socketService.onParticipantJoined((data) => {
        setParticipants(data.totalParticipants);
      });
      
      socketService.onParticipantLeft((data) => {
        setParticipants(data.totalParticipants);
      });
      
      socketService.onAnswerSubmitted((data) => {
        setLiveResults(data);
      });
    }

    return () => {
      socketService.removeAllListeners();
    };
  }, [code, navigate]);

  const startQuiz = () => {
    socketService.startQuiz(code);
    setIsActive(true);
  };

  const showNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      const question = quiz.questions[nextIndex];
      socketService.nextQuestion(code, question.id);
      setCurrentQuestionIndex(nextIndex);
      setShowResults(false);
      setLiveResults(null);
    }
  };

  const showPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      const question = quiz.questions[prevIndex];
      socketService.nextQuestion(code, question.id);
      setCurrentQuestionIndex(prevIndex);
      setShowResults(false);
      setLiveResults(null);
    }
  };

  const endQuiz = () => {
    socketService.endQuiz(code);
    navigate(`/result/${code}`);
  };

  const toggleResults = () => {
    setShowResults(!showResults);
  };

  const copyQuizCode = () => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz not found</h2>
          <button onClick={() => navigate('/admin')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-gray-600">Code: {code}</span>
                <button
                  onClick={copyQuizCode}
                  className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-600">
                <Users className="h-5 w-5 mr-2" />
                <span>{participants} participants</span>
              </div>
              <div className={`flex items-center ${isActive ? 'text-green-600' : 'text-gray-600'}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span>{isActive ? 'Live' : 'Waiting'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Quiz Area */}
          <div className="lg:col-span-2">
            {!isActive ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <Clock className="h-16 w-16 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Ready to Start?
                </h2>
                <p className="text-gray-600 mb-6">
                  Share the quiz code with participants and start when everyone is ready.
                </p>
                <button
                  onClick={startQuiz}
                  className="btn-primary flex items-center mx-auto"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Quiz
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Question Display */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">
                      Question {currentQuestionIndex + 1} of {quiz.questions.length}
                    </span>
                    <button
                      onClick={toggleResults}
                      className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {showResults ? 'Hide' : 'Show'} Results
                    </button>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    {currentQuestion.text}
                  </h2>
                  
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <div key={option.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option.text}</span>
                          {option.isCorrect && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        
                        {showResults && liveResults && (
                          <div className="mt-2">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>{liveResults.optionCounts[option.id] || 0} votes</span>
                              <span>
                                {liveResults.totalResponses > 0 
                                  ? Math.round(((liveResults.optionCounts[option.id] || 0) / liveResults.totalResponses) * 100)
                                  : 0}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${liveResults.totalResponses > 0 
                                    ? ((liveResults.optionCounts[option.id] || 0) / liveResults.totalResponses) * 100 
                                    : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Controls */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={showPreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </button>

                    <div className="flex space-x-2">
                      {currentQuestionIndex < quiz.questions.length - 1 ? (
                        <button
                          onClick={showNextQuestion}
                          className="btn-primary flex items-center"
                        >
                          Next Question
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </button>
                      ) : (
                        <button
                          onClick={endQuiz}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium flex items-center"
                        >
                          End Quiz
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quiz Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Information</h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <span>{quiz.questions.length} questions</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{participants} participants</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <span>{quiz.isPoll ? 'Poll' : 'Quiz'}</span>
                </div>
              </div>
            </div>

            {/* Live Stats */}
            {isActive && liveResults && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Responses:</span>
                    <span className="font-medium">{liveResults.totalResponses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Rate:</span>
                    <span className="font-medium">
                      {participants > 0 ? Math.round((liveResults.totalResponses / participants) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/result/${code}`)}
                  className="w-full btn-secondary text-sm flex items-center justify-center"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Results
                </button>
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full btn-secondary text-sm"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizManagement;
