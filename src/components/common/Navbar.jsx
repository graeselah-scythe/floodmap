import "./Navbar.css";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="nav-container">

      <ul className="nav-links">
        <li>
          <Link to="/home">Home</Link>
        </li>
        <li>
          <Link to="/map">Flood Map</Link>
        </li>
        <li>
          <Link to="/preparedness">Preparedness</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
