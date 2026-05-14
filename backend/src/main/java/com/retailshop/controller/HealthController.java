package com.retailshop.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;
import java.util.HashMap;

/**
 * Health check controller for monitoring and production availability testing.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public Map<String, String> check() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("timestamp", String.valueOf(System.currentTimeMillis()));
        status.put("service", "RetailShop Backend");
        return status;
    }

    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }
}
