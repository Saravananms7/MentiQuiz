import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { quizAPI } from '../services/api';
import { 
  Trophy, 
  Users, 
  BarChart3, 
  ArrowLeft,
  Download,
  Share2
} from 'lucide-react';

const Result = () => {
  const { code } = useParams();
  const location = useLocation();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Check if results were passed from navigation
        if (location.state?.results) {
          setResults(location.state.results);
        } else {
          // Fetch results from API
          const response = await quizAPI.getResult(code);
          setResults(response.data);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [code, location.state]);

  const exportResults = () => {
    if (!results?.leaderboard) return;
    
    const csvContent = [
      ['Rank', 'Name', 'Score', 'Total Questions', 'Percentage'],
      ...results.leaderboard.map((participant, index) => [
        index + 1,
        participant.name,
        participant.score,
        participant.totalQuestions,
        `${Math.round((participant.score / participant.totalQuestions) * 100)}%`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-results-${code}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const shareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Quiz Results',
        text: `Check out the results for quiz ${code}!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 mb-4">
            <BarChart3 className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Results</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="btn-primary flex items-center mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!results?.leaderboard || results.leaderboard.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Results Yet</h2>
          <p className="text-gray-600 mb-6">No participants have submitted answers yet.</p>
          <button
            onClick={() => window.history.back()}
            className="btn-primary flex items-center mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const topThree = results.leaderboard.slice(0, 3);
  const others = results.leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Quiz Results</h1>
            <p className="text-primary-100">Quiz Code: {code}</p>
            
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={exportResults}
                className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={shareResults}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-400 transition-colors flex items-center"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Podium */}
        {topThree.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Top Performers</h2>
            
            <div className="flex justify-center items-end space-x-4">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="text-center">
                  <div className="bg-gray-300 w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl font-bold text-gray-700">2</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{topThree[1].name}</h3>
                  <p className="text-gray-600">{topThree[1].score}/{topThree[1].totalQuestions}</p>
                  <p className="text-sm text-gray-500">
                    {Math.round((topThree[1].score / topThree[1].totalQuestions) * 100)}%
                  </p>
                </div>
              )}

              {/* 1st Place */}
              <div className="text-center">
                <div className="bg-yellow-400 w-24 h-24 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Trophy className="h-8 w-8 text-yellow-800" />
                </div>
                <h3 className="font-semibold text-gray-900">{topThree[0].name}</h3>
                <p className="text-gray-600">{topThree[0].score}/{topThree[0].totalQuestions}</p>
                <p className="text-sm text-gray-500">
                  {Math.round((topThree[0].score / topThree[0].totalQuestions) * 100)}%
                </p>
              </div>

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="text-center">
                  <div className="bg-orange-300 w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl font-bold text-orange-800">3</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{topThree[2].name}</h3>
                  <p className="text-gray-600">{topThree[2].score}/{topThree[2].totalQuestions}</p>
                  <p className="text-sm text-gray-500">
                    {Math.round((topThree[2].score / topThree[2].totalQuestions) * 100)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Full Leaderboard</h2>
            <div className="flex items-center text-gray-600">
              <Users className="h-5 w-5 mr-2" />
              <span>{results.leaderboard.length} participants</span>
            </div>
          </div>

          <div className="space-y-3">
            {results.leaderboard.map((participant, index) => (
              <div
                key={participant.userId}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  index < 3 ? 'bg-gray-50' : 'bg-white'
                } border border-gray-200`}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                    index === 0 ? 'bg-yellow-400 text-yellow-800' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-orange-300 text-orange-800' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index < 3 ? (
                      index === 0 ? <Trophy className="h-4 w-4" /> : index + 1
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{participant.name}</h3>
                    <p className="text-sm text-gray-600">
                      {participant.score} out of {participant.totalQuestions} correct
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {Math.round((participant.score / participant.totalQuestions) * 100)}%
                  </p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ 
                        width: `${(participant.score / participant.totalQuestions) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
          <a
            href="/"
            className="btn-primary"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default Result;
