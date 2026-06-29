package com.fretlogic.api.dto.music;

import java.util.List;

public record FretboardResponse(
        String tuningId,
        String tuningLabel,
        int fretCount,
        List<String> openNotes,
        List<FretPositionDto> positions
) {
}
