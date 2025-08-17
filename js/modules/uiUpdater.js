/**
 * UI Updater Module
 * Handles updating UI elements based on game state
 */
import { CONFIG } from './config.js';
import { gameState } from './gameState.js';
import { getElement, getElements, clearContainer, createElement } from '../utils/dom.js';

/**
 * Update lobby display
 */
export function updateLobbyDisplay() {
    const state = gameState.get();
    const data = gameState.getGameData(state.roomCode);
    if (!data) return;
    
    const playersList = getElement('containers', 'players');
    const playerCount = Object.keys(data.players).length;
    
    if (playersList) {
        playersList.innerHTML = '';
        Object.values(data.players).forEach(player => {
            const playerDiv = createElement('div', {
                className: 'player-item',
                innerHTML: `
                    <div class="player-avatar">${player.name.charAt(0).toUpperCase()}</div>
                    <div class="player-name">${player.name}${player.isHost ? ' (Host)' : ''}</div>
                `
            });
            playersList.appendChild(playerDiv);
        });
    }
    
    const startBtn = getElement('buttons', 'startGame');
    const waitingText = document.querySelector('.waiting-text');
    
    if (startBtn && waitingText) {
        if (state.isHost && playerCount >= CONFIG.minPlayers) {
            startBtn.classList.remove('hidden');
            waitingText.classList.add('hidden');
        } else {
            startBtn.classList.add('hidden');
            waitingText.classList.remove('hidden');
        }
    }
    
    const roomStatus = document.querySelector('.room-status');
    if (roomStatus) {
        roomStatus.textContent = `Players: ${playerCount}/${CONFIG.maxPlayers} (${CONFIG.minPlayers} minimum needed)`;
    }
}

/**
 * Update pattern phase display
 */
export function updatePatternPhaseDisplay() {
    const state = gameState.get();
    const data = gameState.getGameData(state.roomCode);
    if (!data) return;
    
    // Update timer
    const timerElement = document.getElementById('pattern-timer');
    if (timerElement) {
        timerElement.textContent = data.timer;
        if (data.timer <= 10) {
            timerElement.classList.add('warning');
        }
    }
    
    // Update hint based on role
    const player = data.players[state.playerId];
    const hint = document.getElementById('pattern-hint');
    if (hint && player) {
        if (player.role === 'mirror') {
            hint.textContent = 'Copy other players\' patterns to blend in!';
        } else {
            hint.textContent = 'Create a unique pattern that others will try to copy!';
        }
    }
    
    // Update other players' patterns
    updateOtherPatternsDisplay(data);
}

/**
 * Update other players' patterns display
 */
function updateOtherPatternsDisplay(data) {
    const state = gameState.get();
    const container = getElement('containers', 'otherPatterns');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.values(data.players).forEach(player => {
        if (player.id === state.playerId || player.eliminated) return;
        
        const patternDiv = createElement('div', {
            className: 'player-pattern'
        });
        
        const miniGrid = createElement('div', {
            className: 'pattern-mini-grid'
        });
        
        for (let i = 0; i < CONFIG.gridSize * CONFIG.gridSize; i++) {
            const miniButton = createElement('div', {
                className: 'pattern-mini-button',
                attributes: {
                    style: `background-color: ${CONFIG.buttonColors[i % CONFIG.buttonColors.length]}`
                }
            });
            
            const tapIndex = player.pattern ? player.pattern.indexOf(i) : -1;
            if (tapIndex !== -1) {
                miniButton.classList.add('tapped');
                const tapNumber = createElement('div', {
                    className: 'tap-number',
                    textContent: tapIndex + 1
                });
                miniButton.appendChild(tapNumber);
            }
            
            miniGrid.appendChild(miniButton);
        }
        
        patternDiv.innerHTML = `
            <div class="player-pattern-header">
                <span class="player-pattern-name">${player.name}</span>
                <span class="pattern-length">${player.pattern ? player.pattern.length : 0} taps</span>
            </div>
        `;
        patternDiv.appendChild(miniGrid);
        container.appendChild(patternDiv);
    });
}

/**
 * Update voting display
 */
export function updateVotingDisplay() {
    const state = gameState.get();
    const data = gameState.getGameData(state.roomCode);
    const container = getElement('containers', 'votingPlayers');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Update timer
    const timerElement = document.getElementById('voting-timer');
    if (timerElement) {
        timerElement.textContent = data.timer;
    }
    
    Object.values(data.players).forEach(player => {
        if (player.eliminated || player.id === state.playerId) return;
        
        const voteCount = Object.values(data.votes).filter(vote => vote === player.id).length;
        
        const playerDiv = createElement('div', {
            className: 'voting-player',
            dataset: { playerId: player.id },
            innerHTML: `
                <div class="voting-player-content">
                    <div class="voting-player-info">
                        <div class="player-avatar">${player.name.charAt(0).toUpperCase()}</div>
                        <span class="player-name">${player.name}</span>
                    </div>
                    <div class="vote-count">${voteCount} votes</div>
                </div>
            `
        });
        
        playerDiv.addEventListener('click', () => votePlayer(player.id));
        container.appendChild(playerDiv);
    });
    
    // Highlight voted player
    const myVote = data.votes[state.playerId];
    if (myVote) {
        const votedElement = document.querySelector(`[data-player-id="${myVote}"]`);
        if (votedElement) {
            votedElement.classList.add('selected');
        }
    }
}

/**
 * Vote for a player
 */
function votePlayer(targetPlayerId) {
    const state = gameState.get();
    const data = gameState.getGameData(state.roomCode);
    data.votes[state.playerId] = targetPlayerId;
    gameState.saveGameData(state.roomCode, data);
}

/**
 * Update results display
 */
export function updateResultsDisplay() {
    const state = gameState.get();
    const data = gameState.getGameData(state.roomCode);
    const eliminatedPlayer = data.players[data.lastEliminated];
    
    if (eliminatedPlayer) {
        const playerNameElement = document.querySelector('.eliminated-player .player-name');
        if (playerNameElement) {
            playerNameElement.textContent = eliminatedPlayer.name;
        }
        
        const roleSpan = document.getElementById('revealed-role');
        if (roleSpan) {
            roleSpan.textContent = eliminatedPlayer.role.charAt(0).toUpperCase() + eliminatedPlayer.role.slice(1);
            roleSpan.className = `revealed-role ${eliminatedPlayer.role}`;
        }
    }
}

/**
 * Update game end display
 */
export function updateGameEndDisplay() {
    const state = gameState.get();
    const data = gameState.getGameData(state.roomCode);
    
    const titleElement = document.getElementById('victory-title');
    const messageElement = document.getElementById('victory-message');
    
    if (titleElement && messageElement) {
        if (data.winner === 'originals') {
            titleElement.textContent = '🎉 Originals Win!';
            titleElement.className = 'victory-title originals-win';
        } else {
            titleElement.textContent = '🪞 Mirrors Win!';
            titleElement.className = 'victory-title mirrors-win';
        }
        
        messageElement.textContent = data.winMessage;
    }
    
    // Show final roles
    const rolesContainer = getElement('containers', 'finalRoles');
    if (rolesContainer) {
        rolesContainer.innerHTML = '';
        
        Object.values(data.players).forEach(player => {
            const roleDiv = createElement('div', {
                className: 'final-role-item',
                innerHTML: `
                    <span class="player-name">${player.name}</span>
                    <span class="final-role ${player.role}">${player.role.charAt(0).toUpperCase() + player.role.slice(1)}</span>
                `
            });
            rolesContainer.appendChild(roleDiv);
        });
    }
}
