<<<<<<< HEAD
import Navbar from '../components/Navbar';
import HeroSection from '../components/heroSection';
import FloodInfo from '../components/FloodInfo';
import AboutFrame from '../components/AboutFrame';
=======
import React from 'react';
import HeroSection from '../components/home/heroSection';
import FloodInfo from '../components/home/FloodInfo';
import AboutFrame from '../components/home/AboutFrame';
>>>>>>> eb04eee92224d96680b487e9fc4ec2d06bda6715

const home = () => {
  return (
    <div>
      <HeroSection />
      <FloodInfo />
      <AboutFrame />
    </div>
  );
};

export default home;