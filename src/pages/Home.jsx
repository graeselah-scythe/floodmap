import React from 'react';
import HeroSection from '../components/home/heroSection';
import FloodInfo from '../components/home/FloodInfo';
import AboutFrame from '../components/home/AboutFrame';
import Footer from '../components/common/Footer';

const home = () => {
  return (
    <div>
      <HeroSection />
      <FloodInfo />
      <AboutFrame />
      <Footer />
    </div>
  );
};

export default home;