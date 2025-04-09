# EcoFlare: Real-Time Wildfire Monitoring & Spread Prediction System

**EcoFlare** is an end-to-end, full-stack wildfire monitoring and prediction platform that leverages geospatial deep learning, real-time data streaming, and scalable analytics to provide actionable insights into fire-prone zones and active wildfire spread.

---

## Project Overview

With the increasing frequency of wildfires due to climate change, there's a pressing need for intelligent, scalable, and real-time wildfire detection systems. EcoFlare was built to address this challenge using cutting-edge technologies and smart geospatial analysis.

---

## Key Features

- **Wildfire Segmentation**  
  Trained a U-Net-based deep learning model from scratch for semantic segmentation of wildfire zones using satellite imagery.

- **Dynamic Risk Prediction**  
  Predicts fire spread and maps live wildfire risk based on the user’s geolocation (latitude and longitude), without requiring manual image input.

- **Real-Time Monitoring**  
  Implements Apache Kafka to enable continuous ingestion and processing of streaming data for real-time decision making.

- **Analytics Dashboard**  
  Visualizes fire spread, risk levels, and regional trends using **Apache Superset**, enabling live analytics for disaster response teams.

- **Full-Stack Architecture**  
  - **Backend**: Built with Spring Boot (Java) for REST APIs and system orchestration.  
  - **Model Serving**: Hosted ML inference using Flask (Python) as a dedicated model microservice.  
  - **Frontend**: Developed an interactive and responsive user interface using React.js.

---

