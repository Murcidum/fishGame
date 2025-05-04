package com.example.demo.controller;

import com.example.demo.dto.PlayerDto;
import com.example.demo.service.PlayerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:8081")
public class GameController {
    private final PlayerService playerService;

    public GameController(PlayerService playerService) {
        this.playerService = playerService;
    }

    @PostMapping("/save-score")
    public ResponseEntity<?> saveScore(@RequestBody PlayerDto dto) {
        playerService.saveScore(dto.getUsername(), dto.getScore());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<PlayerDto>> getLeaderboard() {
        return ResponseEntity.ok(
                playerService.getTopPlayers().stream()
                        .map(p -> new PlayerDto(p.getUsername(), p.getHighScore()))
                        .collect(Collectors.toList())
        );
    }
}