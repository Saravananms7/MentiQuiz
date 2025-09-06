import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import { 
  Plus, 
  Play, 
  Users, 
  BarChart3, 
  Copy,
  Eye,
  Trash2,
  Edit
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  console.log('AdminDashboard - User:', user, 'IsAdmin:', isAdmin);
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    questions: [{ title: '', option1: '', option2: '', option3: '', option4: '', answer: '' }],
    isPoll: false
  });

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await adminAPI.getQuizzes();
      setQuizzes(response.data.quizzes || []);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newQuiz.title.trim()) {
      alert('Please enter a quiz title');
      return;
    }
    
    if (newQuiz.questions.length === 0) {
      alert('Please add at least one question');
      return;
    }
    
    // Validate each question
    for (let i = 0; i < newQuiz.questions.length; i++) {
      const question = newQuiz.questions[i];
      if (!question.title.trim()) {
        alert(`Please enter a title for question ${i + 1}`);
        return;
      }
      if (!question.option1.trim() || !question.option2.trim() || !question.option3.trim() || !question.option4.trim()) {
        alert(`Please fill all options for question ${i + 1}`);
        return;
      }
      if (!newQuiz.isPoll && !question.answer.trim()) {
        alert(`Please select a correct answer for question ${i + 1}`);
        return;
      }
    }
    
    try {
      console.log('Creating quiz with data:', newQuiz);
      const response = await adminAPI.createQuiz(newQuiz);
      console.log('Quiz created successfully:', response.data);
      
      setNewQuiz({
        title: '',
        questions: [{ title: '', option1: '', option2: '', option3: '', option4: '', answer: '' }],
        isPoll: false
      });
      setShowCreateForm(false);
      fetchQuizzes();
    } catch (error) {
      console.error('Failed to create quiz:', error);
      console.error('Error response:', error.response?.data);
      alert('Failed to create quiz: ' + (error.response?.data?.error || error.message));
    }
  };

  const addQuestion = () => {
    setNewQuiz({
      ...newQuiz,
      questions: [...newQuiz.questions, { title: '', option1: '', option2: '', option3: '', option4: '', answer: '' }]
    });
  };

  const removeQuestion = (index) => {
    if (newQuiz.questions.length > 1) {
      setNewQuiz({
        ...newQuiz,
        questions: newQuiz.questions.filter((_, i) => i !== index)
      });
    }
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...newQuiz.questions];
    updatedQuestions[index][field] = value;
    setNewQuiz({ ...newQuiz, questions: updatedQuestions });
  };

  const copyQuizCode = (code) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text">Quiz Dashboard</h1>
              <p className="text-gray-600">Create and manage your interactive quizzes</p>
            </div>
            {isAdmin ? (
              <button
                onClick={() => {
                  console.log('Create Quiz button clicked');
                  setShowCreateForm(true);
                }}
                className="btn-primary flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Quiz
              </button>
            ) : (
              <div className="text-gray-500">Admin access required</div>
            )}
          </div>
        </div>

        {/* Create Quiz Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Quiz</h2>
                
                <form onSubmit={handleCreateQuiz} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quiz Title
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={newQuiz.title}
                      onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                      placeholder="Enter quiz title"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPoll"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={newQuiz.isPoll}
                      onChange={(e) => setNewQuiz({ ...newQuiz, isPoll: e.target.checked })}
                    />
                    <label htmlFor="isPoll" className="ml-2 block text-sm text-gray-700">
                      This is a poll (no correct answers)
                    </label>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Questions
                      </label>
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        + Add Question
                      </button>
                    </div>

                    {newQuiz.questions.map((question, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                          {newQuiz.questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestion(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <input
                            type="text"
                            required
                            className="input-field"
                            placeholder="Question text"
                            value={question.title}
                            onChange={(e) => updateQuestion(index, 'title', e.target.value)}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="text"
                              required
                              className="input-field"
                              placeholder="Option 1"
                              value={question.option1}
                              onChange={(e) => updateQuestion(index, 'option1', e.target.value)}
                            />
                            <input
                              type="text"
                              required
                              className="input-field"
                              placeholder="Option 2"
                              value={question.option2}
                              onChange={(e) => updateQuestion(index, 'option2', e.target.value)}
                            />
                            <input
                              type="text"
                              required
                              className="input-field"
                              placeholder="Option 3"
                              value={question.option3}
                              onChange={(e) => updateQuestion(index, 'option3', e.target.value)}
                            />
                            <input
                              type="text"
                              required
                              className="input-field"
                              placeholder="Option 4"
                              value={question.option4}
                              onChange={(e) => updateQuestion(index, 'option4', e.target.value)}
                            />
                          </div>

                          {!newQuiz.isPoll && (
                            <select
                              required
                              className="input-field"
                              value={question.answer}
                              onChange={(e) => updateQuestion(index, 'answer', e.target.value)}
                            >
                              <option value="">Select correct answer</option>
                              <option value={question.option1}>Option 1</option>
                              <option value={question.option2}>Option 2</option>
                              <option value={question.option3}>Option 3</option>
                              <option value={question.option4}>Option 4</option>
                            </select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Create Quiz
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Quizzes Grid */}
        {quizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No quizzes yet</h3>
              <p className="text-gray-600 mb-6">Create your first interactive quiz to get started</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary flex items-center mx-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Quiz
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="glass-card group hover:scale-105 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{quiz.title}</h3>
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                    quiz.isPoll 
                      ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' 
                      : 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                  }`}>
                    {quiz.isPoll ? 'Poll' : 'Quiz'}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    <span>{quiz.questions.length} questions</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Code: {quiz.code}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => copyQuizCode(quiz.code)}
                    className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:from-gray-200 hover:to-gray-300 transition-all duration-300 flex items-center justify-center transform hover:scale-105"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Code
                  </button>
                  <a
                    href={`/admin/quiz/${quiz.code}`}
                    className="flex-1 btn-primary text-sm flex items-center justify-center"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Manage
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
