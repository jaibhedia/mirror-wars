/**
 * Game Logic Module
 * Contains core game mechanics and rules
 */
import { CONFIG, ROLES } from './config.js';
import { shuffleArray } from '../utils/helpers.js';

/**
 * Assign roles to players
 */
export function assignRoles(playerCount) {
    const mirrorCount = Math.floor(playerCount * CONFIG.mirrorRatio);
    const roles = [];
    
    // Add mirrors
    for (let i = 0; i < mirrorCount; i++) {
        roles.push(ROLES.MIRROR);
    }
    
    // Add originals
    for (let i = 0; i < playerCount - mirrorCount; i++) {
        roles.push(ROLES.ORIGINAL);
    }
    
    // Shuffle roles
    return shuffleArray(roles);
}

/**
 * Check win condition
 */
export function checkWinCondition(players) {
    const activePlayers = Object.values(players).filter(p => !p.eliminated);
    const originals = activePlayers.filter(p => p.role === ROLES.ORIGINAL);
    const mirrors = activePlayers.filter(p => p.role === ROLES.MIRROR);
    
    if (mirrors.length === 0) {
        return { 
            winner: 'originals', 
            message: 'All Mirrors have been found!' 
        };
    }
    
    if (mirrors.length >= originals.length) {
        return { 
            winner: 'mirrors', 
            message: 'Mirrors have taken over!' 
        };
    }
    
    return null;
}

/**
 * Process voting results
 */
export function processVotes(votes, players) {
    // Count votes
    const voteCounts = {};
    Object.values(votes).forEach(vote => {
        voteCounts[vote] = (voteCounts[vote] || 0) + 1;
    });
    
    // Find player with most votes
    let eliminatedPlayerId = null;
    let maxVotes = 0;
    const tiedPlayers = [];
    
    Object.entries(voteCounts).forEach(([playerId, count]) => {
        if (count > maxVotes) {
            maxVotes = count;
            eliminatedPlayerId = playerId;
            tiedPlayers.length = 0;
            tiedPlayers.push(playerId);
        } else if (count === maxVotes) {
            tiedPlayers.push(playerId);
        }
    });
    
    // Handle ties randomly
    if (tiedPlayers.length > 1) {
        eliminatedPlayerId = tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];
    }
    
    return eliminatedPlayerId;
}

/**
 * Calculate pattern similarity score
 */
export function calculatePatternSimilarity(pattern1, pattern2) {
    if (!pattern1 || !pattern2) return 0;
    
    const maxLength = Math.max(pattern1.length, pattern2.length);
    if (maxLength === 0) return 1;
    
    let matches = 0;
    const minLength = Math.min(pattern1.length, pattern2.length);
    
    for (let i = 0; i < minLength; i++) {
        if (pattern1[i] === pattern2[i]) {
            matches++;
        }
    }
    
    return matches / maxLength;
}

/**
 * Analyze patterns for suspicion levels
 */
export function analyzePatterns(players) {
    const playerIds = Object.keys(players);
    const suspicionLevels = {};
    
    playerIds.forEach(playerId => {
        suspicionLevels[playerId] = 0;
        const playerPattern = players[playerId].pattern || [];
        
        // Compare with other players
        playerIds.forEach(otherPlayerId => {
            if (playerId !== otherPlayerId) {
                const otherPattern = players[otherPlayerId].pattern || [];
                const similarity = calculatePatternSimilarity(playerPattern, otherPattern);
                suspicionLevels[playerId] += similarity;
            }
        });
        
        // Normalize by number of comparisons
        if (playerIds.length > 1) {
            suspicionLevels[playerId] /= (playerIds.length - 1);
        }
    });
    
    return suspicionLevels;
}

/**
 * Generate pattern suggestions for mirrors
 */
export function generateMirrorSuggestions(players, currentPlayerId) {
    const otherPlayers = Object.values(players).filter(p => 
        p.id !== currentPlayerId && !p.eliminated && p.pattern && p.pattern.length > 0
    );
    
    if (otherPlayers.length === 0) return [];
    
    // Return patterns from other players as suggestions
    return otherPlayers.map(player => ({
        playerId: player.id,
        playerName: player.name,
        pattern: player.pattern,
        suggestion: `Copy ${player.name}'s pattern`
    }));
}
