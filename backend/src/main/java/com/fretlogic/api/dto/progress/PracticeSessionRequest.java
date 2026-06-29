package com.fretlogic.api.dto.progress;

import com.fretlogic.api.entity.ExerciseType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record PracticeSessionRequest(
        @NotNull ExerciseType exerciseType,
        @NotNull Instant startedAt,
        @NotNull Instant endedAt,
        @Min(0) int score,
        @Min(0) int correctAnswers,
        @Min(1) int totalQuestions,
        String settingsSnapshotJson
) {
}
