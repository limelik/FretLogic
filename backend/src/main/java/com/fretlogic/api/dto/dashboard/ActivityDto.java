package com.fretlogic.api.dto.dashboard;

import java.time.Instant;

public record ActivityDto(
        String title,
        String detail,
        Instant timestamp
) {
}
