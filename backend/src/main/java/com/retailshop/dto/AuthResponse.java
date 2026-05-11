package com.retailshop.dto;

import lombok.*;

/** JWT authentication response */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private String username;
    private String fullName;
    private String role;
}
