package com.fretlogic.api.dto.auth;

public record UserSummary(
        Long id,
        String displayName,
        String email,
        String profileHeadline,
        String avatarGradient
) {
}
