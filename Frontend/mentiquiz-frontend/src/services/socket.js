import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (!this.socket) {
      this.socket = io('http://localhost:6700', {
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.isConnected = false;
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Quiz room management
  joinQuiz(quizCode, userId, userName) {
    if (this.socket) {
      this.socket.emit('join-quiz', { quizCode, userId, userName });
    }
  }

  leaveQuiz(quizCode) {
    if (this.socket) {
      this.socket.emit('leave-quiz', { quizCode });
    }
  }

  // Answer submission
  submitAnswer(quizCode, questionId, optionId) {
    if (this.socket) {
      this.socket.emit('submit-answer', { quizCode, questionId, optionId });
    }
  }

  // Admin controls
  startQuiz(quizCode) {
    if (this.socket) {
      this.socket.emit('start-quiz', { quizCode });
    }
  }

  nextQuestion(quizCode, questionId) {
    if (this.socket) {
      this.socket.emit('next-question', { quizCode, questionId });
    }
  }

  endQuiz(quizCode) {
    if (this.socket) {
      this.socket.emit('end-quiz', { quizCode });
    }
  }

  // Event listeners
  onParticipantJoined(callback) {
    if (this.socket) {
      this.socket.on('participant-joined', callback);
    }
  }

  onParticipantLeft(callback) {
    if (this.socket) {
      this.socket.on('participant-left', callback);
    }
  }

  onQuizStarted(callback) {
    if (this.socket) {
      this.socket.on('quiz-started', callback);
    }
  }

  onNextQuestion(callback) {
    if (this.socket) {
      this.socket.on('next-question', callback);
    }
  }

  onAnswerSubmitted(callback) {
    if (this.socket) {
      this.socket.on('answer-submitted', callback);
    }
  }

  onQuizEnded(callback) {
    if (this.socket) {
      this.socket.on('quiz-ended', callback);
    }
  }

  onQuizStatus(callback) {
    if (this.socket) {
      this.socket.on('quiz-status', callback);
    }
  }

  onError(callback) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  // Remove event listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export default new SocketService();
