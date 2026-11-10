package com.fretlogic.api.dto.dashboard;

public record MilestoneDto(
        String title,
        String detail,
        boolean unlocked
) {
}
