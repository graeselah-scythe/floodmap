import React from 'react';
import HeroSection from '../components/home/heroSection';
import FloodInfo from '../components/home/FloodInfo';
import AboutFrame from '../components/home/AboutFrame';

const Home = () => {
  return (
    <div>
      <HeroSection />
      <FloodInfo />
      <AboutFrame />
    </div>
  );
};

export default Home;