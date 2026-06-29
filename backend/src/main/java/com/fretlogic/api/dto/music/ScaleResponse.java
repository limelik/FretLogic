package com.fretlogic.api.dto.music;

import java.util.List;

public record ScaleResponse(
        String rootNote,
        String scaleType,
        List<String> notes,
        List<String> intervals,
        String tuningId,
        int fretCount,
        List<FretPositionDto> highlightedPositions,
        List<List<FretPositionDto>> positionsByString
) {
}
