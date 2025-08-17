/**
 * Socket Manager Module
 * Handles all socket.io communication with the server
 */

class SocketManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.callbacks = new Map();
    }

    initialize() {
        // Use current domain in production, localhost in development
        const serverUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : window.location.origin;
            
        this.socket = io(serverUrl);
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
        });

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Room events
        this.socket.on('roomCreated', (data) => {
            this.trigger('roomCreated', data);
        });

        this.socket.on('joinSuccess', (data) => {
            this.trigger('joinSuccess', data);
        });

        this.socket.on('joinError', (data) => {
            this.trigger('joinError', data);
        });

        this.socket.on('playerJoined', (data) => {
            this.trigger('playerJoined', data);
        });

        this.socket.on('playerLeft', (data) => {
            this.trigger('playerLeft', data);
        });

        // Game events
        this.socket.on('roleAssigned', (data) => {
            this.trigger('roleAssigned', data);
        });

        this.socket.on('patternSubmitted', (data) => {
            this.trigger('patternSubmitted', data);
        });

        this.socket.on('patternsComplete', (data) => {
            this.trigger('patternsComplete', data);
        });

        this.socket.on('voteSubmitted', (data) => {
            this.trigger('voteSubmitted', data);
        });

        this.socket.on('votingComplete', (data) => {
            this.trigger('votingComplete', data);
        });

        this.socket.on('nextRound', (data) => {
            this.trigger('nextRound', data);
        });

        this.socket.on('gameError', (data) => {
            this.trigger('gameError', data);
        });
    }

    // Event emitter pattern
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }

    off(event, callback) {
        if (this.callbacks.has(event)) {
            const callbacks = this.callbacks.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    trigger(event, data) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} callback:`, error);
                }
            });
        }
    }

    // Socket.io methods
    emit(event, data) {
        if (this.socket && this.isConnected) {
            this.socket.emit(event, data);
        } else {
            console.warn('Socket not connected, cannot emit:', event);
        }
    }

    // Game-specific methods
    createRoom(playerName) {
        this.emit('createRoom', { playerName });
    }

    joinRoom(roomCode, playerName) {
        this.emit('joinRoom', { roomCode, playerName });
    }

    startGame() {
        this.emit('startGame');
    }

    submitPattern(pattern) {
        this.emit('submitPattern', { pattern });
    }

    submitVote(votedPlayerId) {
        this.emit('submitVote', { votedPlayerId });
    }
}

// Create singleton instance
const socketManager = new SocketManager();

export default socketManager;
