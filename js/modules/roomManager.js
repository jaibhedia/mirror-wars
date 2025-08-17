/**
 * Room Manager Module
 * Handles room creation, joining, and management with socket.io
 */
import { CONFIG, PHASES } from './config.js';
import { gameState } from './gameState.js';
import { showScreen, hideModal, getElement } from '../utils/dom.js';
import socketManager from './socketManager.js';
import { updateLobbyDisplay, updatePatternPhaseDisplay, updateVotingDisplay } from './uiUpdater.js';

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
        hideModal('createRoom');
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
        hideModal('joinRoom');
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
        updateLobbyUI();
    });

    // Player left
    socketManager.on('playerLeft', (data) => {
        console.log('Player left:', data);
        gameState.update({
            players: data.players
        });
        updateLobbyUI();
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
    showScreen('lobby-screen');
    updateLobbyUI();
}

/**
 * Simple lobby UI update for Socket.IO structure
 */
function updateLobbyUI() {
    const state = gameState.get();
    
    // Update room code display
    const roomCodeDisplay = document.getElementById('room-code-display');
    if (roomCodeDisplay && state.roomCode) {
        roomCodeDisplay.textContent = state.roomCode;
    }
    
    // Update players list
    const playersContainer = document.getElementById('players-container');
    if (playersContainer && state.players) {
        playersContainer.innerHTML = '';
        state.players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <div class="player-avatar">${player.name.charAt(0).toUpperCase()}</div>
                <div class="player-name">${player.name}${player.isHost ? ' (Host)' : ''}</div>
            `;
            playersContainer.appendChild(playerDiv);
        });
    }
    
    // Update start button and waiting text
    const startBtn = document.getElementById('start-game-btn');
    const waitingText = document.querySelector('.waiting-text');
    const roomStatus = document.querySelector('.room-status');
    
    const playerCount = state.players ? state.players.length : 0;
    
    if (startBtn && waitingText) {
        if (state.isHost && playerCount >= 3) {
            startBtn.classList.remove('hidden');
            waitingText.classList.add('hidden');
        } else {
            startBtn.classList.add('hidden');
            waitingText.classList.remove('hidden');
        }
    }
    
    if (roomStatus) {
        roomStatus.textContent = `Players: ${playerCount}/8 (3 minimum needed)`;
    }
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
    
    showScreen('role-reveal-screen');
    
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
    showScreen('pattern-phase-screen');
    updatePatternPhaseDisplay();
}

/**
 * Show voting phase
 */
function showVotingPhase() {
    gameState.update({ phase: PHASES.VOTING });
    showScreen('voting-phase-screen');
    updateVotingDisplay();
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
        showScreen('results-screen');
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
    
    showScreen('game-end-screen');
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
    showScreen('splash-screen');
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

/**
 * Mark player as ready (placeholder for now)
 */
export function markPlayerReady() {
    console.log('Player marked as ready');
    // This functionality may not be needed with real-time socket updates
}

/**
 * Start next round (placeholder for now)
 */
export function nextRound() {
    console.log('Next round requested');
    // This is handled automatically by the server
}

/**
 * Play again - restart the game
 */
export function playAgain() {
    console.log('Play again requested');
    if (isHost()) {
        socketManager.startGame();
    }
}

/**
 * Start a new game - return to lobby
 */
export function newGame() {
    console.log('New game requested');
    leaveRoom();
}
