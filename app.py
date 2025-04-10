#model api using flask
import io
import os
import numpy as np
import pandas as pd
import requests
import tensorflow as tf
import seaborn as sns
import matplotlib.pyplot as plt
from flask import Flask, request, jsonify, send_file


API_KEY = "***"
GOOGLE_API_KEY = "***"
NASA_KEY = "***"


MODEL_PATH = "wildfire_model.keras"
model = tf.keras.models.load_model(MODEL_PATH)

app = Flask(__name__)


def get_weather_data(lat, lon):
    url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}"
    response = requests.get(url).json()
    
    if "main" not in response:
        raise ValueError(f"Invalid response from OpenWeatherMap: {response}")

    return {
        "tmmn": response["main"]["temp_min"] - 273.15,
        "tmmx": response["main"]["temp_max"] - 273.15,
        "sph": response["main"]["humidity"] / 100.0,
        "vs": response["wind"]["speed"]
    }


def get_elevation_data(lat, lon):
    url = f"https://maps.googleapis.com/maps/api/elevation/json?locations={lat},{lon}&key={GOOGLE_API_KEY}"
    response = requests.get(url).json()
    
    return {"elevation": response["results"][0]["elevation"]}


def get_fire_mask(lat, lon):
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{NASA_KEY}/MODIS_NRT/world/1"
    response = requests.get(url).text  
    fire_data = pd.read_csv(io.StringIO(response))

    fire_nearby = fire_data[(abs(fire_data["latitude"] - lat) < 0.1) & (abs(fire_data["longitude"] - lon) < 0.1)]
    return 1 if not fire_nearby.empty else 0

@app.route("/", methods=["GET"])
def home():
    return "Wildfire Prediction API is Running! Use /predict to get predictions."

@app.route("/predict", methods=["POST"])
def predict():
    try:
       
        data = request.json
        lat, lon = data["latitude"], data["longitude"]

      
        weather_data = get_weather_data(lat, lon)
        elevation_data = get_elevation_data(lat, lon)
        prev_fire_mask = get_fire_mask(lat, lon)

     
        input_features = np.zeros((1, 32, 32, 12))
        input_features[:, :, :, 0] = elevation_data["elevation"]
        input_features[:, :, :, 1] = weather_data["vs"]
        input_features[:, :, :, 2] = weather_data["tmmn"]
        input_features[:, :, :, 3] = weather_data["tmmx"]
        input_features[:, :, :, 4] = weather_data["sph"]
        input_features[:, :, :, 5] = prev_fire_mask

       
        raw_prediction = model.predict(input_features)[0]  
     
        heatmap_path = "static/fire_prediction.png"
        generate_heatmap(raw_prediction, heatmap_path)

        avg_fire_risk = np.mean(raw_prediction)
        fire_risk_percentage = round(avg_fire_risk * 150, 2)

   
        if fire_risk_percentage > 10:
            risk_level = "HIGH!! Get To Safety..."
        elif fire_risk_percentage > 5:
            risk_level = "MEDIUM! Stay Safe and Vigilant..."
        else:
            risk_level = "LOW. Relax, You are Safe!"

    
        return jsonify({
            "fire_risk_percentage": fire_risk_percentage,
            "risk_level": risk_level,
            "heatmap_url": f"/heatmap"
        })

    except Exception as e:
        import traceback
        error_message = traceback.format_exc()
        return jsonify({"error": str(e), "details": error_message})

@app.route("/heatmap", methods=["GET"])
def serve_heatmap():
    """Serve the heatmap image."""
    heatmap_path = "static/fire_prediction.png"
    if not os.path.exists(heatmap_path):
        return jsonify({"error": "No heatmap found. Make a prediction first."})
    return send_file(heatmap_path, mimetype="image/png")

def generate_heatmap(prediction, save_path):
    """Generate and save a heatmap from model predictions."""
    plt.figure(figsize=(8, 6))
    sns.heatmap(prediction.squeeze(), cmap="hot", cbar=True)  

    plt.title("Wildfire Spread Prediction")
    plt.axis("off")  
    plt.savefig(save_path, bbox_inches="tight")
    plt.close()

if __name__ == "__main__":
    app.run(debug=True)
