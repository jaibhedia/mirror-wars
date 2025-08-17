const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files from current directory
app.use(express.static('.'));

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// In-memory storage (use database for production)
const rooms = new Map();
const players = new Map();

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Create room
    socket.on('createRoom', (data) => {
        const { playerName } = data;
        const roomCode = generateRoomCode();
        
        const room = {
            code: roomCode,
            host: socket.id,
            players: new Map(),
            gameState: 'lobby',
            createdAt: Date.now(),
            currentPhase: 'lobby',
            roundNumber: 0,
            votes: new Map(),
            patterns: new Map()
        };
        
        // Add host as first player
        const hostPlayer = {
            id: socket.id,
            name: playerName,
            role: null,
            pattern: [],
            eliminated: false,
            isHost: true
        };
        
        room.players.set(socket.id, hostPlayer);
        rooms.set(roomCode, room);
        players.set(socket.id, { roomCode, ...hostPlayer });
        
        socket.join(roomCode);
        
        socket.emit('roomCreated', { 
            roomCode, 
            isHost: true,
            players: Array.from(room.players.values())
        });
        
        console.log(`Room ${roomCode} created by ${playerName}`);
    });

    // Join room
    socket.on('joinRoom', (data) => {
        const { roomCode, playerName } = data;
        const room = rooms.get(roomCode);
        
        if (!room) {
            socket.emit('joinError', { message: 'Room not found' });
            return;
        }
        
        if (room.players.size >= 8) {
            socket.emit('joinError', { message: 'Room is full (max 8 players)' });
            return;
        }
        
        if (room.gameState !== 'lobby') {
            socket.emit('joinError', { message: 'Game already in progress' });
            return;
        }
        
        const player = {
            id: socket.id,
            name: playerName,
            role: null,
            pattern: [],
            eliminated: false,
            isHost: false
        };
        
        room.players.set(socket.id, player);
        players.set(socket.id, { roomCode, ...player });
        socket.join(roomCode);
        
        // Notify all players in room
        io.to(roomCode).emit('playerJoined', {
            players: Array.from(room.players.values()),
            newPlayer: player
        });
        
        // Send join success to the joining player
        socket.emit('joinSuccess', {
            roomCode,
            players: Array.from(room.players.values()),
            isHost: false
        });
        
        console.log(`${playerName} joined room ${roomCode}`);
    });

    // Start game
    socket.on('startGame', () => {
        const playerData = players.get(socket.id);
        if (!playerData) return;
        
        const room = rooms.get(playerData.roomCode);
        if (!room || room.host !== socket.id) return;
        
        if (room.players.size < 3) {
            socket.emit('gameError', { message: 'Need at least 3 players to start' });
            return;
        }
        
        // Assign roles
        const playerArray = Array.from(room.players.values());
        const roles = assignRoles(playerArray.length);
        
        playerArray.forEach((player, index) => {
            player.role = roles[index];
            room.players.set(player.id, player);
            players.set(player.id, { ...players.get(player.id), role: roles[index] });
        });
        
        room.gameState = 'roleReveal';
        room.currentPhase = 'roleReveal';
        
        // Send role assignments
        room.players.forEach((player) => {
            io.to(player.id).emit('roleAssigned', {
                role: player.role,
                players: Array.from(room.players.values()).map(p => ({
                    id: p.id,
                    name: p.name,
                    eliminated: p.eliminated
                })) // Don't send roles to other players
            });
        });
        
        console.log(`Game started in room ${playerData.roomCode}`);
    });

    // Submit pattern
    socket.on('submitPattern', (data) => {
        const { pattern } = data;
        const playerData = players.get(socket.id);
        if (!playerData) return;
        
        const room = rooms.get(playerData.roomCode);
        if (!room) return;
        
        const player = room.players.get(socket.id);
        if (player) {
            player.pattern = pattern;
            room.players.set(socket.id, player);
            room.patterns.set(socket.id, pattern);
            
            // Check if all players submitted patterns
            const activePlayers = Array.from(room.players.values()).filter(p => !p.eliminated);
            const submittedPatterns = Array.from(room.patterns.keys()).filter(id => 
                room.players.has(id) && !room.players.get(id).eliminated
            );
            
            if (submittedPatterns.length === activePlayers.length) {
                // All patterns submitted, move to voting
                room.currentPhase = 'voting';
                room.votes.clear();
                
                io.to(playerData.roomCode).emit('patternsComplete', {
                    players: Array.from(room.players.values()).map(p => ({
                        id: p.id,
                        name: p.name,
                        pattern: p.pattern,
                        eliminated: p.eliminated
                    }))
                });
            } else {
                // Notify pattern submitted
                io.to(playerData.roomCode).emit('patternSubmitted', {
                    playerId: socket.id,
                    submitted: submittedPatterns.length,
                    total: activePlayers.length
                });
            }
        }
    });

    // Submit vote
    socket.on('submitVote', (data) => {
        const { votedPlayerId } = data;
        const playerData = players.get(socket.id);
        if (!playerData) return;
        
        const room = rooms.get(playerData.roomCode);
        if (!room) return;
        
        room.votes.set(socket.id, votedPlayerId);
        
        // Check if all players voted
        const activePlayers = Array.from(room.players.values()).filter(p => !p.eliminated);
        const submittedVotes = Array.from(room.votes.keys()).filter(id => 
            room.players.has(id) && !room.players.get(id).eliminated
        );
        
        if (submittedVotes.length === activePlayers.length) {
            // Process votes
            const eliminatedPlayerId = processVotes(room.votes, room.players);
            
            if (eliminatedPlayerId) {
                const eliminatedPlayer = room.players.get(eliminatedPlayerId);
                eliminatedPlayer.eliminated = true;
                room.players.set(eliminatedPlayerId, eliminatedPlayer);
                
                // Check win condition
                const winResult = checkWinCondition(room.players);
                
                io.to(playerData.roomCode).emit('votingComplete', {
                    eliminatedPlayer: eliminatedPlayer,
                    votes: Object.fromEntries(room.votes),
                    players: Array.from(room.players.values()),
                    winResult
                });
                
                if (winResult) {
                    room.gameState = 'ended';
                } else {
                    // Start next round
                    room.roundNumber++;
                    room.currentPhase = 'pattern';
                    room.patterns.clear();
                    room.votes.clear();
                    
                    setTimeout(() => {
                        io.to(playerData.roomCode).emit('nextRound', {
                            roundNumber: room.roundNumber,
                            players: Array.from(room.players.values()).filter(p => !p.eliminated)
                        });
                    }, 5000);
                }
            }
        } else {
            // Notify vote submitted
            io.to(playerData.roomCode).emit('voteSubmitted', {
                submitted: submittedVotes.length,
                total: activePlayers.length
            });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        
        const playerData = players.get(socket.id);
        if (playerData) {
            const room = rooms.get(playerData.roomCode);
            if (room) {
                room.players.delete(socket.id);
                room.votes.delete(socket.id);
                room.patterns.delete(socket.id);
                
                if (room.players.size === 0) {
                    rooms.delete(playerData.roomCode);
                    console.log(`Room ${playerData.roomCode} deleted - no players`);
                } else {
                    // If host left, assign new host
                    if (room.host === socket.id) {
                        const remainingPlayers = Array.from(room.players.values());
                        if (remainingPlayers.length > 0) {
                            room.host = remainingPlayers[0].id;
                            remainingPlayers[0].isHost = true;
                            room.players.set(remainingPlayers[0].id, remainingPlayers[0]);
                        }
                    }
                    
                    io.to(playerData.roomCode).emit('playerLeft', {
                        playerId: socket.id,
                        players: Array.from(room.players.values())
                    });
                }
            }
        }
        players.delete(socket.id);
    });
});

