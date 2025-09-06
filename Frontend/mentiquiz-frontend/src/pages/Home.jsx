import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Play, 
  Users, 
  Zap, 
  BarChart3, 
  Clock,
  ArrowRight,
  Plus
} from 'lucide-react';

const Home = () => {
  const { user, isAdmin } = useAuth();
  const [quizCode, setQuizCode] = useState('');

  const handleJoinQuiz = () => {
    if (quizCode.trim()) {
      window.location.href = `/join/${quizCode.trim()}`;
    }
  };

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Real-time Results",
      description: "See answers and statistics update live as participants respond"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Live Participants",
      description: "Track who's joined your quiz and monitor engagement in real-time"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Instant Analytics",
      description: "Get detailed insights and leaderboards as soon as answers are submitted"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Quick Setup",
      description: "Create and launch interactive quizzes in minutes, not hours"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600"></div>
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 floating-animation">
              Interactive Quizzes
              <span className="block text-primary-200">Made Simple</span>
            </h1>
            <p className="text-xl text-white mb-8 max-w-3xl mx-auto opacity-90">
              Create engaging, real-time quizzes and polls that your audience will love. 
              Perfect for education, presentations, and team building.
            </p>
            
            {/* Quick Join */}
            <div className="max-w-md mx-auto mb-8">
              <div className="glass-card p-1">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Enter quiz code"
                    value={quizCode}
                    onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-3 rounded-l-lg border-0 focus:ring-2 focus:ring-primary-300 bg-white/90 backdrop-blur-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinQuiz()}
                  />
                  <button
                    onClick={handleJoinQuiz}
                    className="bg-gradient-to-r from-white to-primary-50 text-primary-600 px-6 py-3 rounded-r-lg font-medium hover:from-primary-50 hover:to-primary-100 transition-all duration-300 flex items-center transform hover:scale-105"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Join
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAdmin && (
                <a
                  href="/admin"
                  className="btn-gradient px-8 py-3 rounded-lg font-medium flex items-center justify-center transform hover:scale-105 transition-all duration-300"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Quiz
                </a>
              )}
              <a
                href="/join"
                className="bg-white/20 backdrop-blur-sm text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-white/30 transition-all duration-300 flex items-center justify-center border border-white/30 transform hover:scale-110"
              >
                <Users className="h-6 w-6 mr-3" />
                Browse Quizzes
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold gradient-text mb-4">
            Why Choose MentiQuiz?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Built for modern educators, presenters, and teams who want to engage their audience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="glass-card text-center group hover:scale-105 transition-all duration-300">
              <div className="bg-gradient-to-br from-primary-100 to-accent-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works - Horizontal Flow (Single Line) */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-primary-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold gradient-text mb-4 animate-fade-in-up">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 animate-fade-in-up delay-100">
              Get started in three simple steps
            </p>
          </div>

          {/* Horizontal Flow - Single Row */}
          <div className="flex flex-row items-stretch justify-center gap-0 relative w-full overflow-x-auto">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center relative z-10 min-w-[240px] px-4">
              <div className="relative flex items-center justify-center mb-4">
                <div className="absolute inset-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary-300/40 to-accent-200/30 blur-lg opacity-70"></div>
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold z-10 shadow-lg animate-bounce-slow">
                  1
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isAdmin ? 'Create Your Quiz' : 'Get Quiz Code'}
              </h3>
              <p className="text-gray-600">
                {isAdmin 
                  ? 'Design your quiz with questions and answers, then get a unique code'
                  : 'Ask your presenter for the quiz code or join from the homepage'
                }
              </p>
            </div>

            {/* Arrow 1 */}
            <div className="flex flex-col items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 48 48" className="text-primary-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 24h32M32 16l8 8-8 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center relative z-10 min-w-[240px] px-4">
              <div className="relative flex items-center justify-center mb-4">
                <div className="absolute inset-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary-300/40 to-accent-200/30 blur-lg opacity-70"></div>
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold z-10 shadow-lg animate-bounce-slow delay-100">
                  2
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isAdmin ? 'Share & Start' : 'Join & Answer'}
              </h3>
              <p className="text-gray-600">
                {isAdmin
                  ? 'Share the code with participants and start the quiz when ready'
                  : 'Enter the code to join the quiz and start answering questions'
                }
              </p>
            </div>

            {/* Arrow 2 */}
            <div className="flex flex-col items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 48 48" className="text-primary-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 24h32M32 16l8 8-8 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center relative z-10 min-w-[240px] px-4">
              <div className="relative flex items-center justify-center mb-4">
                <div className="absolute inset-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary-300/40 to-accent-200/30 blur-lg opacity-70"></div>
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold z-10 shadow-lg animate-bounce-slow delay-200">
                  3
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isAdmin ? 'Monitor Results' : 'See Live Results'}
              </h3>
              <p className="text-gray-600">
                {isAdmin
                  ? 'Watch responses come in real-time and see live analytics'
                  : 'View live results and leaderboards as answers are submitted'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600"></div>
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4 floating-animation">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white mb-8 opacity-90">
            Join thousands of educators and presenters using MentiQuiz
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAdmin ? (
              <a
                href="/admin"
                className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-medium hover:bg-white/30 transition-all duration-300 flex items-center justify-center border border-white/30 transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Quiz
                <ArrowRight className="h-5 w-5 ml-2" />
              </a>
            ) : (
              <a
                href="/join"
                className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-medium hover:bg-white/30 transition-all duration-300 flex items-center justify-center border border-white/30 transform hover:scale-105"
              >
                <Users className="h-5 w-5 mr-2" />
                Join a Quiz
                <ArrowRight className="h-5 w-5 ml-2" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
