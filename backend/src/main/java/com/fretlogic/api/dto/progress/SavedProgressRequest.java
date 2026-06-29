package com.fretlogic.api.dto.progress;

public record SavedProgressRequest(
        String lastVisitedExercise,
        String noteMachineStateJson,
        String scaleMachineStateJson,
        String savedSettingsJson,
        String activeTuning,
        Boolean showNoteLabels,
        String selectedScaleType,
        String selectedRootNote
) {
}
