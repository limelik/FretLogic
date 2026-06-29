package com.fretlogic.api.dto.dashboard;

import java.util.List;

public record DashboardResponse(
        List<StatCardDto> stats,
        List<ActivityDto> recentActivity,
        List<ChartPointDto> accuracyTrend,
        List<ChartPointDto> practiceVolume,
        int streak,
        String lastVisitedExercise
) {
}
