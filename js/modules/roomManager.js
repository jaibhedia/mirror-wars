/**
 * Room Manager Module
 * Handles room creation, joining, and management with socket.io
 */
import { CONFIG, PHASES } from './config.js';
import { gameState } from './gameState.js';
import { showScreen, hideModal, getElement } from '../utils/dom.js';
import socketManager from './socketManager.js';
import { updateLobbyDisplay, updateGameDisplay } from './uiUpdater.js';

let socketListenersSetup = false;

/**
 * Set up socket event listeners
 */
function setupSocketListeners() {
    if (socketListenersSetup) return;
    socketListenersSetup = true;

    // Room creation success
    socketManager.on('roomCreated', (data) => {
        console.log('Room created:', data);
        gameState.update({
            roomCode: data.roomCode,
            isHost: data.isHost,
            players: data.players || [],
            phase: PHASES.LOBBY
        });
        hideModal('create-room-modal');
        enterLobby();
    });

    // Join room success
    socketManager.on('joinSuccess', (data) => {
        console.log('Joined room:', data);
        gameState.update({
            roomCode: data.roomCode,
            isHost: data.isHost,
            players: data.players || [],
            phase: PHASES.LOBBY
        });
        hideModal('join-room-modal');
        enterLobby();
    });

    // Join room error
    socketManager.on('joinError', (data) => {
        console.error('Join error:', data);
        alert(data.message);
    });

    // Player joined
    socketManager.on('playerJoined', (data) => {
        console.log('Player joined:', data);
        gameState.update({
            players: data.players
        });
        updateLobbyDisplay();
    });

    // Player left
    socketManager.on('playerLeft', (data) => {
        console.log('Player left:', data);
        gameState.update({
            players: data.players
        });
        updateLobbyDisplay();
    });

    // Role assigned
    socketManager.on('roleAssigned', (data) => {
        console.log('Role assigned:', data);
        gameState.update({
            playerRole: data.role,
            players: data.players,
            phase: PHASES.ROLE_REVEAL
        });
        showRoleReveal(data.role);
    });

    // Pattern submitted
    socketManager.on('patternSubmitted', (data) => {
        console.log('Pattern submitted:', data);
        updatePatternProgress(data.submitted, data.total);
    });

    // All patterns complete
    socketManager.on('patternsComplete', (data) => {
        console.log('All patterns complete:', data);
        gameState.update({
            players: data.players,
            phase: PHASES.VOTING
        });
        showVotingPhase();
    });

    // Vote submitted
    socketManager.on('voteSubmitted', (data) => {
        console.log('Vote submitted:', data);
        updateVoteProgress(data.submitted, data.total);
    });

    // Voting complete
    socketManager.on('votingComplete', (data) => {
        console.log('Voting complete:', data);
        gameState.update({
            players: data.players
        });
        showVotingResults(data.eliminatedPlayer, data.votes, data.winResult);
    });

    // Next round
    socketManager.on('nextRound', (data) => {
        console.log('Next round:', data);
        gameState.update({
            players: data.players,
            currentRound: data.roundNumber,
            phase: PHASES.PATTERN
        });
        showPatternPhase();
    });

    // Game error
    socketManager.on('gameError', (data) => {
        console.error('Game error:', data);
        alert(data.message);
    });
}

/**
 * Create a new room
 */
export function createRoom(playerName) {
    console.log('Creating room for:', playerName);
    
    if (!playerName || playerName.trim().length === 0) {
        alert('Please enter your name');
        return;
    }

    setupSocketListeners();
    socketManager.createRoom(playerName.trim());
    
    gameState.update({
        playerName: playerName.trim()
    });
}

/**
 * Join an existing room
 */
export function joinRoom(roomCode, playerName) {
    console.log('Joining room:', roomCode, 'as:', playerName);
    
    if (!roomCode || roomCode.trim().length === 0) {
        alert('Please enter a room code');
        return;
    }
    
    if (!playerName || playerName.trim().length === 0) {
        alert('Please enter your name');
        return;
    }

    setupSocketListeners();
    socketManager.joinRoom(roomCode.trim(), playerName.trim());
    
    gameState.update({
        playerName: playerName.trim()
    });
}

