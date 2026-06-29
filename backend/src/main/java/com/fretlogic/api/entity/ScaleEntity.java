package com.fretlogic.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "scales")
public class ScaleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @Column(nullable = false)
    private String rootNote;

    @Column(nullable = false)
    private String scaleType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String noteNamesJson;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String intervalsJson;

    @Column(nullable = false)
    private String tuningName;

    @Column(nullable = false)
    private Integer fretRange;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "scale", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<FavoriteScale> favoriteScales;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
