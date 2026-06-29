package com.fretlogic.api.controller;

import com.fretlogic.api.dto.auth.AuthResponse;
import com.fretlogic.api.dto.auth.LoginRequest;
import com.fretlogic.api.dto.auth.RegisterRequest;
import com.fretlogic.api.dto.auth.UserSummary;
import com.fretlogic.api.service.auth.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserSummary me(Authentication authentication) {
        return authService.currentUser(authentication.getName());
    }
}
