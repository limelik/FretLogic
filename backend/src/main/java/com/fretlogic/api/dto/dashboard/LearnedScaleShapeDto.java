package com.fretlogic.api.dto.dashboard;

import java.time.Instant;

public record LearnedScaleShapeDto(
        String rootNote,
        String scaleType,
        String shapeId,
        Instant learnedAt
) {
}
