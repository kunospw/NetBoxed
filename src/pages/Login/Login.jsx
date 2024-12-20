import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from '../../assets/NetBoxed/TextOnly.png';

const Login = () => {
  const navigate = useNavigate();
  const [signState, setSignState] = useState('Sign In');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

// In your Login component's handleLogin function:
const handleLogin = async (e) => {
  e.preventDefault();
  setError('');

  try {
    const response = await fetch('http://localhost:3001/sign-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `Server error: ${response.status}`);
    }

    const data = await response.json();
    
    // Ensure user ID is stored as a string
    const userData = {
      ...data.user,
      id: String(data.user.id)
    };
    
    // Store complete user data in sessionStorage
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('user', JSON.stringify(userData));
    
    navigate('/');
  } catch (error) {
    console.error('Login error:', error);
    setError(error.message || 'Error during sign in. Please try again.');
  }
};

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sign up failed');
      }

      if (data.user) {
        setName('');
        setEmail('');
        setPassword('');
        alert('Sign Up successful! Please sign in.');
        setSignState('Sign In');
        setError('');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error.message || 'Error during sign up. Please try again.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      setResetSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowResetPassword(false);
        setResetSuccess(false);
        setSignState('Sign In');
      }, 2000);
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || 'Error during password reset. Please try again.');
    }
  };

  const handleFormSwitch = () => {
    setSignState(signState === 'Sign In' ? 'Sign Up' : 'Sign In');
    setShowResetPassword(false);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
  };

  if (showResetPassword) {
    return (
      <div className="login">
        <img src={logo} className="login-logo" alt="Logo" />
        <div className="login-form">
          <h1>Reset Password</h1>
          {resetSuccess ? (
            <div className="success-message">
              Password reset successful! Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleResetPassword}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button type="submit">Reset Password</button>
              <button 
                type="button" 
                onClick={() => setShowResetPassword(false)}
                className="secondary-button"
              >
                Back to Sign In
              </button>
              {error && <p className="error">{error}</p>}
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="login">
      <img src={logo} className="login-logo" alt="Logo" />
      <div className="login-form">
        <h1>{signState}</h1>
        <form onSubmit={signState === 'Sign In' ? handleLogin : handleSignUp}>
          {signState === 'Sign Up' && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">{signState}</button>
          {signState === 'Sign In' && (
            <p className="forgot-password">
              <span onClick={() => setShowResetPassword(true)}>
                Forgot Password?
              </span>
            </p>
          )}
          {error && <p className="error">{error}</p>}
        </form>
        <div className="form-switch">
          {signState === 'Sign In' ? (
            <p>
              New to NetBoxed?{' '}
              <span onClick={handleFormSwitch}>Sign Up Now</span>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <span onClick={handleFormSwitch}>Sign In Now</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;