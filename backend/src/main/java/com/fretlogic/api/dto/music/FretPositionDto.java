package com.fretlogic.api.dto.music;

public record FretPositionDto(
        int stringIndex,
        int fret,
        String note,
        boolean inScale,
        boolean root
) {
}
