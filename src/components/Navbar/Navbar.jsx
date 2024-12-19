import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../../assets/NetBoxed/TextOnly.png';
import search_icon from '../../assets/search_icon.svg';
import bell_icon from '../../assets/bell_icon.svg';
import profile_img from '../../assets/profile_img.png';
import caret_icon from '../../assets/caret_icon.svg';

const Navbar = () => {
  const userId = sessionStorage.getItem('userId');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Only fetch data if userId exists
    if (userId) {
      // Fetch movies
      fetch('https://api.themoviedb.org/3/movie/popular?api_key=377d12c928663a40f0a164f227fc1176')
        .then((res) => res.json())
        .then((data) => {
          setMovies(data.results);
        })
        .catch((error) => console.error('Error fetching movies:', error));

      // Fetch users
      fetch('http://localhost:3001/users')
        .then((res) => res.json())
        .then((data) => {
          setUsers(data);
        })
        .catch((error) => console.error('Error fetching users:', error));
    }
  }, [userId]);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]); // Clear results if the query is empty
      return;
    }

    // Search for matches in movies and users
    const movieMatches = movies.filter((movie) =>
      movie.title.toLowerCase().includes(query)
    );
    const userMatches = users.filter((user) =>
      user.name.toLowerCase().includes(query)
    );

    setSearchResults([...movieMatches, ...userMatches]); // Combine results
  };

  console.log('Search Results:', searchResults);

  const handleSignOut = () => {
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = '/login';
  };

  if (!userId) {
    console.error("Error: userId is not provided!");
    return null; // Render nothing if userId is missing
  }

  return (
    <div className='navbar'>
      <div className="navbar-left">
        <Link to="/">
          <img src={logo} alt="Logo" className="navbar-logo" />
        </Link>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>TV Shows</li>
          <li>Movies</li>
          <li>New & Popular</li>
          <li>My List</li>
          <li>Browse by Languages</li>
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
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result, index) => (
                <Link
                  key={index}
                  to={result.title ? `/player/${result.id}` : `/profile/${result.id}`}
                  className="search-result-item"
                >
                  {result.title || result.name}
                </Link>
              ))}
            </div>
          )}
        </div>
        <p>Children</p>
        <img src={bell_icon} alt="Notifications" className='icons' />
        <div className="navbar-profile">
          <Link to={`/profile/${userId}`} className="nav-profile">
            <img src={profile_img} alt="Profile" className='profile' />
          </Link>
          <img src={caret_icon} alt="Dropdown caret" />
        <div className="dropdown">
          <p onClick={handleSignOut}>Sign out</p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
