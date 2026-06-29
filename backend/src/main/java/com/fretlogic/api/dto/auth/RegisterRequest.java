package com.fretlogic.api.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 2, max = 60) String displayName,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 120) String password
) {
}
