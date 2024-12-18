import React, { useState } from 'react';
import './Login.css';
import logo from '../../assets/logo.png';
import { login, signup } from '../../firebase';

const Login = () => {
  const [signState, setSignState] = useState('Sign In');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPssword] = useState('');

  const user_auth = async (event) => {
    event.preventDefault();
    if (signState === 'Sign In') {
      await login(email, password);
    } else {
      await signup(name, email, password);
    }
  };

  return (
    <div className='login'>
      <img src={logo} className='login-logo' alt='' />
      <div className='login-form'>
        <h1>{signState}</h1>
        <form>
          {/* Name Field - Only for Sign Up */}
          {signState === 'Sign Up' && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type='text'
              placeholder='Your Name'
            />
          )}

          {/* Email Field - Always Rendered */}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type='email'
            placeholder='Your Email'
          />

          {/* Password Field - Always Rendered */}
          <input
            value={password}
            onChange={(e) => setPssword(e.target.value)}
            type='password'
            placeholder='Password'
          />

          {/* Submit Button */}
          <button onClick={user_auth} type='submit'>
            {signState}
          </button>

          <div className='form-help'>
            <div className='remember'>
              <input type='checkbox' />
              <label htmlFor=''>Remember Me</label>
            </div>
            <p>Need Help?</p>
          </div>
        </form>

        {/* Sign In/Sign Up Switch */}
        <div className='form-switch'>
          {signState === 'Sign In' ? (
            <p>
              New to Netboxed?{' '}
              <span onClick={() => setSignState('Sign Up')}>Sign Up Now</span>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <span onClick={() => setSignState('Sign In')}>Sign In</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;3