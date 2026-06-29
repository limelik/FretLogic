package com.fretlogic.api.controller;

import com.fretlogic.api.dto.music.FretboardRequest;
import com.fretlogic.api.dto.music.FretboardResponse;
import com.fretlogic.api.dto.music.NoteExerciseRequest;
import com.fretlogic.api.dto.music.NoteExerciseResponse;
import com.fretlogic.api.dto.music.ScaleRequest;
import com.fretlogic.api.dto.music.ScaleResponse;
import com.fretlogic.api.dto.music.TuningResponse;
import com.fretlogic.api.service.music.MusicTheoryService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/music")
public class MusicTheoryController {

    private final MusicTheoryService musicTheoryService;

    public MusicTheoryController(MusicTheoryService musicTheoryService) {
        this.musicTheoryService = musicTheoryService;
    }

    @GetMapping("/tunings")
    public List<TuningResponse> tunings() {
        return musicTheoryService.listTunings();
    }

    @PostMapping("/fretboard")
    public FretboardResponse fretboard(@Valid @RequestBody FretboardRequest request) {
        return musicTheoryService.buildFretboard(request);
    }

    @PostMapping("/scales")
    public ScaleResponse scale(@Valid @RequestBody ScaleRequest request) {
        return musicTheoryService.buildScale(request);
    }

    @PostMapping("/note-exercise")
    public NoteExerciseResponse noteExercise(@Valid @RequestBody NoteExerciseRequest request) {
        return musicTheoryService.randomNoteExercise(request);
    }
}
