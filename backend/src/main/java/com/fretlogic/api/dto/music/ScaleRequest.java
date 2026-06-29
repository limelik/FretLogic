package com.fretlogic.api.dto.music;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record ScaleRequest(
        @NotBlank String rootNote,
        @NotBlank String scaleType,
        @NotBlank String tuningId,
        @Min(12) @Max(24) int fretCount,
        boolean preferSharps
) {
}
