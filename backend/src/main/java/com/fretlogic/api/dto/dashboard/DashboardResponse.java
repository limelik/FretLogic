package com.fretlogic.api.dto.dashboard;

import java.util.List;

public record DashboardResponse(
        List<StatCardDto> stats,
        List<NoteMasteryDto> noteMastery,
        List<LearnedScaleShapeDto> learnedScaleShapes,
        List<LearningQueueItemDto> learningQueue,
        List<ActivityDto> recentWins,
        List<MilestoneDto> milestones,
        String lastVisitedExercise
) {
}
