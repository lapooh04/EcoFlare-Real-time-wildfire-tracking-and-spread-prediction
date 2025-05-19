import "./Features.css"; // Importing CSS file
import { FaFire, FaChartLine, FaGlobe } from "react-icons/fa";

function Features() {
  return (
    <section className="features-section">
      <div className="features-content">
        <h2>🚀 Cutting-Edge Features</h2>

        <div className="features-grid">
          <div className="feature">
            <div className="feature-box">
              <FaFire className="feature-icon" />
              <h3>🔥 Real-Time Wildfire Detection</h3>
              <p>
                Our AI-powered system continuously monitors vast areas, detecting
                wildfires within <strong>seconds</strong> of ignition.
              </p>
            </div>
          </div>

          <div className="feature">
            <div className="feature-box">
              <FaChartLine className="feature-icon" />
              <h3>📊 Predictive Analytics</h3>
              <p>
                Using advanced machine learning, we <strong>predict</strong> fire
                spread patterns and assess potential risks before disaster
                strikes.
              </p>
            </div>
          </div>

          <div className="feature">
            <div className="feature-box">
              <FaGlobe className="feature-icon" />
              <h3>🌍 Environmental Impact Analysis</h3>
              <p>
                Assess the impact of wildfires on ecosystems and air quality with
                detailed <strong>environmental reports</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features;
