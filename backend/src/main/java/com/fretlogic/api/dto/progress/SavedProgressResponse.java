package com.fretlogic.api.dto.progress;

import java.time.Instant;

public record SavedProgressResponse(
        Long id,
        String lastVisitedExercise,
        String noteMachineStateJson,
        String scaleMachineStateJson,
        String savedSettingsJson,
        String activeTuning,
        Boolean showNoteLabels,
        String selectedScaleType,
        String selectedRootNote,
        Instant updatedAt
) {
}
