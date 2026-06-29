package com.fretlogic.api.dto.progress;

import com.fretlogic.api.entity.ExerciseType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ExerciseResultRequest(
        @NotNull ExerciseType exerciseType,
        @NotBlank String promptLabel,
        @NotBlank String expectedAnswer,
        @NotBlank String submittedAnswer,
        @NotNull Boolean correct,
        @Min(0) long responseTimeMs,
        int scoreDelta,
        String metadataJson
) {
}
