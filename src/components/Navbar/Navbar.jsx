import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../../assets/NetBoxed/TextOnly.png';
import search_icon from '../../assets/search_icon.svg';
import bell_icon from '../../assets/bell_icon.svg';
import profile_img from '../../assets/profile_img.png';

const API_KEY = '377d12c928663a40f0a164f227fc1176';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ movies: [], users: [] });
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  const user = (() => {
    try {
      const userString = sessionStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  })();

  useEffect(() => {
    if (user?.id) {
      fetch('http://localhost:3001/users')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch users');
          return res.json();
        })
        .then(data => setUsers(data.filter(u => u.id !== user.id)))
        .catch(error => console.error('Error fetching users:', error));
    }
  }, [user?.id]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSearch = async e => {
    const query = e.target.value.toLowerCase().trim();
    setSearchQuery(query);

    if (query === '') {
      setSearchResults({ movies: [], users: [] });
      return;
    }

    try {
      const movieResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
      );
      if (!movieResponse.ok) throw new Error('Failed to fetch movies');
      const movieData = await movieResponse.json();

      const userMatches = users
        .filter(u => u.name.toLowerCase().includes(query))
        .slice(0, 5);

      setSearchResults({
        movies: movieData.results.slice(0, 5),
        users: userMatches,
      });
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  const handleSignOut = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <Link to="/">
          <img src={logo} alt="Logo" className="navbar-logo" />
        </Link>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/">TV Shows</Link></li>
          <li><Link to="/">Movies</Link></li>
          <li><Link to="/">New & Popular</Link></li>
          <li><Link to="/">My List</Link></li>
          <li><Link to="/">Browse by Languages</Link></li>
        </ul>
      </div>
      <div className="navbar-right">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search movies or users..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-bar"
          />
          <img src={search_icon} alt="Search" className="icons search-icon" />
          {searchQuery && (
            <div className="search-results">
              {searchResults.movies.length > 0 && (
                <div className="search-category">
                  <h4 className="category-title">Movies</h4>
                  {searchResults.movies.map(movie => (
                    <Link
                      key={movie.id}
                      to={`/player/${movie.id}`}
                      className="search-result-item"
                      onClick={() => setSearchQuery('')}
                    >
                      {movie.title}
                    </Link>
                  ))}
                </div>
              )}
              {searchResults.users.length > 0 && (
                <div className="search-category">
                  <h4 className="category-title">Users</h4>
                  {searchResults.users.map(u => (
                    <Link
                      key={u.id}
                      to={`/profile/${u.id}`}
                      className="search-result-item"
                      onClick={() => setSearchQuery('')}
                    >
                      {u.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <img src={bell_icon} alt="Notifications" className="icons" />
        <Link to={`/profile/${user.id}`} className="nav-profile">
          <img src={profile_img} alt="Profile" className="profile" />
        </Link>
        <button onClick={handleSignOut} className="sign-out-button">
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Navbar;
