package com.fretlogic.api.dto.progress;

import jakarta.validation.constraints.NotBlank;

public record LearnedNoteRequest(
        @NotBlank String noteName
) {
}
