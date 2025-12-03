import Navbar from '../components/Navbar';
import HeroSection from '../components/heroSection';
import FloodInfo from '../components/FloodInfo';
import AboutFrame from '../components/AboutFrame';

const home = () => {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <FloodInfo />
      <AboutFrame />
    </div>
  );
};

export default home;