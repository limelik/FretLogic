package com.fretlogic.api.repository;

import com.fretlogic.api.entity.ExerciseResult;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExerciseResultRepository extends JpaRepository<ExerciseResult, Long> {

    List<ExerciseResult> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);

    List<ExerciseResult> findByUserIdOrderByCreatedAtDesc(Long userId);
}
