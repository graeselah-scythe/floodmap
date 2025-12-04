import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        {/* Three Column Layout */}
        <div className="footer-top">
          {/* Column 1: Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path 
                  d="M30 5C16.1925 5 5 16.1925 5 30C5 43.8075 16.1925 55 30 55C43.8075 55 55 43.8075 55 30C55 16.1925 43.8075 5 30 5Z" 
                  fill="#1D3045"
                />
                <path 
                  d="M30 15L40 30L30 45L20 30L30 15Z" 
                  fill="#57876E"
                />
                <path 
                  d="M30 35C32.7614 35 35 32.7614 35 30C35 27.2386 32.7614 25 30 25C27.2386 25 25 27.2386 25 30C25 32.7614 27.2386 35 30 35Z" 
                  fill="#F3D79C"
                />
                <path 
                  d="M35 40L40 35L45 40L40 45L35 40Z" 
                  fill="#E1C158"
                  opacity="0.8"
                />
              </svg>
              <h2 className="footer-title">CDO FloodWatch</h2>
            </div>
            <p className="footer-tagline">
              Building a flood-resilient Cagayan de Oro through AI-powered 
              risk assessment and community preparedness.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-links">
            <h3 className="footer-section-title">Quick Links</h3>
            <ul className="link-list">
              <li>
                <Link to="/map" className="footer-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path 
                      d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" 
                      fill="#D2E0D9"
                    />
                  </svg>
                  Flood Map
                </Link>
              </li>
              <li>
                <Link to="/preparedness" className="footer-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path 
                      d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11H19C18.47 14.93 15.61 18.36 12 19.92V11H5V6.3L12 3.19V11Z" 
                      fill="#D2E0D9"
                    />
                  </svg>
                  Preparedness Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Us */}
          <div className="footer-contact">
            <h3 className="footer-section-title">Contact Us</h3>
            <div className="contact-info">
              <div className="contact-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.68 14.91 16.08 14.82 16.43 14.94C17.55 15.31 18.76 15.51 20 15.51C20.55 15.51 21 15.96 21 16.51V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" 
                    fill="#D2E0D9"
                  />
                </svg>
                <span>+639812345780</span>
              </div>
              <div className="contact-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" 
                    fill="#D2E0D9"
                  />
                </svg>
                <span>sample.omni@gmail.com</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Copyright Section */}
        <div className="footer-copyright">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path 
              d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17Z" 
              fill="#F3D79C"
            />
          </svg>
          <span>© 2025 CDO FloodWatch. Built for Cagayan de Oro City, All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;