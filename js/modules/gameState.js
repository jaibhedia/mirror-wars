/**
 * Game State Management Module
 * Handles all game state operations and persistence
 */
import { PHASES } from './config.js';

class GameState {
    constructor() {
        this.state = {
            roomCode: null,
            playerId: null,
            playerName: null,
            phase: PHASES.SPLASH,
            players: {},
            currentRound: 1,
            patterns: {},
            votes: {},
            eliminatedPlayers: [],
            timer: 0,
            gameStarted: false,
            isHost: false
        };
    }

    /**
     * Get current state
     */
    get() {
        return this.state;
    }

    /**
     * Update state properties
     */
    update(updates) {
        this.state = { ...this.state, ...updates };
    }

    /**
     * Reset state to initial values
     */
    reset() {
        this.state = {
            roomCode: null,
            playerId: null,
            playerName: null,
            phase: PHASES.SPLASH,
            players: {},
            currentRound: 1,
            patterns: {},
            votes: {},
            eliminatedPlayers: [],
            timer: 0,
            gameStarted: false,
            isHost: false
        };
    }

    /**
     * Save game data to localStorage
     */
    saveGameData(roomCode, data) {
        localStorage.setItem(`mirrorwars_${roomCode}`, JSON.stringify(data));
    }

    /**
     * Get game data from localStorage
     */
    getGameData(roomCode) {
        const data = localStorage.getItem(`mirrorwars_${roomCode}`);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Remove game data from localStorage
     */
    clearGameData(roomCode) {
        if (roomCode) {
            localStorage.removeItem(`mirrorwars_${roomCode}`);
        }
    }
}

// Export singleton instance
export const gameState = new GameState();
