package com.fretlogic.api.config;

import com.fretlogic.api.entity.ExerciseResult;
import com.fretlogic.api.entity.ExerciseType;
import com.fretlogic.api.entity.FavoriteScale;
import com.fretlogic.api.entity.PracticeSession;
import com.fretlogic.api.entity.SavedProgress;
import com.fretlogic.api.entity.ScaleEntity;
import com.fretlogic.api.entity.User;
import com.fretlogic.api.repository.ExerciseResultRepository;
import com.fretlogic.api.repository.FavoriteScaleRepository;
import com.fretlogic.api.repository.PracticeSessionRepository;
import com.fretlogic.api.repository.SavedProgressRepository;
import com.fretlogic.api.repository.ScaleRepository;
import com.fretlogic.api.repository.UserRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SeedDataConfig {

    @Bean
    CommandLineRunner seedData(
            UserRepository userRepository,
            SavedProgressRepository savedProgressRepository,
            PracticeSessionRepository practiceSessionRepository,
            ExerciseResultRepository exerciseResultRepository,
            ScaleRepository scaleRepository,
            FavoriteScaleRepository favoriteScaleRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            Optional<User> existingDemo = userRepository.findByEmailIgnoreCase("demo@fretlogic.app");
            boolean freshDemo = existingDemo.isEmpty();

            User demoEntity = existingDemo.orElseGet(User::new);
                demoEntity.setDisplayName("Demo Player");
                demoEntity.setEmail("demo@fretlogic.app");
                demoEntity.setPasswordHash(passwordEncoder.encode("DemoPass123"));
                demoEntity.setProfileHeadline("Locked on precision, position shifts, and mode fluency.");
                demoEntity.setAvatarGradient("from-amber-300 via-orange-500 to-pink-500");

                User demo = userRepository.save(demoEntity);

            SavedProgress progress = savedProgressRepository.findByUserId(demo.getId())
                    .orElseGet(() -> SavedProgress.builder().user(demo).build());
            progress.setLastVisitedExercise("note-machine");
            progress.setActiveTuning("standard");
            progress.setShowNoteLabels(Boolean.FALSE);
            progress.setSelectedRootNote("A");
            progress.setSelectedScaleType("dorian");
            progress.setSavedSettingsJson("{\"bpm\":84,\"pacePreset\":\"HARD\",\"fretCount\":15,\"autoAdvance\":true,\"preferSharps\":true}");
            progress.setNoteMachineStateJson("{\"score\":280,\"streak\":9,\"attempts\":20,\"correct\":18,\"bpm\":84,\"pacePreset\":\"HARD\",\"fretCount\":15,\"autoAdvance\":true}");
            progress.setScaleMachineStateJson("{\"rootNote\":\"A\",\"scaleType\":\"dorian\",\"showLabels\":true,\"fretCount\":15}");
            savedProgressRepository.save(progress);

            if (!freshDemo) {
                return;
            }

            PracticeSession noteSession = practiceSessionRepository.save(PracticeSession.builder()
                    .user(demo)
                    .exerciseType(ExerciseType.NOTE_MACHINE)
                    .startedAt(Instant.now().minus(2, ChronoUnit.HOURS))
                    .endedAt(Instant.now().minus(90, ChronoUnit.MINUTES))
                    .score(180)
                    .correctAnswers(18)
                    .totalQuestions(20)
                    .accuracy(0.9)
                    .settingsSnapshotJson("{\"bpm\":84,\"pacePreset\":\"HARD\",\"autoAdvance\":true}")
                    .build());

            PracticeSession scaleSession = practiceSessionRepository.save(PracticeSession.builder()
                    .user(demo)
                    .exerciseType(ExerciseType.SCALE_MACHINE)
                    .startedAt(Instant.now().minus(26, ChronoUnit.HOURS))
                    .endedAt(Instant.now().minus(25, ChronoUnit.HOURS))
                    .score(120)
                    .correctAnswers(12)
                    .totalQuestions(15)
                    .accuracy(0.8)
                    .settingsSnapshotJson("{\"scaleType\":\"dorian\",\"root\":\"A\"}")
                    .build());

            exerciseResultRepository.saveAll(List.of(
                    ExerciseResult.builder()
                            .user(demo)
                            .exerciseType(ExerciseType.NOTE_MACHINE)
                            .promptLabel("Find C on string 2")
                            .expectedAnswer("C")
                            .submittedAnswer("C")
                            .correct(true)
                            .responseTimeMs(2100L)
                            .scoreDelta(10)
                            .metadataJson("{\"stringIndex\":4,\"fret\":1}")
                            .build(),
                    ExerciseResult.builder()
                            .user(demo)
                            .exerciseType(ExerciseType.SCALE_MACHINE)
                            .promptLabel("A dorian map")
                            .expectedAnswer("A C D E G")
                            .submittedAnswer("A C D E G")
                            .correct(true)
                            .responseTimeMs(5400L)
                            .scoreDelta(8)
                            .metadataJson("{\"positions\":5}")
                            .build()
            ));

            ScaleEntity savedScale = scaleRepository.save(ScaleEntity.builder()
                    .user(demo)
                    .rootNote("A")
                    .scaleType("dorian")
                    .noteNamesJson("[\"A\",\"B\",\"C\",\"D\",\"E\",\"F#\",\"G\"]")
                    .intervalsJson("[\"1\",\"2\",\"b3\",\"4\",\"5\",\"6\",\"b7\"]")
                    .tuningName("standard")
                    .fretRange(15)
                    .build());

            favoriteScaleRepository.save(FavoriteScale.builder()
                    .user(demo)
                    .scale(savedScale)
                    .nickname("Night Run Dorian")
                    .lastPracticedAt(noteSession.getEndedAt())
                    .build());

            favoriteScaleRepository.save(FavoriteScale.builder()
                    .user(demo)
                    .scale(scaleRepository.save(ScaleEntity.builder()
                            .user(demo)
                            .rootNote("E")
                            .scaleType("blues")
                            .noteNamesJson("[\"E\",\"G\",\"A\",\"Bb\",\"B\",\"D\"]")
                            .intervalsJson("[\"1\",\"b3\",\"4\",\"b5\",\"5\",\"b7\"]")
                            .tuningName("drop_d")
                            .fretRange(12)
                            .build()))
                    .nickname("Low-End Blues")
                    .lastPracticedAt(scaleSession.getEndedAt())
                    .build());
        };
    }
}
