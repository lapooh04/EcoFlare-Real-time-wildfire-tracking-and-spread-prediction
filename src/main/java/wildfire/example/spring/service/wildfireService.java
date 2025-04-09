package wildfire.example.spring.service;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.HashMap;
import java.util.Map;

@Service
public class wildfireService {
    
    private final RestTemplate restTemplate;
    private final String FLASK_API_URL = "http://127.0.0.1:5000/predict"; // Flask API URL

    @Autowired
    public wildfireService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Map<String, Object> getWildfireRisk(double latitude, double longitude) {
        Map<String, Double> requestBody = new HashMap<>();
        requestBody.put("latitude", latitude);
        requestBody.put("longitude", longitude);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(FLASK_API_URL, requestBody, Map.class);

            // ✅ Check if response is valid
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody(); // Return fire_risk_percentage & risk_level
            } else {
                // ❌ Handle unexpected responses
                return Map.of("error", "Unexpected response from Python API", "status", response.getStatusCode().toString());
            }

        } catch (HttpClientErrorException e) {
            // ❌ Handle 4xx and 5xx HTTP errors
            return Map.of("error", "HTTP error from Python API", "details", e.getMessage());

        } catch (Exception e) {
            // ❌ Handle other errors (e.g., Python API is down)
            return Map.of("error", "Failed to connect to Python API", "details", e.getMessage());
        }
    }
}
