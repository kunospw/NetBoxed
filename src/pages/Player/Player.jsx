import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './Player.css';

const Player = () => {
  const { id } = useParams();
  const userId = sessionStorage.getItem('userId');
  const [movie, setMovie] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const TMDB_API_KEY = "377d12c928663a40f0a164f227fc1176";

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        // Fetch movie details
        const movieResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&language=en-US`
        );
        const movieData = await movieResponse.json();
        setMovie(movieData);

        // Fetch trailer
        const videoResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_API_KEY}`
        );
        const videoData = await videoResponse.json();
        const trailer = videoData.results.find(
          video => video.type === "Trailer" && video.site === "YouTube"
        );
        setTrailer(trailer);

        // Fetch comments
        const commentsResponse = await fetch(`http://localhost:3001/movies/${id}/comments`);
        const commentsData = await commentsResponse.json();
        setComments(commentsData);

        // Check if movie is in user's watchlist
        const userResponse = await fetch(`http://localhost:3001/users/${userId}`);
        const userData = await userResponse.json();
        setIsInWatchlist(userData.watchlist.includes(parseInt(id)));
        
        // Get user's rating if it exists
        const userRating = userData.ratings?.find(r => r.movieId === parseInt(id));
        if (userRating) {
          setUserRating(userRating.rating);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
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
      
      if (response.ok) {
        setUserRating(rating);
      }
    } catch (error) {
      console.error("Error saving rating:", error);
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
      
      if (response.ok) {
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error("Error updating watchlist:", error);
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
      
      if (response.ok) {
        const newCommentData = await response.json();
        setComments([newCommentData, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

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