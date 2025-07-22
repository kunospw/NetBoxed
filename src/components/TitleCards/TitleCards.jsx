import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './TitleCards.css';

const TitleCards = ({ title }) => {
  const [cardsData, setCardsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const cardsRef = useRef(null);
  const navigate = useNavigate();

  const TMDB_API_KEY = "377d12c928663a40f0a164f227fc1176";

  // Map title to API category
  const getCategoryFromTitle = (title) => {
    const titleMap = {
      "Trending Now": "trending",
      "Top Rated": "top_rated",
      "Coming Soon": "upcoming",
      "Now Playing": "now_playing",
      "Popular": "popular",
      "Loved by Your Friends": "top_rated", // Fallback to top_rated since there's no specific API for this
    };
    return titleMap[title] || "popular"; // Default to popular if no match
  };

  const getApiUrl = (title) => {
    const baseUrl = "https://api.themoviedb.org/3";
    const category = getCategoryFromTitle(title);
    
    switch (category) {
      case "popular":
        return `${baseUrl}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
      case "trending":
        return `${baseUrl}/trending/movie/week?api_key=${TMDB_API_KEY}&language=en-US`;
      case "top_rated":
        return `${baseUrl}/movie/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
      case "upcoming":
        return `${baseUrl}/movie/upcoming?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
      case "now_playing":
        return `${baseUrl}/movie/now_playing?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
      default:
        return `${baseUrl}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
    }
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(getApiUrl(title));
        if (!response.ok) {
          throw new Error("Failed to fetch data from TMDb");
        }
        const data = await response.json();

        const movies = data.results.map(movie => ({
          id: movie.id,
          image: movie.backdrop_path 
            ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}` 
            : 'https://via.placeholder.com/780x439?text=No+Image',
          name: movie.title,
          rating: movie.vote_average,
          releaseDate: movie.release_date,
        }));

        setCardsData(movies);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, [title]);

  useEffect(() => {
    const handleWheel = (event) => {
      event.preventDefault();
      if (cardsRef.current) {
        cardsRef.current.scrollLeft += event.deltaY;
      }
    };

    if (cardsRef.current) {
      cardsRef.current.addEventListener("wheel", handleWheel);
    }

    return () => {
      if (cardsRef.current) {
        cardsRef.current.removeEventListener("wheel", handleWheel);
      }
    };
  }, [cardsData]);

  const handleCardClick = (movieId) => {
    navigate(`/player/${movieId}`);
  };

  return (
    <div className="title-cards">
      <h2>{title}</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <div className="card-list" ref={cardsRef}>
          {cardsData.map((card) => (
            <div 
              className="card" 
              key={card.id}
              onClick={() => handleCardClick(card.id)}
            >
              <img src={card.image} alt={card.name} />
              <div className="card-info">
                <p className="card-title">{card.name}</p>
                <div className="card-details">
                  <span className="rating">★ {card.rating.toFixed(1)}</span>
                  <span className="release-date">
                    {new Date(card.releaseDate).getFullYear()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TitleCards;