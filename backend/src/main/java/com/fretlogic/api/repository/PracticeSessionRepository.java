package com.fretlogic.api.repository;

import com.fretlogic.api.entity.PracticeSession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PracticeSessionRepository extends JpaRepository<PracticeSession, Long> {

    List<PracticeSession> findTop10ByUserIdOrderByEndedAtDesc(Long userId);

    List<PracticeSession> findByUserIdOrderByEndedAtDesc(Long userId);
}
