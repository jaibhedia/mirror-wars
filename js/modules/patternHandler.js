/**
 * Pattern Handler Module
 * Manages pattern creation and interaction
 */
import { CONFIG } from './config.js';
import { gameState } from './gameState.js';
import { getElement, createElement } from '../utils/dom.js';

/**
 * Create the pattern grid
 */
export function createPatternGrid() {
    const grid = getElement('containers', 'patternGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    for (let i = 0; i < CONFIG.gridSize * CONFIG.gridSize; i++) {
        const button = createElement('button', {
            className: 'pattern-button',
            attributes: {
                style: `background-color: ${CONFIG.buttonColors[i % CONFIG.buttonColors.length]}`
            },
            dataset: { index: i.toString() }
        });
        
        button.addEventListener('click', () => handlePatternButtonClick(i));
        grid.appendChild(button);
    }
}

/**
 * Handle pattern button click
 */
function handlePatternButtonClick(index) {
    const state = gameState.get();
    const data = gameState.getGameData(state.roomCode);
    if (data.phase !== 'patternPhase') return;
    
    const player = data.players[state.playerId];
    if (!player.pattern) player.pattern = [];
    
    // Add to pattern if not already clicked
    if (!player.pattern.includes(index)) {
        player.pattern.push(index);
        
        // Update visual
        const button = document.querySelector(`[data-index="${index}"]`);
        if (button) {
            button.classList.add('tapped');
            
            const tapNumber = createElement('div', {
                className: 'tap-number',
                textContent: player.pattern.length.toString()
            });
            button.appendChild(tapNumber);
        }
    }
    
    gameState.saveGameData(state.roomCode, data);
}

/**
 * Clear pattern grid
 */
export function clearPatternGrid() {
    const state = gameState.get();
    const data = gameState.getGameData(state.roomCode);
    const player = data.players[state.playerId];
    
    if (player) {
        player.pattern = [];
        gameState.saveGameData(state.roomCode, data);
    }
    
    // Clear visual indicators
    const buttons = document.querySelectorAll('.pattern-button');
    buttons.forEach(button => {
        button.classList.remove('tapped');
        const tapNumber = button.querySelector('.tap-number');
        if (tapNumber) {
            tapNumber.remove();
        }
    });
}

/**
 * Get current player pattern
 */
export function getCurrentPattern() {
    const state = gameState.get();
    const data = gameState.getGameData(state.roomCode);
    const player = data.players[state.playerId];
    
    return player ? player.pattern || [] : [];
}

/**
 * Set pattern programmatically
 */
export function setPattern(pattern) {
    const state = gameState.get();
    const data = gameState.getGameData(state.roomCode);
    const player = data.players[state.playerId];
    
    if (player) {
        player.pattern = [...pattern];
        gameState.saveGameData(state.roomCode, data);
        updatePatternVisual(pattern);
    }
}

/**
 * Update pattern visual representation
 */
function updatePatternVisual(pattern) {
    // Clear existing visuals
    const buttons = document.querySelectorAll('.pattern-button');
    buttons.forEach(button => {
        button.classList.remove('tapped');
        const tapNumber = button.querySelector('.tap-number');
        if (tapNumber) {
            tapNumber.remove();
        }
    });
    
    // Add new visuals
    pattern.forEach((buttonIndex, patternIndex) => {
        const button = document.querySelector(`[data-index="${buttonIndex}"]`);
        if (button) {
            button.classList.add('tapped');
            
            const tapNumber = createElement('div', {
                className: 'tap-number',
                textContent: (patternIndex + 1).toString()
            });
            button.appendChild(tapNumber);
        }
    });
}