/**
 * Start the game (host only)
 */
export function startGame() {
    const state = gameState.get();
    
    if (!state.isHost) {
        alert('Only the host can start the game');
        return;
    }
    
    if (!state.players || state.players.length < 3) {
        alert('Need at least 3 players to start the game');
        return;
    }
    
    socketManager.startGame();
}

/**
 * Enter lobby screen
 */
function enterLobby() {
    showScreen('lobby');
    updateLobbyDisplay();
}

/**
 * Show role reveal screen
 */
function showRoleReveal(role) {
    const roleElement = getElement('roleReveal', 'playerRole');
    const descElement = getElement('roleReveal', 'roleDescription');
    
    if (roleElement) {
        roleElement.textContent = role === 'mirror' ? 'Mirror' : 'Original';
        roleElement.className = `role role--${role}`;
    }
    
    if (descElement) {
        if (role === 'mirror') {
            descElement.textContent = 'You must copy other players\' patterns to blend in. Survive to the end!';
        } else {
            descElement.textContent = 'Create unique patterns and find the Mirrors among you!';
        }
    }
    
    showScreen('role-reveal');
    
    // Auto-advance to pattern phase after 5 seconds
    setTimeout(() => {
        showPatternPhase();
    }, 5000);
}

/**
 * Show pattern phase
 */
function showPatternPhase() {
    gameState.update({ phase: PHASES.PATTERN });
    showScreen('pattern-phase');
    updateGameDisplay();
}

/**
 * Show voting phase
 */
function showVotingPhase() {
    gameState.update({ phase: PHASES.VOTING });
    showScreen('voting-phase');
    updateGameDisplay();
}

/**
 * Show voting results
 */
function showVotingResults(eliminatedPlayer, votes, winResult) {
    const resultDiv = getElement('results', 'votingResult');
    if (resultDiv) {
        resultDiv.innerHTML = `
            <h3>Voting Results</h3>
            <p><strong>${eliminatedPlayer.name}</strong> was eliminated!</p>
            <p>They were a <strong>${eliminatedPlayer.role}</strong></p>
        `;
    }
    
    if (winResult) {
        showGameEnd(winResult);
    } else {
        showScreen('results');
        // Auto-advance to next round after 5 seconds
        setTimeout(() => {
            showPatternPhase();
        }, 5000);
    }
}

/**
 * Show game end screen
 */
function showGameEnd(winResult) {
    const titleElement = getElement('gameEnd', 'gameEndTitle');
    const messageElement = getElement('gameEnd', 'gameEndMessage');
    
    if (titleElement) {
        titleElement.textContent = winResult.winner === 'originals' ? 'Originals Win!' : 'Mirrors Win!';
    }
    
    if (messageElement) {
        messageElement.textContent = winResult.message;
    }
    
    showScreen('game-end');
}

/**
 * Update pattern submission progress
 */
function updatePatternProgress(submitted, total) {
    const progressElement = getElement('patternPhase', 'patternProgress');
    if (progressElement) {
        progressElement.textContent = `${submitted}/${total} patterns submitted`;
    }
}

/**
 * Update voting progress
 */
function updateVoteProgress(submitted, total) {
    const progressElement = getElement('votingPhase', 'votingProgress');
    if (progressElement) {
        progressElement.textContent = `${submitted}/${total} votes submitted`;
    }
}

/**
 * Submit pattern
 */
export function submitPattern(pattern) {
    console.log('Submitting pattern:', pattern);
    socketManager.submitPattern(pattern);
}

/**
 * Submit vote
 */
export function submitVote(playerId) {
    console.log('Submitting vote for:', playerId);
    socketManager.submitVote(playerId);
}

/**
 * Leave room and return to splash screen
 */
export function leaveRoom() {
    gameState.reset();
    showScreen('splash');
}

/**
 * Get current room code
 */
export function getCurrentRoomCode() {
    return gameState.get().roomCode;
}

/**
 * Check if player is host
 */
export function isHost() {
    return gameState.get().isHost;
}
