/**
 * Room Manager Module
 * Handles room creation, joining, and management
 */
import { CONFIG, PHASES } from './config.js';
import { gameState } from './gameState.js';
import { generateRoomCode, generatePlayerId } from '../utils/helpers.js';
import { showScreen, hideModal, getElement } from '../utils/dom.js';
import { assignRoles, checkWinCondition } from './gameLogic.js';
import { syncTimer } from './timer.js';

/**
 * Create a new room
 */
export function createRoom(playerName) {
    console.log('Creating room for:', playerName);
    
    const roomCode = generateRoomCode();
    const playerId = generatePlayerId();
    const state = gameState.get();
    
    gameState.update({
        roomCode,
        playerId,
        playerName,
        isHost: true
    });
    
    const gameData = {
        phase: PHASES.LOBBY,
        players: {
            [playerId]: {
                id: playerId,
                name: playerName,
                ready: false,
                role: null,
                pattern: [],
                eliminated: false,
                isHost: true
            }
        },
        currentRound: 1,
        patterns: {},
        votes: {},
        eliminatedPlayers: [],
        timer: 0,
        gameStarted: false
    };
    
    console.log('Saving game data:', gameData);
    gameState.saveGameData(roomCode, gameData);
    
    hideModal('createRoom');
    const createInput = getElement('inputs', 'createPlayerName');
    if (createInput) createInput.value = '';
    
    enterLobby();
    startSyncLoop();
}

/**
 * Join an existing room
 */
export function joinRoom(roomCode, playerName) {
    console.log('Joining room:', roomCode, 'as:', playerName);
    
    const gameData = gameState.getGameData(roomCode);
    if (!gameData) {
        alert('Room not found. Please check the room code.');
        return;
    }
    
    if (gameData.gameStarted) {
        alert('Game already in progress');
        return;
    }
    
    if (Object.keys(gameData.players).length >= CONFIG.maxPlayers) {
        alert('Room is full');
        return;
    }
    
    // Check if name already exists
    const existingNames = Object.values(gameData.players).map(p => p.name.toLowerCase());
    if (existingNames.includes(playerName.toLowerCase())) {
        alert('A player with that name already exists. Please choose a different name.');
        return;
    }
    
    const playerId = generatePlayerId();
    const state = gameState.get();
    
    gameState.update({
        roomCode,
        playerId,
        playerName,
        isHost: false
    });
    
    gameData.players[playerId] = {
        id: playerId,
        name: playerName,
        ready: false,
        role: null,
        pattern: [],
        eliminated: false,
        isHost: false
    };
    
    console.log('Updated game data:', gameData);
    gameState.saveGameData(roomCode, gameData);
    
    hideModal('joinRoom');
    clearJoinRoomForm();
    enterLobby();
    startSyncLoop();
}

/**
 * Enter the lobby
 */
function enterLobby() {
    console.log('Entering lobby');
    showScreen('lobby');
    
    const state = gameState.get();
    const roomCodeDisplay = document.getElementById('room-code-display');
    if (roomCodeDisplay) {
        roomCodeDisplay.textContent = state.roomCode;
    }
    
    // Use dynamic import to avoid circular dependency
    import('./uiUpdater.js').then(({ updateLobbyDisplay }) => {
        updateLobbyDisplay();
    });
}

/**
 * Start the game
 */
export function startGame() {
    const state = gameState.get();
    if (!state.isHost) return;
    
    console.log('Starting game');
    
    const data = gameState.getGameData(state.roomCode);
    const playerIds = Object.keys(data.players);
    
    if (playerIds.length < CONFIG.minPlayers) {
        alert(`Need at least ${CONFIG.minPlayers} players to start`);
        return;
    }
    
    const roles = assignRoles(playerIds.length);
    
    // Assign roles to players
    playerIds.forEach((playerId, index) => {
        data.players[playerId].role = roles[index];
        data.players[playerId].ready = false;
    });
    
    data.phase = PHASES.ROLE_REVEAL;
    data.gameStarted = true;
    data.currentRound = 1;
    
    console.log('Game started, roles assigned:', roles);
    gameState.saveGameData(state.roomCode, data);
}

/**
 * Mark player as ready
 */
export function markPlayerReady() {
    console.log('Player ready');
    
    const state = gameState.get();
    const data = gameState.getGameData(state.roomCode);
    data.players[state.playerId].ready = true;
    gameState.saveGameData(state.roomCode, data);
    
    // Check if all players are ready
    const allReady = Object.values(data.players).every(p => p.ready);
    if (allReady && state.isHost) {
        console.log('All players ready, starting pattern phase');
        data.phase = PHASES.PATTERN_PHASE;
        data.timer = CONFIG.patternPhaseTime;
        gameState.saveGameData(state.roomCode, data);
    }
}

/**
 * Proceed to next round
 */
