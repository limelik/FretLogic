package com.fretlogic.api.dto.dashboard;

import java.time.Instant;

public record NoteMasteryDto(
        String noteName,
        String label,
        boolean learned,
        Instant learnedAt
) {
}
