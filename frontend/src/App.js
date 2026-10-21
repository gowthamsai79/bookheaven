import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import Home from './Home';
import BookDetail from './BookDetail';

export const API_URL = 'http://127.0.0.1:8000/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [authData, setAuthData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
    }
  }, [token, username]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await axios.post(`${API_URL}/register/`, authData);
        alert('Account registered! You can now log in.');
        setIsRegister(false);
      } else {
        const res = await axios.post(`${API_URL}/token/`, authData);
        setToken(res.data.access);
        setUsername(authData.username);
        setShowAuthModal(false);
        setAuthData({ username: '', password: '' });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
  };

  return (
    <BrowserRouter>
      <nav className="navbar">
        <Link to="/" className="logo">📖 BookHaven</Link>
        <div className="nav-actions">
          {token ? (
            <>
              <span>Hello, <strong>{username}</strong></span>
              <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowAuthModal(true)}>Login / Register</button>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2 style={{ marginBottom: '16px' }}>{isRegister ? 'Register' : 'Login'}</h2>
            {error && <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '10px' }}>{error}</p>}
            <form onSubmit={handleAuth}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  className="input"
                  required
                  value={authData.username}
                  onChange={(e) => setAuthData({ ...authData, username: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="input"
                  required
                  value={authData.password}
                  onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                {isRegister ? 'Create Account' : 'Sign In'}
              </button>
            </form>
            <div style={{ marginTop: '16px', fontSize: '0.85rem', textAlign: 'center' }}>
              {isRegister ? (
                <span>Already have an account? <button style={{ border: 'none', background: 'none', color: '#4f46e5', cursor: 'pointer' }} onClick={() => setIsRegister(false)}>Log In</button></span>
              ) : (
                <span>New to BookHaven? <button style={{ border: 'none', background: 'none', color: '#4f46e5', cursor: 'pointer' }} onClick={() => setIsRegister(true)}>Register</button></span>
              )}
            </div>
            <button className="btn btn-outline" style={{ width: '100%', marginTop: '8px' }} onClick={() => setShowAuthModal(false)}>Close</button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home token={token} />} />
        <Route path="/book/:id" element={<BookDetail token={token} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;