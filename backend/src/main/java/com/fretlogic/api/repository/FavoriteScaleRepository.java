package com.fretlogic.api.repository;

import com.fretlogic.api.entity.FavoriteScale;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteScaleRepository extends JpaRepository<FavoriteScale, Long> {

    List<FavoriteScale> findByUserIdOrderByCreatedAtDesc(Long userId);
}
