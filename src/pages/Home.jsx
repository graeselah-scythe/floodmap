import React from 'react'; // Add this missing import
import Navbar from '../components/Navbar';
import HeroSection from '../components/heroSection';

const Home = () => {
  return (
    <div>
      <Navbar />
      <HeroSection />
    </div>
  );
};

export default Home;