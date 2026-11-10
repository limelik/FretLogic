package com.fretlogic.api.service.progress;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fretlogic.api.dto.dashboard.ActivityDto;
import com.fretlogic.api.dto.dashboard.DashboardResponse;
import com.fretlogic.api.dto.dashboard.LearnedScaleShapeDto;
import com.fretlogic.api.dto.dashboard.LearningQueueItemDto;
import com.fretlogic.api.dto.dashboard.MilestoneDto;
import com.fretlogic.api.dto.dashboard.NoteMasteryDto;
import com.fretlogic.api.dto.dashboard.StatCardDto;
import com.fretlogic.api.dto.progress.ExerciseResultRequest;
import com.fretlogic.api.dto.progress.FavoriteScaleRequest;
import com.fretlogic.api.dto.progress.FavoriteScaleResponse;
import com.fretlogic.api.dto.progress.LearnedNoteRequest;
import com.fretlogic.api.dto.progress.LearnedNoteResponse;
import com.fretlogic.api.dto.progress.LearnedScaleShapeRequest;
import com.fretlogic.api.dto.progress.LearnedScaleShapeResponse;
import com.fretlogic.api.dto.progress.PracticeSessionRequest;
import com.fretlogic.api.dto.progress.SavedProgressRequest;
import com.fretlogic.api.dto.progress.SavedProgressResponse;
import com.fretlogic.api.entity.ExerciseResult;
import com.fretlogic.api.entity.FavoriteScale;
import com.fretlogic.api.entity.LearnedNote;
import com.fretlogic.api.entity.LearnedScaleShape;
import com.fretlogic.api.entity.PracticeSession;
import com.fretlogic.api.entity.SavedProgress;
import com.fretlogic.api.entity.ScaleEntity;
import com.fretlogic.api.entity.User;
import com.fretlogic.api.exception.ResourceNotFoundException;
import com.fretlogic.api.repository.ExerciseResultRepository;
import com.fretlogic.api.repository.FavoriteScaleRepository;
import com.fretlogic.api.repository.LearnedNoteRepository;
import com.fretlogic.api.repository.LearnedScaleShapeRepository;
import com.fretlogic.api.repository.PracticeSessionRepository;
import com.fretlogic.api.repository.SavedProgressRepository;
import com.fretlogic.api.repository.ScaleRepository;
import com.fretlogic.api.repository.UserRepository;
import com.fretlogic.api.service.music.MusicTheoryService;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final LearnedNoteRepository learnedNoteRepository;
    private final LearnedScaleShapeRepository learnedScaleShapeRepository;
    private final MusicTheoryService musicTheoryService;
    private final ObjectMapper objectMapper;

    private static final List<String> NOTE_ORDER = List.of("C", "D", "E", "F", "G", "A", "B", "C#", "D#", "F#", "G#", "A#");
    private static final List<String> ROOT_ORDER = List.of("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B");
    private static final List<String> SCALE_TYPE_ORDER = List.of("major", "minor", "pentatonic", "blues", "dorian", "mixolydian", "harmonic_minor");
    private static final List<String> SHAPE_ORDER = List.of("c-shape", "a-shape", "g-shape", "e-shape", "d-shape");

    public ProgressService(
            UserRepository userRepository,
            SavedProgressRepository savedProgressRepository,
            PracticeSessionRepository practiceSessionRepository,
            ExerciseResultRepository exerciseResultRepository,
            ScaleRepository scaleRepository,
            FavoriteScaleRepository favoriteScaleRepository,
            LearnedNoteRepository learnedNoteRepository,
            LearnedScaleShapeRepository learnedScaleShapeRepository,
            MusicTheoryService musicTheoryService,
            ObjectMapper objectMapper
    ) {
        this.userRepository = userRepository;
        this.savedProgressRepository = savedProgressRepository;
        this.practiceSessionRepository = practiceSessionRepository;
        this.exerciseResultRepository = exerciseResultRepository;
        this.scaleRepository = scaleRepository;
        this.favoriteScaleRepository = favoriteScaleRepository;
        this.learnedNoteRepository = learnedNoteRepository;
        this.learnedScaleShapeRepository = learnedScaleShapeRepository;
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
        progress.setNoteMachineStateJson(nullSafe(request.noteMachineStateJson(), progress.getNoteMachineStateJson(), "{\"bpm\":90}"));
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
        List<FavoriteScale> favorites = favoriteScaleRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<LearnedNote> learnedNotes = learnedNoteRepository.findByUserIdOrderByLearnedAtDesc(user.getId());
        List<LearnedScaleShape> learnedScaleShapes = learnedScaleShapeRepository.findByUserIdOrderByLearnedAtDesc(user.getId());
        Set<String> learnedNoteSet = learnedNotes.stream()
                .map(LearnedNote::getNoteName)
                .collect(java.util.stream.Collectors.toSet());
        Map<String, Set<String>> scaleShapeMap = buildScaleShapeMap(learnedScaleShapes);
        long completedScales = scaleShapeMap.values().stream()
                .filter(shapeIds -> shapeIds.containsAll(SHAPE_ORDER))
                .count();
        long unlockedMilestones = buildMilestones(learnedNoteSet, learnedScaleShapes).stream()
                .filter(MilestoneDto::unlocked)
                .count();

        List<StatCardDto> stats = List.of(
                new StatCardDto("Notes Learned", learnedNoteSet.size() + "/12", "Chromatic fretboard coverage"),
                new StatCardDto("Scale Shapes Learned", String.valueOf(learnedScaleShapes.size()), "Manual mastery checkoffs"),
                new StatCardDto("Scales Completed", String.valueOf(completedScales), "All 5 shapes learned in one scale"),
                new StatCardDto("Favorite Scales", String.valueOf(favorites.size()), "Saved scale snapshots")
        );

        return new DashboardResponse(
                stats,
                buildNoteMastery(learnedNotes),
                learnedScaleShapes.stream().map(this::toDashboardScaleShape).toList(),
                buildLearningQueue(learnedNoteSet, scaleShapeMap),
                buildRecentWins(learnedNotes, learnedScaleShapes),
                buildMilestones(learnedNoteSet, learnedScaleShapes),
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

    public List<LearnedNoteResponse> learnedNotes(String email) {
        return learnedNoteRepository.findByUserIdOrderByLearnedAtDesc(requireUser(email).getId()).stream()
                .map(this::toLearnedNoteResponse)
                .toList();
    }

    @Transactional
    public LearnedNoteResponse saveLearnedNote(String email, LearnedNoteRequest request) {
        User user = requireUser(email);
        String normalizedNote = musicTheoryService.normalizeNote(request.noteName());
        LearnedNote learnedNote = learnedNoteRepository.findByUserIdAndNoteName(user.getId(), normalizedNote)
                .orElseGet(() -> learnedNoteRepository.save(LearnedNote.builder()
                        .user(user)
                        .noteName(normalizedNote)
                        .build()));
        return toLearnedNoteResponse(learnedNote);
    }

    public List<LearnedScaleShapeResponse> learnedScaleShapes(String email) {
        return learnedScaleShapeRepository.findByUserIdOrderByLearnedAtDesc(requireUser(email).getId()).stream()
                .map(this::toLearnedScaleShapeResponse)
                .toList();
    }

    @Transactional
    public LearnedScaleShapeResponse saveLearnedScaleShape(String email, LearnedScaleShapeRequest request) {
        User user = requireUser(email);
        String normalizedRoot = musicTheoryService.normalizeNote(request.rootNote());
        String normalizedScaleType = request.scaleType().trim().toLowerCase();
        String normalizedShapeId = request.shapeId().trim().toLowerCase();

        LearnedScaleShape learnedScaleShape = learnedScaleShapeRepository
                .findByUserIdAndRootNoteAndScaleTypeAndShapeId(user.getId(), normalizedRoot, normalizedScaleType, normalizedShapeId)
                .orElseGet(() -> learnedScaleShapeRepository.save(LearnedScaleShape.builder()
                        .user(user)
                        .rootNote(normalizedRoot)
                        .scaleType(normalizedScaleType)
                        .shapeId(normalizedShapeId)
                        .build()));
        return toLearnedScaleShapeResponse(learnedScaleShape);
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

    private LearnedNoteResponse toLearnedNoteResponse(LearnedNote learnedNote) {
        return new LearnedNoteResponse(
                learnedNote.getId(),
                learnedNote.getNoteName(),
                learnedNote.getLearnedAt()
        );
    }

    private LearnedScaleShapeResponse toLearnedScaleShapeResponse(LearnedScaleShape learnedScaleShape) {
        return new LearnedScaleShapeResponse(
                learnedScaleShape.getId(),
                learnedScaleShape.getRootNote(),
                learnedScaleShape.getScaleType(),
                learnedScaleShape.getShapeId(),
                learnedScaleShape.getLearnedAt()
        );
    }

    private LearnedScaleShapeDto toDashboardScaleShape(LearnedScaleShape learnedScaleShape) {
        return new LearnedScaleShapeDto(
                learnedScaleShape.getRootNote(),
                learnedScaleShape.getScaleType(),
                learnedScaleShape.getShapeId(),
                learnedScaleShape.getLearnedAt()
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

    private List<NoteMasteryDto> buildNoteMastery(List<LearnedNote> learnedNotes) {
        Map<String, Instant> learnedAtByNote = new HashMap<>();
        learnedNotes.forEach(learnedNote -> learnedAtByNote.putIfAbsent(learnedNote.getNoteName(), learnedNote.getLearnedAt()));
        return NOTE_ORDER.stream()
                .map(note -> new NoteMasteryDto(
                        note,
                        noteLabel(note),
                        learnedAtByNote.containsKey(note),
                        learnedAtByNote.get(note)
                ))
                .toList();
    }

    private Map<String, Set<String>> buildScaleShapeMap(List<LearnedScaleShape> learnedScaleShapes) {
        Map<String, Set<String>> scaleShapeMap = new HashMap<>();
        learnedScaleShapes.forEach(learnedScaleShape -> scaleShapeMap
                .computeIfAbsent(scaleKey(learnedScaleShape.getRootNote(), learnedScaleShape.getScaleType()), unused -> new HashSet<>())
                .add(learnedScaleShape.getShapeId()));
        return scaleShapeMap;
    }

    private List<LearningQueueItemDto> buildLearningQueue(Set<String> learnedNoteSet, Map<String, Set<String>> scaleShapeMap) {
        List<LearningQueueItemDto> queue = new ArrayList<>();

        NOTE_ORDER.stream()
                .filter(note -> !learnedNoteSet.contains(note))
                .limit(3)
                .forEach(note -> queue.add(new LearningQueueItemDto(
                        "Learn note " + noteLabel(note),
                        "Mark it learned in Note Machine",
                        "/note-machine"
                )));

        outer:
        for (String rootNote : ROOT_ORDER) {
            for (String scaleType : SCALE_TYPE_ORDER) {
                Set<String> learnedShapes = scaleShapeMap.getOrDefault(scaleKey(rootNote, scaleType), Set.of());
                for (String shapeId : SHAPE_ORDER) {
                    if (!learnedShapes.contains(shapeId)) {
                        queue.add(new LearningQueueItemDto(
                                "Learn " + displayScale(rootNote, scaleType),
                                shapeLabel(shapeId) + " next",
                                "/scale-machine"
                        ));
                        if (queue.size() >= 6) {
                            break outer;
                        }
                        break;
                    }
                }
            }
        }

        return queue;
    }

    private List<ActivityDto> buildRecentWins(List<LearnedNote> learnedNotes, List<LearnedScaleShape> learnedScaleShapes) {
        List<ActivityDto> wins = new ArrayList<>();
        learnedNotes.forEach(learnedNote -> wins.add(new ActivityDto(
                "Learned note " + noteLabel(learnedNote.getNoteName()),
                "Marked as learned in Note Machine",
                learnedNote.getLearnedAt()
        )));
        learnedScaleShapes.forEach(learnedScaleShape -> wins.add(new ActivityDto(
                "Learned " + displayScale(learnedScaleShape.getRootNote(), learnedScaleShape.getScaleType()),
                shapeLabel(learnedScaleShape.getShapeId()),
                learnedScaleShape.getLearnedAt()
        )));
        return wins.stream()
                .sorted(Comparator.comparing(ActivityDto::timestamp).reversed())
                .limit(6)
                .toList();
    }

    private List<MilestoneDto> buildMilestones(Set<String> learnedNoteSet, List<LearnedScaleShape> learnedScaleShapes) {
        Map<String, Set<String>> scaleShapeMap = buildScaleShapeMap(learnedScaleShapes);
        boolean allNaturalNotes = List.of("C", "D", "E", "F", "G", "A", "B").stream().allMatch(learnedNoteSet::contains);
        boolean allChromaticNotes = NOTE_ORDER.stream().allMatch(learnedNoteSet::contains);
        boolean firstShapeLearned = !learnedScaleShapes.isEmpty();
        boolean firstScaleCompleted = scaleShapeMap.values().stream().anyMatch(shapeIds -> shapeIds.containsAll(SHAPE_ORDER));
        boolean fiveShapesLearned = learnedScaleShapes.size() >= 5;

        return List.of(
                new MilestoneDto("All natural notes", "Learn C D E F G A B", allNaturalNotes),
                new MilestoneDto("Chromatic complete", "Learn all 12 notes", allChromaticNotes),
                new MilestoneDto("First shape learned", "Mark one scale shape learned", firstShapeLearned),
                new MilestoneDto("Five shapes learned", "Reach 5 learned shapes total", fiveShapesLearned),
                new MilestoneDto("First full scale", "Learn all 5 shapes in one scale", firstScaleCompleted)
        );
    }

    private String noteLabel(String note) {
        return switch (note) {
            case "C#" -> "C#/Db";
            case "D#" -> "D#/Eb";
            case "F#" -> "F#/Gb";
            case "G#" -> "G#/Ab";
            case "A#" -> "A#/Bb";
            default -> note;
        };
    }

    private String shapeLabel(String shapeId) {
        return switch (shapeId) {
            case "c-shape" -> "C shape";
            case "a-shape" -> "A shape";
            case "g-shape" -> "G shape";
            case "e-shape" -> "E shape";
            case "d-shape" -> "D shape";
            default -> shapeId;
        };
    }

    private String displayScale(String rootNote, String scaleType) {
        return noteLabel(rootNote) + " " + scaleType.replace('_', ' ');
    }

    private String scaleKey(String rootNote, String scaleType) {
        return rootNote + ":" + scaleType;
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
