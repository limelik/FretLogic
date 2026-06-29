package com.fretlogic.api.dto.music;

import java.util.List;

public record TuningResponse(
        String id,
        String label,
        List<String> notes
) {
}
