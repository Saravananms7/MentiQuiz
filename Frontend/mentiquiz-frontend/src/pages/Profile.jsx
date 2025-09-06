import React from 'react';

const Profile = () => {
  return (
    <div className="quiz-auth-container">
      <h2 className="quiz-title">Profile</h2>
      <p>Your quiz profile information</p>
      <div style={{ marginTop: '20px' }}>
        <a href="/dashboard" style={{ marginRight: '10px', color: '#ff9800' }}>Dashboard</a>
        <a href="/quiz" style={{ color: '#ff9800' }}>Take Quiz</a>
      </div>
    </div>
  );
};

export default Profile;
