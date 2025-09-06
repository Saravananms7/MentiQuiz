import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, ArrowRight } from 'lucide-react';

const Join = () => {
  const [quizCode, setQuizCode] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleJoinQuiz = (e) => {
    e.preventDefault();
    if (quizCode.trim()) {
      navigate(`/join/${quizCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-accent-50 to-primary-100"></div>
      <div className="absolute inset-0 bg-black opacity-5"></div>
      <div className="relative max-w-md w-full space-y-8 p-8">
        <div className="glass-card text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-6 floating-animation">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-2">
            Join a Quiz
          </h2>
          <p className="text-gray-600">
            Enter the quiz code provided by your presenter
          </p>
        </div>

        <div className="glass-card">
          <form className="space-y-6" onSubmit={handleJoinQuiz}>
            <div>
              <label htmlFor="quizCode" className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Code
              </label>
              <input
                id="quizCode"
                name="quizCode"
                type="text"
                required
                className="input-field text-center text-2xl font-mono tracking-wider"
                placeholder="ABC123"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                maxLength="6"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={!quizCode.trim()}
                className="w-full btn-gradient disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-105 transition-all duration-300"
              >
                Join Quiz
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have a quiz code?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Go back to home
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* User Info */}
        <div className="glass-card">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-medium text-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">Ready to participate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Join;