export function nextRound() {
    const state = gameState.get();
    const data = gameState.getGameData(state.roomCode);
    data.currentRound++;
    data.phase = PHASES.PATTERN_PHASE;
    data.timer = CONFIG.patternPhaseTime;
    data.patterns = {};
    data.votes = {};
    
    // Reset player patterns
    Object.values(data.players).forEach(player => {
        player.pattern = [];
    });
    
    gameState.saveGameData(state.roomCode, data);
}

/**
 * Play again with same players
 */
export function playAgain() {
    const state = gameState.get();
    const data = gameState.getGameData(state.roomCode);
    
    // Reset game state but keep players
    Object.values(data.players).forEach(player => {
        player.role = null;
        player.pattern = [];
        player.eliminated = false;
        player.ready = false;
    });
    
    data.phase = PHASES.LOBBY;
    data.currentRound = 1;
    data.patterns = {};
    data.votes = {};
    data.eliminatedPlayers = [];
    data.gameStarted = false;
    data.timer = 0;
    
    gameState.saveGameData(state.roomCode, data);
}

/**
 * Start a new game
 */
export function newGame() {
    syncTimer.stop();
    
    const state = gameState.get();
    if (state.roomCode) {
        gameState.clearGameData(state.roomCode);
    }
    
    gameState.reset();
    showScreen('splash');
}

/**
 * Start synchronization loop
 */
function startSyncLoop() {
    syncTimer.stop();
    syncTimer.start(CONFIG.syncInterval / 1000, () => {
        syncGameState();
        startSyncLoop(); // Restart the loop
    });
    syncGameState(); // Initial sync
}

/**
 * Synchronize game state
 */
function syncGameState() {
    const state = gameState.get();
    if (!state.roomCode) return;
    
    const data = gameState.getGameData(state.roomCode);
    if (!data) {
        console.log('Game data not found, returning to splash');
        newGame();
        return;
    }
    
    const currentPhase = state.phase;
    gameState.update({ phase: data.phase });
    
    // Handle phase transitions
    if (currentPhase !== data.phase) {
        console.log('Phase transition:', currentPhase, '->', data.phase);
        handlePhaseTransition(data);
    }
    
    // Update displays based on current phase
    updateDisplays(data);
}

/**
 * Handle phase transitions
 */
function handlePhaseTransition(data) {
    const state = gameState.get();
    
    switch (data.phase) {
        case PHASES.LOBBY:
            showScreen('lobby');
            import('./uiUpdater.js').then(({ updateLobbyDisplay }) => {
                updateLobbyDisplay();
            });
            break;
            
        case PHASES.ROLE_REVEAL:
            showScreen('roleReveal');
            displayPlayerRole(data);
            break;
            
        case PHASES.PATTERN_PHASE:
            showScreen('patternPhase');
            import('./patternHandler.js').then(({ createPatternGrid }) => {
                createPatternGrid();
            });
            break;
            
        case PHASES.VOTING:
            showScreen('voting');
            break;
            
        case PHASES.RESULTS:
            showScreen('results');
            import('./uiUpdater.js').then(({ updateResultsDisplay }) => {
                updateResultsDisplay();
            });
            break;
            
        case PHASES.GAME_END:
            showScreen('gameEnd');
            import('./uiUpdater.js').then(({ updateGameEndDisplay }) => {
                updateGameEndDisplay();
            });
            break;
    }
}

/**
 * Update displays based on current phase
 */
function updateDisplays(data) {
    switch (data.phase) {
        case PHASES.LOBBY:
            import('./uiUpdater.js').then(({ updateLobbyDisplay }) => {
                updateLobbyDisplay();
            });
            break;
        case PHASES.PATTERN_PHASE:
            import('./uiUpdater.js').then(({ updatePatternPhaseDisplay }) => {
                updatePatternPhaseDisplay();
            });
            break;
        case PHASES.VOTING:
            import('./uiUpdater.js').then(({ updateVotingDisplay }) => {
                updateVotingDisplay();
            });
            break;
    }
}

/**
 * Display player role
 */
function displayPlayerRole(data) {
    const state = gameState.get();
    const player = data.players[state.playerId];
    const roleIcon = document.getElementById('role-icon');
    const roleName = document.getElementById('role-name');
    const roleDesc = document.getElementById('role-description');
    
    if (roleIcon) roleIcon.textContent = player.role === 'original' ? '👤' : '🪞';
    if (roleName) {
        roleName.textContent = player.role.charAt(0).toUpperCase() + player.role.slice(1);
        roleName.className = `role-name ${player.role}`;
    }
    
    if (roleDesc) {
        if (player.role === 'original') {
            roleDesc.textContent = 'Create unique patterns. Watch out for players copying you!';
        } else {
            roleDesc.textContent = 'Copy other players perfectly to avoid detection!';
        }
    }
}

/**
 * Clear join room form
 */
function clearJoinRoomForm() {
    const roomCodeInput = getElement('inputs', 'roomCode');
    const playerNameInput = getElement('inputs', 'playerName');
    
    if (roomCodeInput) roomCodeInput.value = '';
    if (playerNameInput) playerNameInput.value = '';
}
