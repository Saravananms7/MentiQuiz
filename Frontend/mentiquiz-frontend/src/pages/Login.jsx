import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/global.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      const res = await fetch('http://localhost:6700/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      setError('Network error.');
    }
  };

  return (
    <div className="quiz-auth-container">
      <h2 className="quiz-title">MentiQuiz Login</h2>
      <form className="quiz-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="quiz-error">{error}</div>}
        <button type="submit">Login</button>
      </form>
      <div className="quiz-footer">Don’t have an account? <a href="/register">Register</a></div>
    </div>
  );
};

export default Login;
