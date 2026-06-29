package com.fretlogic.api.dto.progress;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record FavoriteScaleRequest(
        @NotBlank String rootNote,
        @NotBlank String scaleType,
        @NotBlank String tuningId,
        @Min(12) @Max(24) int fretCount,
        String nickname,
        boolean preferSharps,
        String shapeId
) {
}
