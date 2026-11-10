package com.fretlogic.api.dto.progress;

import jakarta.validation.constraints.NotBlank;

public record LearnedScaleShapeRequest(
        @NotBlank String rootNote,
        @NotBlank String scaleType,
        @NotBlank String shapeId
) {
}
