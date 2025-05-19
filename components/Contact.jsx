import "./Contact.css"; // Importing CSS file

function Contact() {
  return (
    <footer className="contact-section">
      {/* Dark Overlay for Text Only */}
      <div className="contact-overlay">
        <div className="contact-content">
          <h2>Stay Connected</h2>
          <p>Follow us for real-time wildfire updates and reach out for inquiries.</p>

          {/* Contact Info */}
          <div className="contact-info">
            <p>Email: <a href="mailto:contact@wildfireai.com">contact@wildfireai.com</a></p>
            <p>GitHub: <a href="https://github.com/wildfire-ai" target="_blank" rel="noopener noreferrer">github.com/wildfire-ai</a></p>
          </div>

          {/* Social Media Links */}
          <div className="social-links">
            <a href="#">Twitter</a>
            <a href="#">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Contact;
