import React from 'react';

const Leaderboard = () => {
  return (
    <div className="quiz-auth-container">
      <h2 className="quiz-title">Leaderboard</h2>
      <p>Top quiz performers</p>
      <div style={{ marginTop: '20px' }}>
        <a href="/dashboard" style={{ marginRight: '10px', color: '#ff9800' }}>Dashboard</a>
        <a href="/quiz" style={{ color: '#ff9800' }}>Take Quiz</a>
      </div>
    </div>
  );
};

export default Leaderboard;
