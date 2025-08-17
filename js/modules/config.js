/**
 * Game Configuration Module
 * Contains all game constants and settings
 */
export const CONFIG = {
    minPlayers: 3,
    maxPlayers: 8,
    mirrorRatio: 0.4,
    patternPhaseTime: 60,
    votingPhaseTime: 45,
    gridSize: 4,
    buttonColors: [
        "#FF6B6B", 
        "#4ECDC4", 
        "#45B7D1", 
        "#96CEB4", 
        "#FFEAA7", 
        "#DDA0DD", 
        "#98D8C8", 
        "#F7DC6F"
    ],
    syncInterval: 500
};

/**
 * Game phases enum
 */
export const PHASES = {
    SPLASH: 'splash',
    LOBBY: 'lobby',
    ROLE_REVEAL: 'roleReveal',
    PATTERN_PHASE: 'patternPhase',
    VOTING: 'voting',
    RESULTS: 'results',
    GAME_END: 'gameEnd'
};

/**
 * Player roles enum
 */
export const ROLES = {
    ORIGINAL: 'original',
    MIRROR: 'mirror'
};
