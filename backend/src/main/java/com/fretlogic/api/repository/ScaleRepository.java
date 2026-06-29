package com.fretlogic.api.repository;

import com.fretlogic.api.entity.ScaleEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScaleRepository extends JpaRepository<ScaleEntity, Long> {

    List<ScaleEntity> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);
}
