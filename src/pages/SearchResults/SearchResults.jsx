import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, Plus, Check } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './SearchResults.css';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q');
  const [movies, setMovies] = useState([]);
  const [sortedMovies, setSortedMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [sortBy, setSortBy] = useState('popularity');
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [watchlist, setWatchlist] = useState(new Set());
  const API_KEY = '377d12c928663a40f0a164f227fc1176';

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const movieResponse = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
        );
        const movieData = await movieResponse.json();
        setMovies(movieData.results);
        setSortedMovies(movieData.results);

        const userResponse = await fetch('http://localhost:3001/users');
        const userData = await userResponse.json();
        const filteredUsers = userData.filter(user => 
          user.name.toLowerCase().includes(query.toLowerCase())
        );
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching results:', error);
      }
      setLoading(false);
    };

    if (query) {
      fetchResults();
    }
  }, [query]);

  const sortMovies = (criteria) => {
    setSortBy(criteria);
    let sorted = [...movies];
    
    switch (criteria) {
      case 'popularity':
        sorted.sort((a, b) => b.popularity - a.popularity);
        break;
      case 'rating':
        sorted.sort((a, b) => b.vote_average - a.vote_average);
        break;
      case 'date':
        sorted.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }
    
    setSortedMovies(sorted);
  };

  const handleFollowToggle = async (userToFollow, e) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const isFollowing = currentUser.following?.includes(userToFollow.id);
      const endpoint = isFollowing 
        ? `http://localhost:3001/users/${currentUser.id}/follow/${userToFollow.id}`
        : `http://localhost:3001/users/${currentUser.id}/follow`;
      
      const response = await fetch(endpoint, {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: isFollowing ? null : JSON.stringify({ followId: userToFollow.id }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleMovieClick = (movieId) => {
    navigate(`/player/${movieId}`);
  };

  const toggleWatchlist = (movieId) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setWatchlist(prev => {
      const newWatchlist = new Set(prev);
      if (newWatchlist.has(movieId)) {
        newWatchlist.delete(movieId);
      } else {
        newWatchlist.add(movieId);
      }
      return newWatchlist;
    });
  };

  if (loading) {
    return (
      <div className="search-results__page">
        <Navbar />
        <div className="search-results__loading">
          <div className="search-results__spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results__page">
      <Navbar />
      <div className="search-results__container">
        <h1 className="search-results__title">
          Search Results for "{query}"
        </h1>

        {users.length > 0 && (
          <section className="search-results__users">
            <h2 className="search-results__section-title">People</h2>
            <div className="search-results__users-grid">
              {users.map(user => (
                <div 
                  key={user.id} 
                  className="search-results__user-card"
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  <div className="search-results__user-avatar">
                    <span>{user.name[0]}</span>
                  </div>
                  <div className="search-results__user-info">
                    <h3>{user.name}</h3>
                    {currentUser && currentUser.id !== user.id && (
                      <button 
                        className={`search-results__follow-button ${
                          currentUser?.following?.includes(user.id) ? 'following' : ''
                        }`}
                        onClick={(e) => handleFollowToggle(user, e)}
                      >
                        {currentUser?.following?.includes(user.id) ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {movies.length > 0 && (
          <section className="search-results__movies">
            <div className="search-results__movies-header">
              <h2 className="search-results__section-title">Movies</h2>
              <div className="search-results__sort-controls">
                <span>Sort by:</span>
                {['popularity', 'rating', 'date', 'title'].map(criterion => (
                  <button 
                    key={criterion}
                    className={`search-results__sort-button ${
                      sortBy === criterion ? 'active' : ''
                    }`}
                    onClick={() => sortMovies(criterion)}
                  >
                    {criterion.charAt(0).toUpperCase() + criterion.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="search-results__movies-grid">
              {sortedMovies.map(movie => (
                <div 
                  key={movie.id}
                  className="search-results__movie-card"
                  onClick={() => handleMovieClick(movie.id)}
                  onMouseEnter={() => setSelectedMovie(movie)}
                  onMouseLeave={() => setSelectedMovie(null)}
                >
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="search-results__movie-poster"
                    />
                  ) : (
                    <div className="search-results__movie-placeholder">
                      <span>{movie.title[0]}</span>
                    </div>
                  )}
                  
                  {selectedMovie?.id === movie.id && (
                    <div className="search-results__movie-overlay">
                      <h3 className="search-results__movie-title">{movie.title}</h3>
                      <div className="search-results__movie-content">
                        <div className="search-results__movie-meta">
                          <Star className="search-results__star-icon" />
                          <span>{movie.vote_average.toFixed(1)}</span>
                          <span className="search-results__separator">•</span>
                          <span>{movie.release_date?.split('-')[0]}</span>
                        </div>
                        <p className="search-results__movie-overview">{movie.overview}</p>
                        <button 
                          className="search-results__watchlist-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchlist(movie.id);
                          }}
                        >
                          {watchlist.has(movie.id) ? (
                            <><Check size={16} /><span>Added</span></>
                          ) : (
                            <><Plus size={16} /><span>Add to List</span></>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {movies.length === 0 && users.length === 0 && (
          <div className="search-results__no-results">
            <h2>No results found for "{query}"</h2>
            <p>Try searching for something else</p>
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
};

export default SearchResults;