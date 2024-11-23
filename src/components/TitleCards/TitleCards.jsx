import React, { useState, useEffect, useRef } from 'react';
import './TitleCards.css';

const TMDB_API_KEY = "377d12c928663a40f0a164f227fc1176"; 
const TMDB_API_URL = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`;

const TitleCards = ({title, category}) => {
  const [cardsData, setCardsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const cardsRef = useRef(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(TMDB_API_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch data from TMDb");
        }
        const data = await response.json();

        const movies = data.results.map(movie => ({
          image: movie.backdrop_path 
            ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}` 
            : 'https://via.placeholder.com/780x439?text=No+Image',
          name: movie.title,
        }));

        setCardsData(movies);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

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
  }, [cardsData]); // Run only after cardsData is set to avoid null ref.

  return (
    <div className="title-cards">
      <h2>{title?title:"Popular"}</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <div className="card-list" ref={cardsRef}>
          {cardsData.map((card, index) => (
            <div className="card" key={index}>
              <img src={card.image} alt={card.name} />
              <p>{card.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TitleCards;