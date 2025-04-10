from kafka import KafkaProducer
import json
import requests
import csv
import time
from io import StringIO

producer = KafkaProducer(
    bootstrap_servers="localhost:9092",
    value_serializer=lambda v: json.dumps(v).encode("utf-8") 
)

NASA_FIRMS_API_KEY = "**"

# earthquake data usgs
def fetch_earthquake_data():
    url = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=5"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        for event in data["features"]:
            quake_info = {
                "disaster_type": "Earthquake",
                "place": event["properties"]["place"],
                "magnitude": event["properties"]["mag"],
                "time": event["properties"]["time"]
            }
            print(f"Sending Earthquake: {quake_info}")
            producer.send("disaster_alerts", quake_info)
            time.sleep(1)
    except requests.exceptions.RequestException as e:
        print(f"Error fetching earthquake data: {e}")

# wildfire data (NASA FIRMS API)
def fetch_wildfire_data():
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{NASA_FIRMS_API_KEY}/VIIRS_SNPP_NRT/-125.0,24.5,-66.0,49.5/1"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        if len(response.text.strip().split("\n")) == 1:
            print("No Active Wildifre Alerts")
            return
        csv_data = StringIO(response.text)
        reader = csv.DictReader(csv_data)
      
        for i, row in enumerate(reader):
            if i >= 5:  
                break
            wildfire_info = {
                "disaster_type": "Wildfire",
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "bright_ti4" : float(row["bright_ti4"]),
                "frp" : float(row["frp"]),
                "scan": float(row["scan"]),
                "track": float(row["track"]),
                "acq_date": row["acq_date"],
                "acq_time": row["acq_time"],
                "instrument": row["instrument"],
                "confidence": row["confidence"],
                "time": int(time.time() * 1000)
            }
            print(f"Sending Wildfire: {wildfire_info}")
            producer.send("wildfire_alerts", wildfire_info)
            time.sleep(0.5)  
    except requests.exceptions.RequestException as e:
        print(f"Error fetching wildfire data: {e}")


#flood alerts (NOAA API)
def fetch_flood_data():
    url = "https://api.weather.gov/alerts/active?event=Flood"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        if not data["features"]:  
            print("No active flood alerts found.")
            return  


        for alert in data["features"]:
            flood_info = {
                "disaster_type": "Flood",
                "location": alert["properties"]["areaDesc"],
                "severity": alert["properties"]["severity"],
                "headline": alert["properties"]["headline"],
                "time": int(time.time() * 1000)
            }
            print(f"Sending Flood: {flood_info}")
            producer.send("flood_alerts", flood_info)
            time.sleep(1)
    except requests.exceptions.RequestException as e:
        print(f"Error fetching flood data: {e}")

# hurricane alerts (NOAA API)
def fetch_hurricane_data():
    url = "https://api.weather.gov/alerts/active?event=Hurricane"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        if not data["features"]:  
            print("No active hurricane alerts found.")
            return  

        for alert in data["features"]:
            hurricane_info = {
                "disaster_type": "Hurricane",
                "location": alert["properties"]["areaDesc"],
                "severity": alert["properties"]["severity"],
                "headline": alert["properties"]["headline"],
                "time": int(time.time() * 1000)
            }
            print(f"Sending Hurricane: {hurricane_info}")
            producer.send("hurricane_alerts", hurricane_info)
            time.sleep(1)
    except requests.exceptions.RequestException as e:
        print(f"Error fetching hurricane data: {e}")

while True:
    fetch_earthquake_data()
    fetch_wildfire_data()
    fetch_flood_data()
    fetch_hurricane_data()
    time.sleep(60)  # time between fetching data again (1 min for now, will increase later)

