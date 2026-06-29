package com.fretlogic.api.service.progress;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fretlogic.api.dto.dashboard.ActivityDto;
import com.fretlogic.api.dto.dashboard.ChartPointDto;
import com.fretlogic.api.dto.dashboard.DashboardResponse;
import com.fretlogic.api.dto.dashboard.StatCardDto;
import com.fretlogic.api.dto.progress.ExerciseResultRequest;
import com.fretlogic.api.dto.progress.FavoriteScaleRequest;
import com.fretlogic.api.dto.progress.FavoriteScaleResponse;
import com.fretlogic.api.dto.progress.PracticeSessionRequest;
import com.fretlogic.api.dto.progress.SavedProgressRequest;
import com.fretlogic.api.dto.progress.SavedProgressResponse;
import com.fretlogic.api.entity.ExerciseResult;
import com.fretlogic.api.entity.FavoriteScale;
import com.fretlogic.api.entity.PracticeSession;
import com.fretlogic.api.entity.SavedProgress;
import com.fretlogic.api.entity.ScaleEntity;
import com.fretlogic.api.entity.User;
import com.fretlogic.api.exception.ResourceNotFoundException;
import com.fretlogic.api.repository.ExerciseResultRepository;
import com.fretlogic.api.repository.FavoriteScaleRepository;
import com.fretlogic.api.repository.PracticeSessionRepository;
import com.fretlogic.api.repository.SavedProgressRepository;
import com.fretlogic.api.repository.ScaleRepository;
import com.fretlogic.api.repository.UserRepository;
import com.fretlogic.api.service.music.MusicTheoryService;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProgressService {

    private final UserRepository userRepository;
    private final SavedProgressRepository savedProgressRepository;
    private final PracticeSessionRepository practiceSessionRepository;
    private final ExerciseResultRepository exerciseResultRepository;
    private final ScaleRepository scaleRepository;
    private final FavoriteScaleRepository favoriteScaleRepository;
    private final MusicTheoryService musicTheoryService;
    private final ObjectMapper objectMapper;

    public ProgressService(
            UserRepository userRepository,
            SavedProgressRepository savedProgressRepository,
            PracticeSessionRepository practiceSessionRepository,
            ExerciseResultRepository exerciseResultRepository,
            ScaleRepository scaleRepository,
            FavoriteScaleRepository favoriteScaleRepository,
            MusicTheoryService musicTheoryService,
            ObjectMapper objectMapper
    ) {
        this.userRepository = userRepository;
        this.savedProgressRepository = savedProgressRepository;
        this.practiceSessionRepository = practiceSessionRepository;
        this.exerciseResultRepository = exerciseResultRepository;
        this.scaleRepository = scaleRepository;
        this.favoriteScaleRepository = favoriteScaleRepository;
        this.musicTheoryService = musicTheoryService;
        this.objectMapper = objectMapper;
    }

    public SavedProgressResponse getSavedProgress(String email) {
        User user = requireUser(email);
        SavedProgress progress = savedProgressRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Saved progress not found"));
        return toResponse(progress);
    }

    @Transactional
    public SavedProgressResponse saveProgress(String email, SavedProgressRequest request) {
        User user = requireUser(email);
        SavedProgress progress = savedProgressRepository.findByUserId(user.getId())
                .orElseGet(() -> SavedProgress.builder()
                        .user(user)
                        .lastVisitedExercise("dashboard")
                        .activeTuning("standard")
                        .showNoteLabels(Boolean.TRUE)
                        .build());

        progress.setLastVisitedExercise(nullSafe(request.lastVisitedExercise(), progress.getLastVisitedExercise(), "dashboard"));
        progress.setNoteMachineStateJson(nullSafe(request.noteMachineStateJson(), progress.getNoteMachineStateJson(), "{\"score\":0}"));
        progress.setScaleMachineStateJson(nullSafe(request.scaleMachineStateJson(), progress.getScaleMachineStateJson(), "{\"rootNote\":\"E\"}"));
        progress.setSavedSettingsJson(nullSafe(request.savedSettingsJson(), progress.getSavedSettingsJson(), "{}"));
        progress.setActiveTuning(nullSafe(request.activeTuning(), progress.getActiveTuning(), "standard"));
        progress.setShowNoteLabels(request.showNoteLabels() != null ? request.showNoteLabels() : Boolean.TRUE);
        progress.setSelectedScaleType(nullSafe(request.selectedScaleType(), progress.getSelectedScaleType(), "major"));
        progress.setSelectedRootNote(nullSafe(request.selectedRootNote(), progress.getSelectedRootNote(), "E"));

        return toResponse(savedProgressRepository.save(progress));
    }

    @Transactional
    public PracticeSession recordSession(String email, PracticeSessionRequest request) {
        User user = requireUser(email);
        double accuracy = request.totalQuestions() == 0
                ? 0.0
                : (double) request.correctAnswers() / request.totalQuestions();

        return practiceSessionRepository.save(PracticeSession.builder()
                .user(user)
                .exerciseType(request.exerciseType())
                .startedAt(request.startedAt())
                .endedAt(request.endedAt())
                .score(request.score())
                .correctAnswers(request.correctAnswers())
                .totalQuestions(request.totalQuestions())
                .accuracy(accuracy)
                .settingsSnapshotJson(request.settingsSnapshotJson())
                .build());
    }

    @Transactional
    public ExerciseResult recordExerciseResult(String email, ExerciseResultRequest request) {
        User user = requireUser(email);
        return exerciseResultRepository.save(ExerciseResult.builder()
                .user(user)
                .exerciseType(request.exerciseType())
                .promptLabel(request.promptLabel())
                .expectedAnswer(request.expectedAnswer())
                .submittedAnswer(request.submittedAnswer())
                .correct(request.correct())
                .responseTimeMs(request.responseTimeMs())
                .scoreDelta(request.scoreDelta())
                .metadataJson(request.metadataJson())
                .build());
    }

    public DashboardResponse dashboard(String email) {
        User user = requireUser(email);
        SavedProgress progress = savedProgressRepository.findByUserId(user.getId())
                .orElse(null);
        List<PracticeSession> sessions = practiceSessionRepository.findTop10ByUserIdOrderByEndedAtDesc(user.getId());
        List<ExerciseResult> results = exerciseResultRepository.findTop20ByUserIdOrderByCreatedAtDesc(user.getId());
        List<FavoriteScale> favorites = favoriteScaleRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        int completedExercises = results.size();
        double averageAccuracy = sessions.stream().mapToDouble(PracticeSession::getAccuracy).average().orElse(0.0);
        int streak = calculateStreak(sessions);
        int totalScore = sessions.stream().mapToInt(PracticeSession::getScore).sum();

        List<StatCardDto> stats = List.of(
                new StatCardDto("Completed Exercises", String.valueOf(completedExercises), "Tracked from note and scale drills"),
                new StatCardDto("Accuracy", Math.round(averageAccuracy * 100) + "%", "Average over recent sessions"),
                new StatCardDto("Streak", streak + " days", "Practice consistency window"),
                new StatCardDto("Favorite Scales", String.valueOf(favorites.size()), "Saved voicings and patterns")
        );

        List<ActivityDto> recentActivity = new ArrayList<>();
        sessions.stream().limit(5).forEach(session -> recentActivity.add(new ActivityDto(
                session.getExerciseType().name().replace('_', ' '),
                session.getCorrectAnswers() + "/" + session.getTotalQuestions() + " correct • +" + session.getScore() + " pts",
                session.getEndedAt()
        )));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/dd");
        List<ChartPointDto> accuracyTrend = sessions.stream()
                .limit(7)
                .map(session -> new ChartPointDto(
                        formatter.format(session.getEndedAt().atZone(ZoneOffset.UTC)),
                        Math.round(session.getAccuracy() * 100)
                ))
                .toList();

        List<ChartPointDto> practiceVolume = sessions.stream()
                .limit(7)
                .map(session -> new ChartPointDto(
                        formatter.format(session.getEndedAt().atZone(ZoneOffset.UTC)),
                        session.getTotalQuestions()
                ))
                .toList();

        recentActivity.add(new ActivityDto(
                "Lifetime Score",
                totalScore + " pts banked across practice history",
                Instant.now()
        ));

        return new DashboardResponse(
                stats,
                recentActivity,
                accuracyTrend,
                practiceVolume,
                streak,
                progress != null ? progress.getLastVisitedExercise() : "dashboard"
        );
    }

    public List<PracticeSession> sessions(String email) {
        return practiceSessionRepository.findByUserIdOrderByEndedAtDesc(requireUser(email).getId());
    }

    public List<ExerciseResult> exerciseResults(String email) {
        return exerciseResultRepository.findByUserIdOrderByCreatedAtDesc(requireUser(email).getId());
    }

    public List<FavoriteScaleResponse> favoriteScales(String email) {
        return favoriteScaleRepository.findByUserIdOrderByCreatedAtDesc(requireUser(email).getId()).stream()
                .map(this::toFavoriteResponse)
                .toList();
    }

    @Transactional
    public FavoriteScaleResponse saveFavoriteScale(String email, FavoriteScaleRequest request) {
        User user = requireUser(email);
        List<String> notes = musicTheoryService.buildScaleNotes(request.rootNote(), request.scaleType(), request.preferSharps());
        List<String> intervals = intervalsFor(request.scaleType());
        ScaleEntity scale = scaleRepository.save(ScaleEntity.builder()
                .user(user)
                .rootNote(musicTheoryService.normalizeNote(request.rootNote()))
                .scaleType(request.scaleType().trim().toLowerCase())
                .noteNamesJson(writeJson(notes))
                .intervalsJson(writeJson(intervals))
                .tuningName(request.tuningId())
                .fretRange(request.fretCount())
                .build());

        FavoriteScale favorite = favoriteScaleRepository.save(FavoriteScale.builder()
                .user(user)
                .scale(scale)
                .nickname(request.nickname() == null || request.nickname().isBlank()
                        ? scale.getRootNote() + " " + scale.getScaleType()
                        : request.nickname())
                .shapeId(request.shapeId())
                .lastPracticedAt(Instant.now())
                .build());

        return toFavoriteResponse(favorite);
    }

    @Transactional
    public void deleteFavoriteScale(String email, Long favoriteScaleId) {
        User user = requireUser(email);
        FavoriteScale favoriteScale = favoriteScaleRepository.findById(favoriteScaleId)
                .orElseThrow(() -> new ResourceNotFoundException("Favorite scale not found"));
        if (!favoriteScale.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Favorite scale not found");
        }
        favoriteScaleRepository.delete(favoriteScale);
    }

    private FavoriteScaleResponse toFavoriteResponse(FavoriteScale favoriteScale) {
        return new FavoriteScaleResponse(
                favoriteScale.getId(),
                favoriteScale.getNickname(),
                favoriteScale.getScale().getRootNote(),
                favoriteScale.getScale().getScaleType(),
                readJsonList(favoriteScale.getScale().getNoteNamesJson()),
                readJsonList(favoriteScale.getScale().getIntervalsJson()),
                favoriteScale.getScale().getTuningName(),
                favoriteScale.getScale().getFretRange(),
                favoriteScale.getShapeId(),
                favoriteScale.getCreatedAt(),
                favoriteScale.getLastPracticedAt()
        );
    }

    private SavedProgressResponse toResponse(SavedProgress progress) {
        return new SavedProgressResponse(
                progress.getId(),
                progress.getLastVisitedExercise(),
                progress.getNoteMachineStateJson(),
                progress.getScaleMachineStateJson(),
                progress.getSavedSettingsJson(),
                progress.getActiveTuning(),
                progress.getShowNoteLabels(),
                progress.getSelectedScaleType(),
                progress.getSelectedRootNote(),
                progress.getUpdatedAt()
        );
    }

    private User requireUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private int calculateStreak(List<PracticeSession> sessions) {
        if (sessions.isEmpty()) {
            return 0;
        }

        List<LocalDate> uniqueDays = sessions.stream()
                .map(session -> session.getEndedAt().atZone(ZoneOffset.UTC).toLocalDate())
                .distinct()
                .sorted((left, right) -> right.compareTo(left))
                .toList();

        int streak = 0;
        LocalDate cursor = uniqueDays.getFirst();
        for (LocalDate day : uniqueDays) {
            if (!day.equals(cursor.minusDays(streak)) && !day.equals(cursor)) {
                break;
            }
            streak++;
        }
        return streak;
    }

    private List<String> intervalsFor(String scaleType) {
        return switch (scaleType.trim().toLowerCase()) {
            case "major" -> List.of("1", "2", "3", "4", "5", "6", "7");
            case "minor" -> List.of("1", "2", "b3", "4", "5", "b6", "b7");
            case "pentatonic" -> List.of("1", "b3", "4", "5", "b7");
            case "blues" -> List.of("1", "b3", "4", "b5", "5", "b7");
            case "dorian" -> List.of("1", "2", "b3", "4", "5", "6", "b7");
            case "mixolydian" -> List.of("1", "2", "3", "4", "5", "6", "b7");
            case "harmonic_minor" -> List.of("1", "2", "b3", "4", "5", "b6", "7");
            default -> List.of("1", "2", "3", "4", "5", "6", "7");
        };
    }

    private String nullSafe(String incoming, String currentValue, String fallback) {
        if (incoming != null) {
            return incoming;
        }
        if (currentValue != null) {
            return currentValue;
        }
        return fallback;
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private List<String> readJsonList(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {
            });
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
