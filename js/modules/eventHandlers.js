/**
 * Event Handlers Module
 * Manages all user interface event handlers
 */
import { getElement, showModal, hideModal } from '../utils/dom.js';
import { validatePlayerName, validateRoomCode } from '../utils/helpers.js';
import { gameState } from './gameState.js';
import { createRoom, joinRoom, startGame, markPlayerReady, nextRound, playAgain, newGame } from './roomManager.js';

/**
 * Initialize all event handlers
 */
export function initializeEventHandlers() {
    console.log('Initializing event handlers');
    
    setupSplashHandlers();
    setupModalHandlers();
    setupLobbyHandlers();
    setupGameHandlers();
    setupKeyboardHandlers();
}

/**
 * Setup splash screen event handlers
 */
function setupSplashHandlers() {
    const createBtn = getElement('buttons', 'createRoom');
    const joinBtn = getElement('buttons', 'joinRoom');
    
    if (createBtn) {
        createBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Create room button clicked');
            showModal('createRoom');
        });
    }
    
    if (joinBtn) {
        joinBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Join room button clicked');
            showModal('joinRoom');
        });
    }
}

/**
 * Setup modal event handlers
 */
function setupModalHandlers() {
    // Create room modal
    const cancelCreateBtn = getElement('buttons', 'cancelCreate');
    const confirmCreateBtn = getElement('buttons', 'confirmCreate');
    
    if (cancelCreateBtn) {
        cancelCreateBtn.addEventListener('click', () => {
            hideModal('createRoom');
            clearCreateRoomForm();
        });
    }
    
    if (confirmCreateBtn) {
        confirmCreateBtn.addEventListener('click', handleCreateRoomSubmit);
    }
    
    // Join room modal
    const cancelJoinBtn = getElement('buttons', 'cancelJoin');
    const confirmJoinBtn = getElement('buttons', 'confirmJoin');
    
    if (cancelJoinBtn) {
        cancelJoinBtn.addEventListener('click', () => {
            hideModal('joinRoom');
            clearJoinRoomForm();
        });
    }
    
    if (confirmJoinBtn) {
        confirmJoinBtn.addEventListener('click', handleJoinRoomSubmit);
    }
}

/**
 * Setup lobby event handlers
 */
function setupLobbyHandlers() {
    const startBtn = getElement('buttons', 'startGame');
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    }
}

/**
 * Setup game event handlers
 */
function setupGameHandlers() {
    // Role reveal
    const readyBtn = getElement('buttons', 'ready');
    if (readyBtn) {
        readyBtn.addEventListener('click', markPlayerReady);
    }
    
    // Results
    const nextBtn = getElement('buttons', 'nextRound');
    if (nextBtn) {
        nextBtn.addEventListener('click', nextRound);
    }
    
    // Game end
    const playAgainBtn = getElement('buttons', 'playAgain');
    const newGameBtn = getElement('buttons', 'newGame');
    
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', playAgain);
    }
    
    if (newGameBtn) {
        newGameBtn.addEventListener('click', newGame);
    }
}

/**
 * Setup keyboard event handlers
 */
function setupKeyboardHandlers() {
    const createNameInput = getElement('inputs', 'createPlayerName');
    const roomCodeInput = getElement('inputs', 'roomCode');
    const playerNameInput = getElement('inputs', 'playerName');
    
    if (createNameInput) {
        createNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleCreateRoomSubmit();
        });
    }
    
    if (roomCodeInput) {
        roomCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleJoinRoomSubmit();
        });
    }
    
    if (playerNameInput) {
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleJoinRoomSubmit();
        });
    }
}

/**
 * Handle create room form submission
 */
function handleCreateRoomSubmit() {
    const playerNameInput = getElement('inputs', 'createPlayerName');
    const playerName = playerNameInput?.value.trim();
    
    if (!validatePlayerName(playerName)) {
        alert('Please enter a valid name (2-20 characters)');
        return;
    }
    
    console.log('Creating room for:', playerName);
    createRoom(playerName);
}

/**
 * Handle join room form submission
 */
function handleJoinRoomSubmit() {
    const roomCodeInput = getElement('inputs', 'roomCode');
    const playerNameInput = getElement('inputs', 'playerName');
    
    const roomCode = roomCodeInput?.value.trim();
    const playerName = playerNameInput?.value.trim();
    
    if (!validateRoomCode(roomCode)) {
        alert('Please enter a valid 4-digit room code');
        return;
    }
    
    if (!validatePlayerName(playerName)) {
        alert('Please enter a valid name (2-20 characters)');
        return;
    }
    
    joinRoom(roomCode, playerName);
}

/**
 * Clear create room form
 */
function clearCreateRoomForm() {
    const input = getElement('inputs', 'createPlayerName');
    if (input) input.value = '';
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
