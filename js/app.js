/**
 * Main Application Entry Point
 * Initializes and orchestrates all game modules
 */
import { initializeDOMElements, showScreen } from './utils/dom.js';
import { initializeEventHandlers } from './modules/eventHandlers.js';
import { gameState } from './modules/gameState.js';

/**
 * Application class to manage the entire game
 */
class MirrorWarsApp {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.initialized) return;

        try {
            console.log('🎮 Initializing Mirror Wars...');
            
            // Initialize DOM elements cache
            initializeDOMElements();
            console.log('✅ DOM elements cached');
            
            // Set up event handlers
            initializeEventHandlers();
            console.log('✅ Event handlers initialized');
            
            // Show initial screen
            showScreen('splash');
            console.log('✅ Initial screen displayed');
            
            this.initialized = true;
            console.log('🎉 Mirror Wars initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize Mirror Wars:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        // Show error message to user
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 9999;
            font-family: sans-serif;
        `;
        errorMessage.textContent = 'Failed to initialize game. Please refresh the page.';
        document.body.appendChild(errorMessage);
    }

    /**
     * Get current game state
     */
    getGameState() {
        return gameState.get();
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Clean up timers, event listeners, etc.
        console.log('🧹 Cleaning up Mirror Wars...');
        this.initialized = false;
    }
}

// Create and export app instance
export const app = new MirrorWarsApp();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    // DOM is already ready
    app.init();
}

// Make app globally available for debugging
if (typeof window !== 'undefined') {
    window.MirrorWarsApp = app;
}
