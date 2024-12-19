import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Player from './pages/Player/Player';

const App = () => {
  const location = useLocation();
  const isLoggedIn = sessionStorage.getItem('isLoggedIn'); // Sesuaikan sesuai implementasi autentikasi Anda

  useEffect(() => {
    console.log('Current location:', location.pathname);
  }, [location]);

  return (
    <div>
      <Routes>
        <Route path='/' element={isLoggedIn ? <Home /> : <Navigate to="/login" />} />
        <Route path='/login' element={<Login />} />
        <Route path='/player/:id' element={isLoggedIn ? <Player /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
