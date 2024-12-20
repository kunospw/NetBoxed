import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const { id } = useParams();
  
  const currentUser = JSON.parse(sessionStorage.getItem('user'));
  const currentUserId = currentUser ? String(currentUser.id) : null;
  
  const TMDB_API_KEY = "377d12c928663a40f0a164f227fc1176";

  useEffect(() => {
    if (!id) {
      console.log('No ID provided');
      return;
    }
    
    const normalizedId = String(id);

    fetch(`http://localhost:3001/users/${normalizedId}`)
      .then(res => {
        if (!res.ok) throw new Error(`User not found: ${res.status}`);
        return res.json();
      })
      .then(userData => {
        setUser(userData);
        setIsCurrentUser(String(currentUserId) === normalizedId);
        setIsFollowing(currentUser?.following?.map(String).includes(normalizedId) || false);

        // Fetch following
        const followingPromises = userData.following.map((followId) =>
          fetch(`http://localhost:3001/users/${String(followId)}`).then(res => res.json())
        );

        // Fetch followers
        const followersPromises = userData.followers.map((followerId) =>
          fetch(`http://localhost:3001/users/${String(followerId)}`).then(res => res.json())
        );

        return Promise.all([Promise.all(followingPromises), Promise.all(followersPromises)]);
      })
      .then(([followingData, followersData]) => {
        setFollowing(followingData);
        setFollowers(followersData);
      })
      .catch(error => {
        console.error("Error fetching user data:", error);
        setUser(null);
      });
  }, [id, currentUserId]);

  useEffect(() => {
    if (user?.watchlist && user.watchlist.length > 0) {
      Promise.all(
        user.watchlist.map((movieId) =>
          fetch(
            `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`
          ).then(res => res.json())
        )
      )
        .then(movies => {
          const validMovies = movies.filter(movie => movie.poster_path);
          setWatchlist(validMovies);
        })
        .catch(error => console.error("Error fetching watchlist data:", error));
    } else {
      setWatchlist([]);
    }
  }, [user]);

  const handleFollowToggle = () => {
    if (!currentUserId) {
      console.error('No current user ID available');
      return;
    }

    fetch(`http://localhost:3001/users/${String(currentUserId)}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followId: String(id) }),
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to update follow status");
        return res.json();
      })
      .then(updatedUser => {
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        setIsFollowing(!isFollowing);
      })
      .catch(error => console.error("Error following/unfollowing user:", error));
  };

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-content">
        <div className="profile-header">
          <div className="profile-info">
            <h1>{user.name}</h1>
            <p>{user.email}</p>
            <div className="profile-stats">
              <span>Following: {user.following?.length || 0}</span>
              <span>Followers: {user.followers?.length || 0}</span>
              <span>Watchlist: {user.watchlist?.length || 0}</span>
            </div>
            {!isCurrentUser && (
              <button 
                className="follow-button"
                onClick={handleFollowToggle}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            )}
          </div>
        </div>

        <div className="profile-sections">
          <div className="following-section">
            <h2>Following ({following.length})</h2>
            <div className="following-grid">
              {following.length > 0 ? (
                following.map(followedUser => (
                  <Link to={`/profile/${followedUser.id}`} key={followedUser.id} className="following-item">
                    <div className="following-avatar">
                      {followedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="following-details">
                      <div className="following-name">{followedUser.name}</div>
                      <div className="following-email">{followedUser.email}</div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="no-content">Not following anyone yet</p>
              )}
            </div>
          </div>

          <div className="followers-section">
            <h2>Followers ({followers.length})</h2>
            <div className="followers-grid">
              {followers.length > 0 ? (
                followers.map(follower => (
                  <Link to={`/profile/${follower.id}`} key={follower.id} className="followers-item">
                    <div className="follower-avatar">
                      {follower.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="follower-details">
                      <div className="follower-name">{follower.name}</div>
                      <div className="follower-email">{follower.email}</div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="no-content">No followers yet</p>
              )}
            </div>
          </div>

          <div className="watchlist-section">
            <h2>
              {isCurrentUser ? "My Watchlist" : `${user.name}'s Watchlist`} 
              ({watchlist.length})
            </h2>
            <div className="watchlist-grid">
              {watchlist.length > 0 ? (
                watchlist.map(movie => (
                  <div key={movie.id} className="watchlist-item">
                    <div className="movie-poster-container">
                      <img
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        className="movie-poster"
                      />
                      <div className="movie-info">
                        <h3>{movie.title}</h3>
                        <p className="movie-year">
                          {new Date(movie.release_date).getFullYear()}
                        </p>
                        <p className="movie-rating">
                          ★ {movie.vote_average.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-content">No movies in watchlist yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
