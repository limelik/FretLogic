package com.fretlogic.api.repository;

import com.fretlogic.api.entity.LearnedNote;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearnedNoteRepository extends JpaRepository<LearnedNote, Long> {

    List<LearnedNote> findByUserIdOrderByLearnedAtDesc(Long userId);

    Optional<LearnedNote> findByUserIdAndNoteName(Long userId, String noteName);
}
