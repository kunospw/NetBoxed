import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [following, setFollowing] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const { id } = useParams();
  const TMDB_API_KEY = "377d12c928663a40f0a164f227fc1176";
  const TMDB_TRENDING_URL = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=en-US`;

  useEffect(() => {
    // Fetch user data
    fetch(`http://localhost:3001/users/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`User not found: ${res.status}`);
        }
        return res.json();
      })
      .then((userData) => {
        setUser(userData);
        // Fetch following users' details
        return Promise.all(
          userData.following.map((followId) =>
            fetch(`http://localhost:3001/users/${followId}`).then((res) => {
              if (!res.ok) {
                throw new Error(`Following user not found: ${res.status}`);
              }
              return res.json();
            })
          )
        ).then((followingData) => setFollowing(followingData));
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
        setUser(null); // Optional: Handle user not found
      });
  }, [id]);
  

  if (!user) return <div>Loading...</div>;

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-content">
        <div className="profile-header">
          <div className="profile-info">
            <h1>{user.name}</h1>
            <p>{user.email}</p>
          </div>
        </div>

        <div className="profile-sections">
          <div className="following-section">
            <h2>Following</h2>
            <div className="following-grid">
              {following.map(followedUser => (
                <div key={followedUser.id} className="following-item">
                  <div className="following-name">{followedUser.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="watchlist-section">
            <h2>My Watchlist</h2>
            <div className="watchlist-grid">
              {watchlist.map(movie => (
                <div key={movie.id} className="watchlist-item">
                  <img
                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                    alt={movie.title}
                    className="movie-poster"
                  />
                  <h3>{movie.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;