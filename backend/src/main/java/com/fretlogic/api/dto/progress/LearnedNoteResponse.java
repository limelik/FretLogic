package com.fretlogic.api.dto.progress;

import java.time.Instant;

public record LearnedNoteResponse(
        Long id,
        String noteName,
        Instant learnedAt
) {
}
