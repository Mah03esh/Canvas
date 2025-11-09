// Server setup for collaborative drawing app
// using express + socket.io

const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);
const PORT = 3000;

// storing all drawing data here
let drawingHistory = [];
let redoHistory = [];
let activeUsers = {}; // tracks who's online

// generates a random bright color for each user
function getRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 100%, 75%)`;
}

app.use(express.static(path.join(__dirname, '../client')));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  console.log('Current drawing history length:', drawingHistory.length);

  // assign each user a color when they join
  const userColor = getRandomColor();
  
  // Listen for user registration
  socket.on('registerUser', (username) => {
    // Now we add the user with their name
    activeUsers[socket.id] = {
      id: socket.id,
      color: userColor,
      username: username
    };
    console.log(username, 'has registered with color', userColor);
    console.log('Total active users:', Object.keys(activeUsers).length);
    console.log('Active user IDs:', Object.keys(activeUsers));
    
    // Tell everyone about the updated user list
    io.emit('updateUserList', Object.values(activeUsers));
    
    // Send history to this user
    socket.emit('initialHistory', drawingHistory);
  });

  socket.on('requestHistory', () => {
    console.log('Client', socket.id, 'requested history');
    socket.emit('initialHistory', drawingHistory);
  });

  socket.on('startStroke', (data) => {
    redoHistory = []; // new stroke means can't redo anymore
    socket.currentStroke = {
      color: data.color,
      lineWidth: data.lineWidth,
      points: []
    };
  });

  socket.on('drawing', (data) => {
    // relay drawing data to everyone else
    socket.broadcast.emit('drawing', data);
    
    if (socket.currentStroke) {
      socket.currentStroke.points.push(data);
    }
  });

  socket.on('stopDrawing', () => {
    socket.broadcast.emit('stopDrawing');
    
    // save the completed stroke
    if (socket.currentStroke && socket.currentStroke.points.length > 0) {
      drawingHistory.push(socket.currentStroke);
      console.log('Stroke saved to history. Total strokes:', drawingHistory.length);
    }
    socket.currentStroke = null;
  });

  socket.on('undo', () => {
    if (drawingHistory.length > 0) {
      console.log('Popping last stroke for undo.');
      const undoneStroke = drawingHistory.pop();
      redoHistory.push(undoneStroke);
      io.emit('redrawAll', drawingHistory);
    }
  });

  socket.on('redo', () => {
    if (redoHistory.length > 0) {
      console.log('Pushing stroke back for redo.');
      const redoneStroke = redoHistory.pop();
      drawingHistory.push(redoneStroke);
      io.emit('redrawAll', drawingHistory);
    }
  });

  socket.on('cursorMove', (data) => {
    // broadcast cursor position with user's color, username, and state
    // If the user hasn't registered yet, ignore cursor updates to avoid errors
    const user = activeUsers[socket.id];
    if (!user) {
      return;
    }

    socket.broadcast.emit('remoteCursor', {
      id: socket.id,
      x: data.x,
      y: data.y,
      color: user.color,
      username: user.username,
      state: data.state
    });
  });

  socket.on('disconnect', () => {
    // remove user from active list
    console.log('User disconnecting:', socket.id);
    delete activeUsers[socket.id];
    console.log('Remaining active users:', Object.keys(activeUsers).length);
    console.log('Remaining user IDs:', Object.keys(activeUsers));
    io.emit('updateUserList', Object.values(activeUsers));
    io.emit('userDisconnected', { id: socket.id });
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log('Server running on port 3000');
});
