package com.fretlogic.api.dto.music;

import com.fretlogic.api.entity.DifficultyLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record NoteExerciseRequest(
        @NotNull DifficultyLevel difficulty,
        @NotBlank String tuningId
) {
}
