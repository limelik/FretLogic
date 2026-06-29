package com.fretlogic.api.repository;

import com.fretlogic.api.entity.SavedProgress;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedProgressRepository extends JpaRepository<SavedProgress, Long> {

    Optional<SavedProgress> findByUserId(Long userId);
}
