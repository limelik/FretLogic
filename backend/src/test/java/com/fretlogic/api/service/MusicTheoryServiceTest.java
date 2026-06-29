package com.fretlogic.api.service;

import com.fretlogic.api.dto.music.ScaleRequest;
import com.fretlogic.api.service.music.MusicTheoryService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class MusicTheoryServiceTest {

    private final MusicTheoryService musicTheoryService = new MusicTheoryService();

    @Test
    void buildsMajorScale() {
        var response = musicTheoryService.buildScale(new ScaleRequest("C", "major", "standard", 12, true));

        Assertions.assertEquals(7, response.notes().size());
        Assertions.assertEquals("C", response.notes().getFirst());
        Assertions.assertTrue(response.highlightedPositions().stream().anyMatch(position -> position.root()));
    }
}