// Helper functions
function generateRoomCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function assignRoles(playerCount) {
    const mirrorCount = Math.floor(playerCount * 0.3); // 30% mirrors
    const roles = [];
    
    // Add mirrors
    for (let i = 0; i < mirrorCount; i++) {
        roles.push('mirror');
    }
    
    // Add originals
    for (let i = 0; i < playerCount - mirrorCount; i++) {
        roles.push('original');
    }
    
    // Shuffle roles
    return shuffleArray(roles);
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function processVotes(votes, players) {
    const voteCounts = {};
    
    votes.forEach((votedPlayerId) => {
        voteCounts[votedPlayerId] = (voteCounts[votedPlayerId] || 0) + 1;
    });
    
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

function checkWinCondition(players) {
    const activePlayers = Array.from(players.values()).filter(p => !p.eliminated);
    const originals = activePlayers.filter(p => p.role === 'original');
    const mirrors = activePlayers.filter(p => p.role === 'mirror');
    
    if (mirrors.length === 0) {
        return { 
            winner: 'originals', 
            message: 'All Mirrors have been found! Originals win!' 
        };
    }
    
    if (mirrors.length >= originals.length) {
        return { 
            winner: 'mirrors', 
            message: 'Mirrors have taken over! Mirrors win!' 
        };
    }
    
    return null;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Mirror Wars server running on port ${PORT}`);
});
