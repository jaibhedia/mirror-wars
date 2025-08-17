/**
 * DOM Utilities Module
 * Handles DOM manipulation and element management
 */

/**
 * DOM element cache
 */
const elements = {
    screens: {},
    modals: {},
    buttons: {},
    inputs: {},
    containers: {}
};

/**
 * Initialize DOM elements cache
 */
export function initializeDOMElements() {
    // Screens
    elements.screens = {
        splash: document.getElementById('splash-screen'),
        lobby: document.getElementById('lobby-screen'),
        roleReveal: document.getElementById('role-reveal-screen'),
        patternPhase: document.getElementById('pattern-phase-screen'),
        voting: document.getElementById('voting-phase-screen'),
        results: document.getElementById('results-screen'),
        gameEnd: document.getElementById('game-end-screen')
    };

    // Modals
    elements.modals = {
        createRoom: document.getElementById('create-room-modal'),
        joinRoom: document.getElementById('join-room-modal')
    };

    // Buttons
    elements.buttons = {
        createRoom: document.getElementById('create-room-btn'),
        joinRoom: document.getElementById('join-room-btn'),
        confirmCreate: document.getElementById('confirm-create-btn'),
        cancelCreate: document.getElementById('cancel-create-btn'),
        confirmJoin: document.getElementById('confirm-join-btn'),
        cancelJoin: document.getElementById('cancel-join-btn'),
        startGame: document.getElementById('start-game-btn'),
        ready: document.getElementById('ready-btn'),
        nextRound: document.getElementById('next-round-btn'),
        playAgain: document.getElementById('play-again-btn'),
        newGame: document.getElementById('new-game-btn')
    };

    // Inputs
    elements.inputs = {
        createPlayerName: document.getElementById('create-player-name-input'),
        roomCode: document.getElementById('room-code-input'),
        playerName: document.getElementById('player-name-input')
    };

    // Containers
    elements.containers = {
        players: document.getElementById('players-container'),
        patternGrid: document.getElementById('pattern-grid'),
        otherPatterns: document.getElementById('other-patterns-container'),
        votingPlayers: document.getElementById('voting-players-container'),
        finalRoles: document.getElementById('final-roles-container')
    };
}

/**
 * Get DOM element by category and name
 */
export function getElement(category, name) {
    return elements[category]?.[name];
}

/**
 * Get all elements in a category
 */
export function getElements(category) {
    return elements[category] || {};
}

/**
 * Show screen by name
 */
export function showScreen(screenName) {
    // Hide all screens
    Object.values(elements.screens).forEach(screen => {
        if (screen) screen.classList.remove('active');
    });
    
    // Map screen names to element keys
    const screenMap = {
        'splash-screen': 'splash',
        'lobby-screen': 'lobby', 
        'role-reveal-screen': 'roleReveal',
        'pattern-phase-screen': 'patternPhase',
        'voting-phase-screen': 'voting',
        'results-screen': 'results',
        'game-end-screen': 'gameEnd'
    };
    
    const elementKey = screenMap[screenName] || screenName;
    
    if (elements.screens[elementKey]) {
        elements.screens[elementKey].classList.add('active');
        console.log(`Switched to screen: ${screenName} (${elementKey})`);
    } else {
        console.error(`Screen not found: ${screenName}`);
    }
}

/**
 * Show modal by name
 */
export function showModal(modalName) {
    const modal = elements.modals[modalName];
    if (modal) {
        modal.classList.remove('hidden');
        // Focus on first input
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

/**
 * Hide modal by name
 */
export function hideModal(modalName) {
    const modal = elements.modals[modalName];
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Create element with classes and attributes
 */
export function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    
    if (options.className) {
        element.className = options.className;
    }
    
    if (options.id) {
        element.id = options.id;
    }
    
    if (options.innerHTML) {
        element.innerHTML = options.innerHTML;
    }
    
    if (options.textContent) {
        element.textContent = options.textContent;
    }
    
    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }
    
    if (options.dataset) {
        Object.entries(options.dataset).forEach(([key, value]) => {
            element.dataset[key] = value;
        });
    }
    
    return element;
}

/**
 * Clear container content
 */
export function clearContainer(containerName) {
    const container = elements.containers[containerName];
    if (container) {
        container.innerHTML = '';
    }
}

/**
 * Add event listener with automatic cleanup
 */
export function addEventHandler(element, event, handler, options = {}) {
    if (element && typeof handler === 'function') {
        element.addEventListener(event, handler, options);
        return () => element.removeEventListener(event, handler, options);
    }
    return null;
}
