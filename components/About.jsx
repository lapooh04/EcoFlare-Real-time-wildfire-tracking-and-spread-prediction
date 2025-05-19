import "./About.css"; // Importing CSS file

function About() {
  return (
    <section className="about-section">
      <div className="about-content">
        {/* Dark Overlay for Content */}
        <div className="overlay">
          <h2>Why Wildfire Detection Matters?</h2>

          {/* Attention-Grabbing Statistic */}
          <p className="highlight-text">
            Every year, wildfires burn over <strong>10 million acres</strong> of land, 
            destroying homes, habitats, and lives.
          </p>

          {/* Core Message */}
          <p>
            Wildfires cause immense harm to the environment, wildlife, and human communities. 
            Early detection and rapid response can make the difference between containment 
            and catastrophe.
          </p>

          {/* AI-Powered Detection */}
          <p>
            Our AI-powered system uses <strong>real-time data and predictive analytics</strong> to 
            detect wildfires early and assess risks accurately—ensuring proactive measures 
            are taken before it's too late.
          </p>

          {/* Urgent Call-to-Action */}
          <p className="cta-text">
            <strong>The time to act is now! Together, we can prevent devastation and save lives.</strong>
          </p>
        </div>
      </div>
    </section>
  );
}

export default About;
