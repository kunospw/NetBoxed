import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './Player.css';

const Player = () => {
  const { id } = useParams();
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user ? user.id : null;
  const [movie, setMovie] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [error, setError] = useState(null);
  const [friendsRatings, setFriendsRatings] = useState([]);

  const TMDB_API_KEY = "377d12c928663a40f0a164f227fc1176";

  // Memoize fetch functions to prevent unnecessary rerenders
  const fetchComments = useCallback(async () => {
    try {
      const commentsResponse = await fetch(`http://localhost:3001/movies/${id}/comments`);
      if (!commentsResponse.ok) throw new Error('Failed to fetch comments');
      const commentsData = await commentsResponse.json();
      setComments(commentsData);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  }, [id]);

  const fetchFriendsRatings = useCallback(async () => {
    if (!userId) return;
    
    try {
      const userResponse = await fetch(`http://localhost:3001/users/${userId}`);
      if (!userResponse.ok) throw new Error('Failed to fetch user data');
      const userData = await userResponse.json();

      const friendsRatingsPromises = userData.following.map(async (friendId) => {
        const friendResponse = await fetch(`http://localhost:3001/users/${friendId}`);
        if (!friendResponse.ok) return null;
        const friendData = await friendResponse.json();
        const movieRating = friendData.ratings.find(r => r.movieId === parseInt(id));
        return movieRating ? { 
          name: friendData.name, 
          rating: movieRating.rating 
        } : null;
      });

      const ratings = (await Promise.all(friendsRatingsPromises)).filter(r => r !== null);
      setFriendsRatings(ratings);
    } catch (error) {
      console.error("Error fetching friends' ratings:", error);
    }
  }, [userId, id]);

  // Set up polling with cleanup
  useEffect(() => {
    if (!userId || !id) return;

    const pollInterval = setInterval(() => {
      fetchComments();
      fetchFriendsRatings();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [userId, id, fetchComments, fetchFriendsRatings]);

  // Initial data fetch
  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        if (!userId) {
          setError("Please sign in to access all features");
          return;
        }

        const movieResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&language=en-US`
        );
        if (!movieResponse.ok) throw new Error('Failed to fetch movie data');
        const movieData = await movieResponse.json();
        setMovie(movieData);

        const videoResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_API_KEY}`
        );
        if (!videoResponse.ok) throw new Error('Failed to fetch trailer data');
        const videoData = await videoResponse.json();
        const trailer = videoData.results.find(
          video => video.type === "Trailer" && video.site === "YouTube"
        );
        setTrailer(trailer);

        await fetchComments();
        await fetchFriendsRatings();

        const userResponse = await fetch(`http://localhost:3001/users/${userId}`);
        if (!userResponse.ok) throw new Error('Failed to fetch user data');
        const userData = await userResponse.json();
        
        setIsInWatchlist(userData.watchlist.includes(parseInt(id)));
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
  }, [id, userId, fetchComments, fetchFriendsRatings]);
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
      setUserRating(rating);
      await fetchFriendsRatings(); // Refresh friends' ratings
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
      await fetchComments(); // Refresh comments immediately
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


  if (error) return <div className="player-error">{error}</div>;
  if (!movie) return <div className="player-loading">Loading...</div>;

  return (
    <div className="player-page">
      <Navbar />
      <div className="player-movie-header">
        <div 
          className="player-backdrop"
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`
          }}
        >
          <div className="player-backdrop-overlay" />
        </div>
        <div className="player-movie-content">
          <div className="player-movie-info">
            <h1>{movie.title}</h1>
            <div className="player-movie-meta">
              <span>{new Date(movie.release_date).getFullYear()}</span>
              <span>{movie.runtime} mins</span>
              <span>{movie.vote_average.toFixed(1)} ⭐</span>
            </div>
            <p className="player-movie-overview">{movie.overview}</p>
            <div className="player-action-buttons">
              <button 
                className={`player-watchlist-btn ${isInWatchlist ? 'in-list' : ''}`}
                onClick={handleAddToWatchlist}
              >
                {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
              <div className="player-rating-container">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`player-star-btn ${star <= userRating ? 'active' : ''}`}
                    onClick={() => handleRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            {friendsRatings.length > 0 && (
              <div className="player-friends-ratings">
                <h3>Friends' Ratings</h3>
                {friendsRatings.map((friend, index) => (
                  <div key={index} className="player-friend-rating">
                    <span>{friend.name}</span>
                    <span>{'★'.repeat(friend.rating)}{'☆'.repeat(5-friend.rating)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="player-poster-container">
            <img 
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className="player-movie-poster"
            />
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