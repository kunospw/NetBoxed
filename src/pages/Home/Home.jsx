import React, { useState, useEffect } from 'react';
import './Home.css';
import Navbar from '../../components/Navbar/Navbar';
import Play_icon from '../../assets/play_icon.png';
import Info_icon from '../../assets/info_icon.png';
import TitleCards from '../../components/TitleCards/TitleCards';
import Footer from '../../components/Footer/Footer';

const Home = () => {
  const [trendingMovie, setTrendingMovie] = useState(null);
  const TMDB_API_KEY = "377d12c928663a40f0a164f227fc1176";
  const TMDB_TRENDING_URL = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=en-US`;

  useEffect(() => {
    const fetchTrendingMovie = async () => {
      try {
        const response = await fetch(TMDB_TRENDING_URL);
        const data = await response.json();
        setTrendingMovie(data.results[0]);
      } catch (error) {
        console.error("Error fetching trending movie:", error);
      }
    };

    fetchTrendingMovie();
  }, []);

  if (!trendingMovie) return <div>Loading...</div>;

  return (
    <div className='home'>
      <Navbar />
      <div className="hero">
        <img 
          src={`https://image.tmdb.org/t/p/original${trendingMovie.backdrop_path}`} 
          alt="" 
          className='banner-img' 
        />
        <div className="hero-wrapper">
          <div className="hero-content">
            <div className="hero-caption">
              <h1 className="movie-title">{trendingMovie.title}</h1>
              <p>{trendingMovie.overview}</p>
              <div className="hero-btns">
                <button className='btn'>
                  <img src={Play_icon} alt="" />Play
                </button>
                <button className='btn dark-btn'>
                  <img src={Info_icon} alt="" />More Info
                </button>
              </div>
            </div>
            <div className="poster-container">
              <img 
                src={`https://image.tmdb.org/t/p/w500${trendingMovie.poster_path}`} 
                alt={trendingMovie.title} 
                className="movie-poster"
              />
            </div>
          </div>
          <div className="hero-titlecards">
            <TitleCards />
          </div>
        </div>
      </div>
      <div className="more-cards">
        <TitleCards title={"Trending Now"}/>
        <TitleCards title={"Top Rated"}/>
        <TitleCards title={"Coming Soon"}/>
        <TitleCards title={"Loved by Your Friends"}/>
      </div>
      <Footer/>
    </div>
  );
};

export default Home;