import React from 'react';

const Quiz = () => {
  return (
    <div className="quiz-auth-container">
      <h2 className="quiz-title">Quiz</h2>
      <p>Test your knowledge!</p>
      <div style={{ marginTop: '20px' }}>
        <a href="/result" style={{ marginRight: '10px', color: '#ff9800' }}>Submit Quiz</a>
        <a href="/dashboard" style={{ color: '#ff9800' }}>Dashboard</a>
      </div>
    </div>
  );
};

export default Quiz;
