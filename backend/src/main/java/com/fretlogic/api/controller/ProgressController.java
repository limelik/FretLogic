package com.fretlogic.api.controller;

import com.fretlogic.api.dto.dashboard.DashboardResponse;
import com.fretlogic.api.dto.progress.ExerciseResultRequest;
import com.fretlogic.api.dto.progress.FavoriteScaleRequest;
import com.fretlogic.api.dto.progress.FavoriteScaleResponse;
import com.fretlogic.api.dto.progress.PracticeSessionRequest;
import com.fretlogic.api.dto.progress.SavedProgressRequest;
import com.fretlogic.api.dto.progress.SavedProgressResponse;
import com.fretlogic.api.entity.ExerciseResult;
import com.fretlogic.api.entity.PracticeSession;
import com.fretlogic.api.service.progress.ProgressService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/progress")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping("/dashboard")
    public DashboardResponse dashboard(Authentication authentication) {
        return progressService.dashboard(authentication.getName());
    }

    @GetMapping("/state")
    public SavedProgressResponse state(Authentication authentication) {
        return progressService.getSavedProgress(authentication.getName());
    }

    @PutMapping("/state")
    public SavedProgressResponse saveState(Authentication authentication, @RequestBody SavedProgressRequest request) {
        return progressService.saveProgress(authentication.getName(), request);
    }

    @PostMapping("/sessions")
    public PracticeSession saveSession(Authentication authentication, @Valid @RequestBody PracticeSessionRequest request) {
        return progressService.recordSession(authentication.getName(), request);
    }

    @GetMapping("/sessions")
    public List<PracticeSession> sessions(Authentication authentication) {
        return progressService.sessions(authentication.getName());
    }

    @PostMapping("/exercise-results")
    public ExerciseResult saveResult(Authentication authentication, @Valid @RequestBody ExerciseResultRequest request) {
        return progressService.recordExerciseResult(authentication.getName(), request);
    }

    @GetMapping("/exercise-results")
    public List<ExerciseResult> results(Authentication authentication) {
        return progressService.exerciseResults(authentication.getName());
    }

    @GetMapping("/favorite-scales")
    public List<FavoriteScaleResponse> favoriteScales(Authentication authentication) {
        return progressService.favoriteScales(authentication.getName());
    }

    @PostMapping("/favorite-scales")
    public FavoriteScaleResponse saveFavoriteScale(
            Authentication authentication,
            @Valid @RequestBody FavoriteScaleRequest request
    ) {
        return progressService.saveFavoriteScale(authentication.getName(), request);
    }

    @DeleteMapping("/favorite-scales/{favoriteScaleId}")
    public void deleteFavoriteScale(Authentication authentication, @PathVariable Long favoriteScaleId) {
        progressService.deleteFavoriteScale(authentication.getName(), favoriteScaleId);
    }
}
