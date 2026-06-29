package com.fretlogic.api.dto.auth;

public record AuthResponse(
        String token,
        UserSummary user
) {
}
