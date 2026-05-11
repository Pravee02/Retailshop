package com.retailshop.controller;

import com.retailshop.dto.DashboardResponse;
import com.retailshop.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Dashboard analytics controller (Admin only).
 */
@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "Analytics and reporting endpoints")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping
    @Operation(summary = "Get dashboard analytics data")
    public ResponseEntity<DashboardResponse> getDashboard() {
        return ResponseEntity.ok(dashboardService.getDashboardData());
    }
}
