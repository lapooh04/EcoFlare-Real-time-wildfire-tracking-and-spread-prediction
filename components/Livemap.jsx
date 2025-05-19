import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import Papa from "papaparse";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet.heat";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Heatmap Layer Component
const HeatmapLayer = ({ points }) => {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    const heatData = points.map(p => [p.lat, p.lng, p.intensity * 100]);
    
    heatLayerRef.current = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {0.2: 'blue', 0.4: 'cyan', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red'}
    }).addTo(map);

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [points, map]);

  return null;
};

const Livemap = () => {
  const [wildfires, setWildfires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchResult, setSearchResult] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [riskInfo, setRiskInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [nearbyWildfires, setNearbyWildfires] = useState([]);
  const [windDirection, setWindDirection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const mapRef = useRef(null);

  // Fetch wildfire data from NASA
  useEffect(() => {
    const fetchWildfireData = async () => {
      try {
        const apiKey = process.env.REACT_APP_NASA_API_KEY;
        const response = await axios.get(
          `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/VIIRS_SNPP_NRT/world/1`,
          { responseType: "blob" }
        );

        Papa.parse(response.data, {
          header: true,
          dynamicTyping: true,
          complete: (result) => {
            const formattedData = result.data.map((row) => ({
              latitude: parseFloat(row.latitude),
              longitude: parseFloat(row.longitude),
              brightness: parseFloat(row.bright_ti4),
              date: `${row.acq_date} ${row.acq_time}`,
              confidence: row.confidence || "unknown",
              frp: parseFloat(row.frp),
              satellite: row.satellite || "unknown",
              status: parseFloat(row.frp) > 500 ? "High Danger" : 
                     parseFloat(row.frp) > 100 ? "Moderate Danger" : "Low Danger"
            }));
            setWildfires(formattedData);
            setLoading(false);
          },
          error: (error) => {
            console.error("Error parsing CSV:", error);
            setLoading(false);
          },
        });
      } catch (error) {
        console.error("Error fetching wildfire data:", error);
        setLoading(false);
      }
    };

    fetchWildfireData();
  }, []);

  // Fetch heatmap prediction from Flask backend and wind data
  const fetchHeatmapPrediction = async (lat, lng) => {
    try {
      // Get prediction from your Flask backend
      const response = await axios.post('http://localhost:5000/predict', {
        latitude: lat,
        longitude: lng
      });
      
      // Get wind data from OpenWeather
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.REACT_APP_OPENWEATHER_KEY}`
      );
      setWindDirection(weatherResponse.data.wind.deg || 0);
      
      setHeatmapData(response.data.data.heatmap.points);
      setRiskInfo({
        percentage: response.data.data.risk.percentage,
        level: response.data.data.risk.level
      });
      
      // Find nearby wildfires
      const radius = 1;
      const nearby = wildfires.filter(
        fire => Math.abs(fire.latitude - lat) <= radius && 
               Math.abs(fire.longitude - lng) <= radius
      );
      setNearbyWildfires(nearby);

      // Center map on prediction area
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], 12);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to get prediction data");
    }
  };

  // Handle location search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const provider = new OpenStreetMapProvider();
    const results = await provider.search({ query: searchQuery });

    if (results.length > 0) {
      const { x: lng, y: lat } = results[0];
      setSearchResult({ lat, lng });
      fetchHeatmapPrediction(lat, lng);
    } else {
      alert("Location not found. Please try again.");
    }
  };

  // Helper function to convert degrees to compass direction
  const getWindDirectionText = (degrees) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round((degrees % 360) / 45);
    return directions[index % 8];
  };

  if (loading) {
    return <div className="loading-screen">Loading wildfire data...</div>;
  }

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      {/* Search Bar - Fixed Position */}
      <div style={{
        position: "absolute",
        top: "10px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        width: "400px",
        backgroundColor: "white",
        padding: "10px",
        borderRadius: "5px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
      }}>
        <form onSubmit={handleSearch} style={{ display: "flex" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter location or coordinates"
            style={{
              flex: 1,
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px 0 0 4px",
              outline: "none"
            }}
          />
          <button 
            type="submit"
            style={{
              padding: "8px 15px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "0 4px 4px 0",
              cursor: "pointer"
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Map */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%" }}
        whenCreated={map => { mapRef.current = map; }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Heatmap Overlay */}
        {heatmapData && <HeatmapLayer points={heatmapData} />}

        {/* Wildfire Markers */}
        <MarkerClusterGroup>
          {wildfires.map((fire, index) => (
            <Marker key={index} position={[fire.latitude, fire.longitude]}>
              <Popup>
                <div>
                  <h3>Wildfire Details</h3>
                  <p><strong>Date:</strong> {fire.date}</p>
                  <p><strong>Brightness:</strong> {fire.brightness} K</p>
                  <p><strong>FRP:</strong> {fire.frp} MW</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span style={{
                      color: fire.status === "High Danger" ? "red" : 
                            fire.status === "Moderate Danger" ? "orange" : "green",
                      fontWeight: "bold"
                    }}>
                      {fire.status}
                    </span>
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {/* Search Result Marker with Combined Info */}
        {searchResult && (
          <Marker position={[searchResult.lat, searchResult.lng]}>
            <Popup>
              <div style={{ maxWidth: "300px" }}>
                <h2>Location Analysis</h2>
                <h3>Wildfire Risk Prediction</h3>
                {riskInfo && (
                  <div style={{ marginBottom: "15px" }}>
                    <p><strong>Risk Level:</strong> 
                      <span style={{
                        color: riskInfo.level.toLowerCase().includes("high") ? "red" : 
                              riskInfo.level.toLowerCase().includes("medium") ? "orange" : "green",
                        fontWeight: "bold"
                      }}>
                        {" " + riskInfo.level}
                      </span>
                    </p>
                    <p><strong>Risk Percentage:</strong> {riskInfo.percentage}%</p>
                  </div>
                )}
                
                {/* Fire Spread Visualization Section */}
                <div style={{ 
                  margin: "15px 0", 
                  padding: "10px",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "5px",
                  border: "1px solid #eee"
                }}>
                  <h4 style={{ marginTop: 0 }}>Fire Spread Simulation</h4>
                  
                  <div style={{
                    position: "relative",
                    width: "100%",
                    height: "150px",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    overflow: "hidden",
                    marginBottom: "10px"
                  }}>
                    {/* Fire center point */}
                    <div style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: "red",
                      transform: "translate(-50%, -50%)",
                      zIndex: 2
                    }}></div>
                    
                    {/* Wind direction indicators (arrows) */}
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: `${30 + (i * 20)}%`,
                        height: "2px",
                        transform: `translate(-50%, -50%) rotate(${windDirection}deg)`,
                        transformOrigin: "left center",
                        zIndex: 1
                      }}>
                        <div style={{
                          position: "absolute",
                          right: 0,
                          top: "-4px",
                          width: 0,
                          height: 0,
                          borderLeft: "8px solid #3498db",
                          borderTop: "4px solid transparent",
                          borderBottom: "4px solid transparent"
                        }}></div>
                        <div style={{
                          position: "absolute",
                          right: "20%",
                          top: "-4px",
                          width: 0,
                          height: 0,
                          borderLeft: "8px solid #3498db",
                          borderTop: "4px solid transparent",
                          borderBottom: "4px solid transparent"
                        }}></div>
                      </div>
                    ))}
                    
                    {/* Animated spread areas */}
                    {[1, 2, 3].map((ring) => (
                      <div 
                        key={ring}
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          width: "0",
                          height: "0",
                          borderRadius: "50%",
                          transform: "translate(-50%, -50%)",
                          backgroundColor: `rgba(255, ${100 - (ring * 30)}, 0, 0.3)`,
                          animation: `spread 3s infinite ${ring * 0.5}s ease-out`,
                          zIndex: 0
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Animation controls */}
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: isPlaying ? "#f44336" : "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        flex: 1
                      }}
                    >
                      {isPlaying ? "Pause" : "Play"} Simulation
                    </button>
                  </div>
                  
                  {/* Wind direction info */}
                  <p style={{ textAlign: "center", margin: "5px 0 0", fontSize: "0.9em" }}>
                    Wind direction: {windDirection}° ({getWindDirectionText(windDirection)})
                  </p>
                  
                  {/* CSS for animation */}
                  <style>{`
                    @keyframes spread {
                      0% { 
                        width: 0; 
                        height: 0;
                        opacity: 0.8;
                      }
                      100% { 
                        width: 100%; 
                        height: 100%;
                        opacity: 0;
                      }
                    }
                  `}</style>
                </div>
                
                {/* Nearby Wildfires Section (Existing) */}
                <h3>Nearby Wildfires</h3>
                {nearbyWildfires.length > 0 ? (
                  <div>
                    <p><strong>Count:</strong> {nearbyWildfires.length}</p>
                    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                      {nearbyWildfires.map((fire, i) => (
                        <div key={i} style={{ marginBottom: "10px", borderBottom: "1px solid #eee", paddingBottom: "5px" }}>
                          <p><strong>Distance:</strong> {Math.sqrt(
                            Math.pow(fire.latitude - searchResult.lat, 2) + 
                            Math.pow(fire.longitude - searchResult.lng, 2)
                          ).toFixed(2)}°</p>
                          <p><strong>FRP:</strong> {fire.frp} MW</p>
                          <p><strong>Status:</strong> 
                            <span style={{
                              color: fire.status === "High Danger" ? "red" : 
                                    fire.status === "Moderate Danger" ? "orange" : "green"
                            }}>
                              {" " + fire.status}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p>No active wildfires detected nearby</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default Livemap;