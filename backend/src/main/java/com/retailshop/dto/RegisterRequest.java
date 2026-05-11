package com.retailshop.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/** Registration request payload */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RegisterRequest {
    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    private String fullName;
    private String email;
    private String phone;
    private String role; // ADMIN or CUSTOMER
}
