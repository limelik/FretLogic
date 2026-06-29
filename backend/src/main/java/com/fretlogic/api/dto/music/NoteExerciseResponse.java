package com.fretlogic.api.dto.music;

import java.util.List;

public record NoteExerciseResponse(
        String prompt,
        String targetNote,
        List<String> acceptedAnswers,
        int timeLimitSeconds,
        int targetStringIndex,
        int targetFret
) {
}
