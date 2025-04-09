package wildfire.example.spring.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", allowCredentials = "true")
public class WildfireController {

    private final RestTemplate restTemplate;
    private static final String FLASK_API_URL = "http://127.0.0.1:5000/api/wildfire-predict";  // Flask API URL

    @Autowired
    public WildfireController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

   
    @PostMapping("/wildfire-predict")
    public ResponseEntity<Map<String, Object>> getPrediction(@RequestBody Map<String, Object> requestData) {
        try {
            // Validate input
            if (!requestData.containsKey("latitude") || !requestData.containsKey("longitude")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Latitude and Longitude are required."));
            }

            // Extract latitude and longitude
            double latitude = ((Number) requestData.get("latitude")).doubleValue();
            double longitude = ((Number) requestData.get("longitude")).doubleValue();

            // Create request payload
            Map<String, Double> flaskRequest = new HashMap<>();
            flaskRequest.put("latitude", latitude);
            flaskRequest.put("longitude", longitude);

            // Set HTTP headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Create request entity
            HttpEntity<Map<String, Double>> requestEntity = new HttpEntity<>(flaskRequest, headers);

            // Send request to Flask
            ResponseEntity<Map> response = restTemplate.exchange(FLASK_API_URL, HttpMethod.POST, requestEntity, Map.class);

            //  Debugging: Log response
            System.out.println("Flask API Response: " + response.getBody());

            if (response.getBody() == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Empty response from Python API"));
            }

            return ResponseEntity.ok(response.getBody());

        } catch (Exception e) {
            // Log error
            e.printStackTrace();

            // Return an error response
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch prediction from Flask API", "details", e.getMessage()));
        }
    }
}
