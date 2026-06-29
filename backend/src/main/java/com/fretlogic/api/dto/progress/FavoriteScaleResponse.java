package com.fretlogic.api.dto.progress;

import java.time.Instant;
import java.util.List;

public record FavoriteScaleResponse(
        Long id,
        String nickname,
        String rootNote,
        String scaleType,
        List<String> notes,
        List<String> intervals,
        String tuningId,
        Integer fretRange,
        String shapeId,
        Instant createdAt,
        Instant lastPracticedAt
) {
}
