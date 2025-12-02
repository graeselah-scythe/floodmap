import React from 'react'; // Add this missing import
import Navbar from '../components/Navbar';
import HeroSection from '../components/heroSection';
import FloodInfo from '../components/FloodInfo';
import AboutFrame from '../components/AboutFrame';

const Home = () => {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <FloodInfo />
      <AboutFrame />
    </div>
  );
};

export default Home;