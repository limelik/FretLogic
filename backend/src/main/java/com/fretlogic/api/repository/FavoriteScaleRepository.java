package com.fretlogic.api.repository;

import com.fretlogic.api.entity.FavoriteScale;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteScaleRepository extends JpaRepository<FavoriteScale, Long> {

    @EntityGraph(attributePaths = "scale")
    List<FavoriteScale> findByUserIdOrderByCreatedAtDesc(Long userId);
}
