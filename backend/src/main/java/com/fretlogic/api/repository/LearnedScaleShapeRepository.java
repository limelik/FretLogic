package com.fretlogic.api.repository;

import com.fretlogic.api.entity.LearnedScaleShape;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearnedScaleShapeRepository extends JpaRepository<LearnedScaleShape, Long> {

    List<LearnedScaleShape> findByUserIdOrderByLearnedAtDesc(Long userId);

    Optional<LearnedScaleShape> findByUserIdAndRootNoteAndScaleTypeAndShapeId(Long userId, String rootNote, String scaleType, String shapeId);
}
