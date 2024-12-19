import React, { useState, useEffect } from 'react';
import './Login.css';
import logo from '../../assets/NetBoxed/TextOnly.png';

const Login = () => {
  const [signState, setSignState] = useState('Sign In');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [userData, setUserData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/users')
      .then((response) => response.json())
      .then((data) => setUserData(data))
      .catch((error) => console.error('Error fetching user data:', error));
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    fetch('http://localhost:3001/sign-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Sign-In Response:', data);
        if (data.user) {
          // Store both isLoggedIn and userId
          sessionStorage.setItem('isLoggedIn', 'true');
          sessionStorage.setItem('userId', data.user.id); // Set userId in sessionStorage
          alert('Sign In successful!');
          window.location.href = '/'; // Redirect to home page
        } else {
          setError(data.message);
        }
      })
      .catch((error) => {
        console.error('Error during sign in:', error);
        setError('Error during sign in.');
      });
  };
  

  const handleSignUp = (e) => {
    e.preventDefault();
    const newUser = {
      name: e.target.name.value,
      email,
      password,
    };
    console.log('Sign-Up Data:', newUser); // Debug data before sending

    fetch('http://localhost:3001/sign-up', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser),
    })
      .then((response) => {
        console.log('Sign-Up Response Status:', response.status); // Debug response status
        return response.json();
      })
      .then((data) => {
        console.log('Sign-Up Response Body:', data); // Debug response body
        if (data.user) {
          alert('Sign Up successful!');
          setSignState('Sign In');
          setError('');
        } else {
          setError(data.message);
        }
      })
      .catch((error) => {
        console.error('Error during sign up:', error);
        setError('Error during sign up.');
      });
  };

  return (
    <div className="login">
      <img src={logo} className="login-logo" alt="Logo" />
      <div className="login-form">
        <h1>{signState}</h1>
        <form onSubmit={signState === 'Sign In' ? handleLogin : handleSignUp}>
          {signState === 'Sign Up' && <input type="text" name="name" placeholder="Your name" />}
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
          {error && <p className="error">{error}</p>}
        </form>
        <div className="form-switch">
          {signState === 'Sign In' ? (
            <p>
              New to NetBoxed?{' '}
              <span onClick={() => setSignState('Sign Up')}>Sign Up Now</span>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <span onClick={() => setSignState('Sign In')}>Sign In Now</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
