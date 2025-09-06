import axios from 'axios';

const API_BASE_URL = 'http://localhost:6700';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/profile'),
};

// Quiz API
export const quizAPI = {
  createQuiz: (quizData) => api.post('/quiz', quizData),
  getQuiz: (code) => api.get(`/quiz/${code}`),
  joinQuiz: (code) => api.post(`/quiz/${code}/join`),
  submitAnswer: (code, questionId, optionId) => 
    api.post(`/quiz/${code}/question/${questionId}/answer`, { optionId }),
  getQuizStats: (code) => api.get(`/quiz/${code}/stats`),
  getQuestionResults: (code, questionId) => 
    api.get(`/quiz/${code}/question/${questionId}/results`),
  getResult: (code) => api.get(`/result/${code}`),
};

// Admin API
export const adminAPI = {
  createQuiz: (quizData) => api.post('/quiz', quizData),
  getQuizzes: () => api.get('/admin/viewquiz'),
  getQuizQuestions: (code) => api.get(`/admin/quiz/${code}/questions`),
  startQuiz: (quizId) => api.post(`/admin/quiz/${quizId}/start`),
  nextQuestion: (quizId, questionId, questionData) => 
    api.post(`/admin/quiz/${quizId}/next`, { questionId, questionData }),
  getResponses: (quizId) => api.get(`/admin/quiz/${quizId}/responses`),
  getLeaderboard: (quizId) => api.get(`/admin/quiz/${quizId}/leaderboard`),
};

export default api;
