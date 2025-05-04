package com.example.demo.service;

import com.example.demo.entity.Player;
import com.example.demo.repository.PlayerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class PlayerService {
    private final PlayerRepository playerRepository;

    public PlayerService(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    @Transactional
    public void saveScore(String username, Integer score) {
        Player player = playerRepository.findByUsername(username)
                .orElseGet(() -> new Player(username, 0));

        if (score > player.getHighScore()) {
            player.setHighScore(score);
            playerRepository.save(player);
        }
    }

    public List<Player> getTopPlayers() {
        return playerRepository.findTop10ByOrderByHighScoreDesc();
    }
}
