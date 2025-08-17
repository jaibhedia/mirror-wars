/**
 * Utility Functions Module
 * Contains helper functions used throughout the application
 */

/**
 * Generate a random 4-digit room code
 */
export function generateRoomCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generate a unique player ID
 */
export function generatePlayerId() {
    return Math.random().toString(36).substr(2, 9);
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm
 */
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Debounce function calls
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Format time in MM:SS format
 */
export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Validate player name
 */
export function validatePlayerName(name) {
    return name && name.trim().length >= 2 && name.trim().length <= 20;
}

/**
 * Validate room code
 */
export function validateRoomCode(code) {
    return /^\d{4}$/.test(code);
}
