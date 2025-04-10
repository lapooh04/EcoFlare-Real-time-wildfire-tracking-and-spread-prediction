from kafka import KafkaConsumer
import psycopg2
import json

conn = psycopg2.connect(
    dbname="disaster_db2",
    user="postgres",
    password="**",  
    host="localhost",
    port="5432"
)
cursor = conn.cursor()

consumer = KafkaConsumer(
    "disaster_alerts", "wildfire_alerts", "flood_alerts", "hurricane_alerts",
    bootstrap_servers="localhost:9092",
    value_deserializer=lambda x: json.loads(x.decode("utf-8"))
)

#the incoming data will be stored into the postgrsql db which will be then used for visualisations
def insert_into_db(data):
    sql = """
    INSERT INTO disasters (disaster_type, location, magnitude, severity, confidence, brightness, 
                           flood_stage, wind_speed, category, timestamp, formatted_time, 
                           latitude, longitude, frp, bright_ti4)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TO_TIMESTAMP(%s), %s, %s, %s, %s)
    """
    values = (
        data.get("disaster_type"),
        data.get("place", data.get("location", "Unknown")),  
        data.get("magnitude"),
        data.get("severity"),
        data.get("confidence"),
        data.get("brightness"),
        data.get("flood_stage"),
        data.get("wind_speed"),
        data.get("category"),
        data.get("time"),  
        int(data["time"]) / 1000 if "time" in data else None,  
        data.get("latitude"),
        data.get("longitude"),
        data.get("frp"),
        data.get("bright_ti4")
    )
    cursor.execute(sql, values)
    conn.commit()

# listening to Kafka topics
for message in consumer:
    disaster_data = message.value
    print(f"Received: {disaster_data}")
    
    try:
        insert_into_db(disaster_data)
    except Exception as e:
        conn.rollback()
        print(f"Error inserting into database: {e}")