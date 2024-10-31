import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Initialize SQLite database
const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error('Database initialization error:', err);
  }
  console.log('Connected to in-memory SQLite database');
  initializeDatabase();
});

// Initialize database tables and sample data
function initializeDatabase() {
  db.serialize(() => {
    // Create tables
    db.run(`CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      name TEXT,
      fingerprintId TEXT UNIQUE,
      role TEXT DEFAULT 'voter'
    )`);

    db.run(`CREATE TABLE candidates (
      id INTEGER PRIMARY KEY,
      name TEXT,
      party TEXT,
      image TEXT
    )`);

    db.run(`CREATE TABLE votes (
      id INTEGER PRIMARY KEY,
      userId INTEGER,
      candidateId INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(candidateId) REFERENCES candidates(id)
    )`);

    // Insert sample candidates
    const candidates = [
      {
        name: "Jane Smith",
        party: "Progressive Party",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800&h=600"
      },
      {
        name: "John Davis",
        party: "Conservative Party",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800&h=600"
      }
    ];

    candidates.forEach(candidate => {
      db.run('INSERT INTO candidates (name, party, image) VALUES (?, ?, ?)',
        [candidate.name, candidate.party, candidate.image]);
    });
  });
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');

  // Fingerprint verification
  socket.on('verify_fingerprint', ({ fingerprintId }, callback) => {
    db.get('SELECT * FROM users WHERE fingerprintId = ?', [fingerprintId], (err, user) => {
      if (err) {
        callback({ success: false, message: 'Database error' });
        return;
      }

      if (!user) {
        // For demo purposes, create a new user if fingerprint is not found
        db.run('INSERT INTO users (name, fingerprintId) VALUES (?, ?)',
          [`Voter ${Math.floor(Math.random() * 1000)}`, fingerprintId],
          function(err) {
            if (err) {
              callback({ success: false, message: 'Failed to create user' });
              return;
            }
            
            db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, newUser) => {
              if (err) {
                callback({ success: false, message: 'Failed to retrieve user' });
                return;
              }
              callback({ success: true, user: newUser });
            });
          }
        );
      } else {
        callback({ success: true, user });
      }
    });
  });

  // Get candidates
  socket.on('get_candidates', (callback) => {
    db.all('SELECT * FROM candidates', (err, candidates) => {
      if (err) {
        callback({ success: false, message: 'Failed to fetch candidates' });
        return;
      }
      callback({ success: true, candidates });
    });
  });

  // Check if user has voted
  socket.on('check_vote_status', ({ userId }, callback) => {
    db.get('SELECT * FROM votes WHERE userId = ?', [userId], (err, vote) => {
      if (err) {
        callback({ success: false, hasVoted: false });
        return;
      }
      callback({ success: true, hasVoted: !!vote });
    });
  });

  // Cast vote
  socket.on('cast_vote', ({ userId, candidateId, fingerprintId }, callback) => {
    // Verify user and check if already voted
    db.get('SELECT * FROM votes WHERE userId = ?', [userId], (err, existingVote) => {
      if (err) {
        callback({ success: false, message: 'Database error' });
        return;
      }

      if (existingVote) {
        callback({ success: false, message: 'You have already voted' });
        return;
      }

      // Record the vote
      db.run('INSERT INTO votes (userId, candidateId) VALUES (?, ?)',
        [userId, candidateId],
        (err) => {
          if (err) {
            callback({ success: false, message: 'Failed to record vote' });
            return;
          }

          // Update voting stats for all clients
          updateVotingStats();
          callback({ success: true });
        }
      );
    });
  });

  // Get voting statistics
  socket.on('get_voting_stats', (callback) => {
    updateVotingStats(callback);
  });
});

// Helper function to update voting statistics
function updateVotingStats(callback = null) {
  db.all(`
    SELECT 
      c.*,
      COUNT(v.id) as votes
    FROM candidates c
    LEFT JOIN votes v ON c.id = v.candidateId
    GROUP BY c.id
  `, (err, candidates) => {
    if (err) {
      if (callback) callback({ success: false, message: 'Failed to fetch statistics' });
      return;
    }

    db.get('SELECT COUNT(*) as count FROM users', (err, { count: totalVoters }) => {
      if (err) {
        if (callback) callback({ success: false, message: 'Failed to count voters' });
        return;
      }

      db.get('SELECT COUNT(*) as count FROM votes', (err, { count: votesCount }) => {
        if (err) {
          if (callback) callback({ success: false, message: 'Failed to count votes' });
          return;
        }

        const stats = {
          totalVoters,
          votesCount,
          candidates
        };

        // Emit to all clients
        io.emit('stats_update', stats);

        // If callback exists (initial request), send response
        if (callback) callback({ success: true, stats });
      });
    });
  });
}

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});