import { useNavigate } from "react-router-dom";
import "./Hero.css";

function Hero() {
  const navigate = useNavigate();

  return (
    <div className="hero">
      {/* Background Video */}
      <video autoPlay loop muted className="hero-video">
        <source src="/videos/wildfire.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay Content */}
      <div className="hero-content">
        <h1>AI-Powered Wildfire Detection & Prediction</h1>
        <div className="text-container">
          <p>Real-time alerts & predictive analytics to prevent wildfires.</p>
        </div>
        <div>
          <button onClick={() => navigate('/livemap')}>Try Live Map</button>
          <button onClick={() => navigate('/dashboard')}>Live Dashboard</button>
          <button>Learn More</button>
        </div>
      </div>
    </div>
  );
}

export default Hero;
