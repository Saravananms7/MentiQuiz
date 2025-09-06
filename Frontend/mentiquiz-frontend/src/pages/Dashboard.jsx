import React from 'react';

const Dashboard = () => {
  return (
    <div className="quiz-auth-container">
      <h2 className="quiz-title">Dashboard</h2>
      <p>Welcome to your quiz dashboard!</p>
      <div style={{ marginTop: '20px' }}>
        <a href="/quiz" style={{ marginRight: '10px', color: '#ff9800' }}>Take Quiz</a>
        <a href="/profile" style={{ marginRight: '10px', color: '#ff9800' }}>Profile</a>
        <a href="/leaderboard" style={{ color: '#ff9800' }}>Leaderboard</a>
      </div>
    </div>
  );
};

export default Dashboard;
