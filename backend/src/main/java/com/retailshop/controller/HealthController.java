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
public class HealthController {

    @GetMapping({"/api/health", "/health"})
    public Map<String, String> check() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "ok");
        status.put("timestamp", String.valueOf(System.currentTimeMillis()));
        status.put("service", "RetailShop Backend");
        return status;
    }

    @GetMapping({"/api/health/ping", "/ping"})
    public String ping() {
        return "pong";
    }
}
