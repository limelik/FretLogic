package com.fretlogic.api.dto.progress;

import java.time.Instant;

public record LearnedScaleShapeResponse(
        Long id,
        String rootNote,
        String scaleType,
        String shapeId,
        Instant learnedAt
) {
}
