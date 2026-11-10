package com.fretlogic.api.service.auth;

import com.fretlogic.api.dto.auth.AuthResponse;
import com.fretlogic.api.dto.auth.LoginRequest;
import com.fretlogic.api.dto.auth.RegisterRequest;
import com.fretlogic.api.dto.auth.UserSummary;
import com.fretlogic.api.entity.SavedProgress;
import com.fretlogic.api.entity.User;
import com.fretlogic.api.exception.BadRequestException;
import com.fretlogic.api.exception.ResourceNotFoundException;
import com.fretlogic.api.repository.SavedProgressRepository;
import com.fretlogic.api.repository.UserRepository;
import com.fretlogic.api.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final SavedProgressRepository savedProgressRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            SavedProgressRepository savedProgressRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.savedProgressRepository = savedProgressRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BadRequestException("Email already registered");
        }

        User user = userRepository.save(User.builder()
                .displayName(request.displayName())
                .email(request.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .avatarGradient("from-cyan-400 via-sky-500 to-violet-600")
                .profileHeadline("Dialing in clean note accuracy and scale fluency.")
                .build());

        savedProgressRepository.save(SavedProgress.builder()
                .user(user)
                .lastVisitedExercise("dashboard")
                .activeTuning("standard")
                .showNoteLabels(Boolean.TRUE)
                .selectedRootNote("E")
                .selectedScaleType("major")
                .savedSettingsJson("{\"bpm\":90,\"pacePreset\":\"MEDIUM\",\"fretCount\":15,\"preferSharps\":true}")
                .noteMachineStateJson("{\"bpm\":90,\"pacePreset\":\"MEDIUM\",\"fretCount\":15,\"targetNote\":\"C\",\"pathIndex\":0,\"selectedPromptNote\":\"ALL\",\"sequenceIndex\":0}")
                .scaleMachineStateJson("{\"rootNote\":\"E\",\"scaleType\":\"major\"}")
                .build());

        return new AuthResponse(jwtService.generateToken(user.getEmail()), toSummary(user));
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().toLowerCase();
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(normalizedEmail, request.password()));
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return new AuthResponse(jwtService.generateToken(user.getEmail()), toSummary(user));
    }

    public UserSummary currentUser(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toSummary(user);
    }

    private UserSummary toSummary(User user) {
        return new UserSummary(
                user.getId(),
                user.getDisplayName(),
                user.getEmail(),
                user.getProfileHeadline(),
                user.getAvatarGradient()
        );
    }
}
