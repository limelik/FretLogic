package com.fretlogic.api.service.music;

import com.fretlogic.api.dto.music.FretPositionDto;
import com.fretlogic.api.dto.music.FretboardRequest;
import com.fretlogic.api.dto.music.FretboardResponse;
import com.fretlogic.api.dto.music.NoteExerciseRequest;
import com.fretlogic.api.dto.music.NoteExerciseResponse;
import com.fretlogic.api.dto.music.ScaleRequest;
import com.fretlogic.api.dto.music.ScaleResponse;
import com.fretlogic.api.dto.music.TuningResponse;
import com.fretlogic.api.entity.DifficultyLevel;
import com.fretlogic.api.exception.BadRequestException;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class MusicTheoryService {

    private static final List<String> CHROMATIC_SHARPS = List.of("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B");
    private static final List<String> CHROMATIC_FLATS = List.of("C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B");
    private static final Map<String, List<String>> TUNINGS = Map.of(
            "standard", List.of("E", "A", "D", "G", "B", "E"),
            "drop_d", List.of("D", "A", "D", "G", "B", "E"),
            "open_g", List.of("D", "G", "D", "G", "B", "D"),
            "d_standard", List.of("D", "G", "C", "F", "A", "D")
    );
    private static final Map<String, String> TUNING_LABELS = Map.of(
            "standard", "Standard EADGBE",
            "drop_d", "Drop D DADGBE",
            "open_g", "Open G DGDGBD",
            "d_standard", "D Standard DGCFAD"
    );
    private static final Map<String, List<Integer>> SCALE_FORMULAS = new LinkedHashMap<>();
    private static final Map<String, List<String>> SCALE_INTERVAL_LABELS = new LinkedHashMap<>();
    private static final SecureRandom RANDOM = new SecureRandom();

    static {
        SCALE_FORMULAS.put("major", List.of(0, 2, 4, 5, 7, 9, 11));
        SCALE_FORMULAS.put("minor", List.of(0, 2, 3, 5, 7, 8, 10));
        SCALE_FORMULAS.put("pentatonic", List.of(0, 3, 5, 7, 10));
        SCALE_FORMULAS.put("blues", List.of(0, 3, 5, 6, 7, 10));
        SCALE_FORMULAS.put("dorian", List.of(0, 2, 3, 5, 7, 9, 10));
        SCALE_FORMULAS.put("mixolydian", List.of(0, 2, 4, 5, 7, 9, 10));
        SCALE_FORMULAS.put("harmonic_minor", List.of(0, 2, 3, 5, 7, 8, 11));

        SCALE_INTERVAL_LABELS.put("major", List.of("1", "2", "3", "4", "5", "6", "7"));
        SCALE_INTERVAL_LABELS.put("minor", List.of("1", "2", "b3", "4", "5", "b6", "b7"));
        SCALE_INTERVAL_LABELS.put("pentatonic", List.of("1", "b3", "4", "5", "b7"));
        SCALE_INTERVAL_LABELS.put("blues", List.of("1", "b3", "4", "b5", "5", "b7"));
        SCALE_INTERVAL_LABELS.put("dorian", List.of("1", "2", "b3", "4", "5", "6", "b7"));
        SCALE_INTERVAL_LABELS.put("mixolydian", List.of("1", "2", "3", "4", "5", "6", "b7"));
        SCALE_INTERVAL_LABELS.put("harmonic_minor", List.of("1", "2", "b3", "4", "5", "b6", "7"));
    }

    public List<TuningResponse> listTunings() {
        return TUNINGS.entrySet().stream()
                .map(entry -> new TuningResponse(entry.getKey(), TUNING_LABELS.get(entry.getKey()), entry.getValue()))
                .toList();
    }

    public FretboardResponse buildFretboard(FretboardRequest request) {
        List<String> tuning = resolveTuning(request.tuningId());
        List<FretPositionDto> positions = new ArrayList<>();

        for (int stringIndex = 0; stringIndex < tuning.size(); stringIndex++) {
            for (int fret = 0; fret <= request.fretCount(); fret++) {
                positions.add(new FretPositionDto(
                        stringIndex,
                        fret,
                        transpose(tuning.get(stringIndex), fret, request.preferSharps()),
                        false,
                        false
                ));
            }
        }

        return new FretboardResponse(
                request.tuningId(),
                TUNING_LABELS.get(request.tuningId()),
                request.fretCount(),
                tuning,
                positions
        );
    }

    public ScaleResponse buildScale(ScaleRequest request) {
        String root = normalizeNote(request.rootNote());
        String scaleType = normalizeScaleType(request.scaleType());
        List<String> notes = buildScaleNotes(root, scaleType, request.preferSharps());
        Set<String> scaleNotes = Set.copyOf(notes);
        List<String> tuning = resolveTuning(request.tuningId());
        List<FretPositionDto> flatPositions = new ArrayList<>();
        List<List<FretPositionDto>> byString = new ArrayList<>();

        for (int stringIndex = 0; stringIndex < tuning.size(); stringIndex++) {
            List<FretPositionDto> stringPositions = new ArrayList<>();
            for (int fret = 0; fret <= request.fretCount(); fret++) {
                String note = transpose(tuning.get(stringIndex), fret, request.preferSharps());
                boolean inScale = scaleNotes.contains(note) || scaleNotes.contains(enharmonic(note));
                boolean rootMatch = root.equals(normalizeNote(note));
                FretPositionDto position = new FretPositionDto(stringIndex, fret, note, inScale, rootMatch);
                if (inScale) {
                    flatPositions.add(position);
                    stringPositions.add(position);
                }
            }
            byString.add(stringPositions);
        }

        return new ScaleResponse(
                displayNote(root, request.preferSharps()),
                scaleType,
                notes,
                SCALE_INTERVAL_LABELS.get(scaleType),
                request.tuningId(),
                request.fretCount(),
                flatPositions,
                byString
        );
    }

    public NoteExerciseResponse randomNoteExercise(NoteExerciseRequest request) {
        resolveTuning(request.tuningId());
        List<String> notePool = switch (request.difficulty()) {
            case EASY -> List.of("E", "A", "D", "G", "B", "C");
            case MEDIUM -> List.of("C", "D", "E", "F", "G", "A", "B");
            case HARD -> CHROMATIC_SHARPS;
            case EXPERT -> CHROMATIC_SHARPS;
        };

        int targetString = RANDOM.nextInt(6);
        int maxFret = difficultyMaxFret(request.difficulty());
        int fret = RANDOM.nextInt(maxFret + 1);
        String note = transpose(resolveTuning(request.tuningId()).get(targetString), fret, true);
        while (!notePool.contains(normalizeNote(note))) {
            targetString = RANDOM.nextInt(6);
            fret = RANDOM.nextInt(maxFret + 1);
            note = transpose(resolveTuning(request.tuningId()).get(targetString), fret, true);
        }

        String normalized = normalizeNote(note);
        return new NoteExerciseResponse(
                "Find " + normalized + " on string " + (6 - targetString),
                normalized,
                List.of(normalized, enharmonic(normalized)),
                request.difficulty() == DifficultyLevel.EXPERT ? 8 : request.difficulty() == DifficultyLevel.HARD ? 12 : 20,
                targetString,
                fret
        );
    }

    public List<String> buildScaleNotes(String rootNote, String scaleType, boolean preferSharps) {
        String root = normalizeNote(rootNote);
        List<Integer> formula = SCALE_FORMULAS.get(normalizeScaleType(scaleType));
        List<String> chromatic = preferSharps ? CHROMATIC_SHARPS : CHROMATIC_FLATS;
        int startIndex = CHROMATIC_SHARPS.indexOf(root);
        if (startIndex < 0) {
            throw new BadRequestException("Unsupported root note: " + rootNote);
        }

        List<String> notes = new ArrayList<>();
        for (Integer interval : formula) {
            notes.add(chromatic.get((startIndex + interval) % 12));
        }
        return notes;
    }

    public String normalizeNote(String note) {
        String trimmed = note.trim().replace("♯", "#").replace("♭", "b");
        Map<String, String> aliases = Map.ofEntries(
                Map.entry("DB", "C#"),
                Map.entry("EB", "D#"),
                Map.entry("GB", "F#"),
                Map.entry("AB", "G#"),
                Map.entry("BB", "A#"),
                Map.entry("CB", "B"),
                Map.entry("FB", "E"),
                Map.entry("E#", "F"),
                Map.entry("B#", "C")
        );
        String upper = trimmed.toUpperCase(Locale.ROOT);
        if (aliases.containsKey(upper)) {
            return aliases.get(upper);
        }
        if (upper.length() == 1) {
            return upper;
        }
        return upper.charAt(0) + upper.substring(1).replace("B", "b").replace("#", "#");
    }

    public String enharmonic(String note) {
        String normalized = normalizeNote(note);
        int sharpIndex = CHROMATIC_SHARPS.indexOf(normalized);
        if (sharpIndex >= 0) {
            return CHROMATIC_FLATS.get(sharpIndex);
        }
        int flatIndex = CHROMATIC_FLATS.indexOf(normalized);
        if (flatIndex >= 0) {
            return CHROMATIC_SHARPS.get(flatIndex);
        }
        return normalized;
    }

    private List<String> resolveTuning(String tuningId) {
        List<String> tuning = TUNINGS.get(tuningId);
        if (tuning == null) {
            throw new BadRequestException("Unknown tuning: " + tuningId);
        }
        return tuning;
    }

    private String transpose(String note, int semitones, boolean preferSharps) {
        String normalized = normalizeNote(note);
        int startIndex = CHROMATIC_SHARPS.indexOf(normalized);
        List<String> chromatic = preferSharps ? CHROMATIC_SHARPS : CHROMATIC_FLATS;
        return chromatic.get((startIndex + semitones) % 12);
    }

    private String displayNote(String note, boolean preferSharps) {
        String normalized = normalizeNote(note);
        int startIndex = CHROMATIC_SHARPS.indexOf(normalized);
        List<String> chromatic = preferSharps ? CHROMATIC_SHARPS : CHROMATIC_FLATS;
        return chromatic.get(startIndex);
    }

    private String normalizeScaleType(String scaleType) {
        String key = scaleType.trim().toLowerCase(Locale.ROOT).replace(' ', '_');
        if (!SCALE_FORMULAS.containsKey(key)) {
            throw new BadRequestException("Unsupported scale type: " + scaleType);
        }
        return key;
    }

    private int difficultyMaxFret(DifficultyLevel difficulty) {
        return switch (difficulty) {
            case EASY -> 5;
            case MEDIUM -> 9;
            case HARD -> 12;
            case EXPERT -> 15;
        };
    }
}
