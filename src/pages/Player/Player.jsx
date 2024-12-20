import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './Player.css';

const Player = () => {
  const { id } = useParams();
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user ? user.id : null;  const [movie, setMovie] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [error, setError] = useState(null);

  const TMDB_API_KEY = "377d12c928663a40f0a164f227fc1176";

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        if (!userId) {
          setError("Please sign in to access all features");
          return;
        }

        // Fetch movie details
        const movieResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&language=en-US`
        );
        if (!movieResponse.ok) throw new Error('Failed to fetch movie data');
        const movieData = await movieResponse.json();
        setMovie(movieData);

        // Fetch trailer
        const videoResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_API_KEY}`
        );
        if (!videoResponse.ok) throw new Error('Failed to fetch trailer data');
        const videoData = await videoResponse.json();
        const trailer = videoData.results.find(
          video => video.type === "Trailer" && video.site === "YouTube"
        );
        setTrailer(trailer);

        // Fetch comments
        const commentsResponse = await fetch(`http://localhost:3001/movies/${id}/comments`);
        if (!commentsResponse.ok) throw new Error('Failed to fetch comments');
        const commentsData = await commentsResponse.json();
        setComments(commentsData);

        // Check if movie is in user's watchlist and get rating
        const userResponse = await fetch(`http://localhost:3001/users/${userId}`);
        if (!userResponse.ok) throw new Error('Failed to fetch user data');
        const userData = await userResponse.json();
        
        // Check watchlist using the Set data structure from server
        setIsInWatchlist(userData.watchlist.includes(parseInt(id)));
        
        // Check rating using the new ratings Map structure from server
        const userRatingObj = userData.ratings.find(r => r.movieId === parseInt(id));
        if (userRatingObj) {
          setUserRating(userRatingObj.rating);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      }
    };

    fetchMovieData();
  }, [id, userId]);

  const handleRating = async (rating) => {
    try {
      const response = await fetch(`http://localhost:3001/users/${userId}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: parseInt(id),
          rating
        }),
      });
      
      if (!response.ok) throw new Error('Failed to save rating');
      const updatedUser = await response.json();
      setUserRating(rating);
    } catch (error) {
      console.error("Error saving rating:", error);
      setError("Failed to save rating. Please try again.");
    }
  };

  const handleAddToWatchlist = async () => {
    try {
      const response = await fetch(`http://localhost:3001/users/${userId}/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: parseInt(id)
        }),
      });
      
      if (!response.ok) throw new Error('Failed to update watchlist');
      const updatedUser = await response.json();
      setIsInWatchlist(true);
    } catch (error) {
      console.error("Error updating watchlist:", error);
      setError("Failed to update watchlist. Please try again.");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`http://localhost:3001/users/${userId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: parseInt(id),
          comment: newComment
        }),
      });
      
      if (!response.ok) throw new Error('Failed to post comment');
      const newCommentData = await response.json();
      
      // Fetch updated comments to ensure consistency with server
      const commentsResponse = await fetch(`http://localhost:3001/movies/${id}/comments`);
      if (!commentsResponse.ok) throw new Error('Failed to fetch updated comments');
      const updatedComments = await commentsResponse.json();
      setComments(updatedComments);
      setNewComment('');
    } catch (error) {
      console.error("Error posting comment:", error);
      setError("Failed to post comment. Please try again.");
    }
  };

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (!movie) return <div>Loading...</div>;

  return (
    <div className="player-page">
      <Navbar />
      <div className="movie-header">
        <div className="backdrop" style={{
          backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`
        }}>
          <div className="backdrop-overlay" />
        </div>
        <div className="movie-content">
          <div className="poster-container">
            <img 
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className="movie-poster"
            />
          </div>
          <div className="movie-info">
            <h1>{movie.title}</h1>
            <div className="movie-meta">
              <span>{new Date(movie.release_date).getFullYear()}</span>
              <span>{movie.runtime} mins</span>
              <span>{movie.vote_average.toFixed(1)} ⭐</span>
            </div>
            <p className="movie-overview">{movie.overview}</p>
            <div className="action-buttons">
              <button 
                className={`watchlist-btn ${isInWatchlist ? 'in-list' : ''}`}
                onClick={handleAddToWatchlist}
              >
                {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
              <div className="rating-container">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`star-btn ${star <= userRating ? 'active' : ''}`}
                    onClick={() => handleRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="trailer-section">
        {trailer && (
          <div className="trailer-container">
            <h2>Trailer</h2>
            <iframe
              width="100%"
              height="600"
              src={`https://www.youtube.com/embed/${trailer.key}`}
              title="Movie Trailer"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}
      </div>

      <div className="comments-section">
        <h2>Comments</h2>
        <form onSubmit={handleCommentSubmit} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="comment-input"
          />
          <button type="submit" className="submit-comment">Post Comment</button>
        </form>
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment">
              <div className="comment-header">
                <span className="comment-user">{comment.userName}</span>
                <span className="comment-date">
                  {new Date(comment.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="comment-text">{comment.text}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Player;