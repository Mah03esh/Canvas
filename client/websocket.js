// WebSocket handler - singleton pattern
class SocketClient {
  constructor() {
    this.socket = null;
    this.canvas = null;
    this.cursorManager = null;
    this.userList = null;
  }

  registerCanvas(canvasInstance) {
    this.canvas = canvasInstance;
  }

  registerCursorManager(manager) {
    this.cursorManager = manager;
  }

  registerUserList(list) {
    this.userList = list;
  }

  init(username) {
    return new Promise((resolve, reject) => {
      this.socket = io();
      
      this.socket.on('connect', () => {
        console.log('connected! my socket id is:', this.socket.id);
        // Register user with their name
        this.socket.emit('registerUser', username);
        resolve(); // Resolve promise when connected
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this.showConnectionError('Could not connect to server. Please check your connection.');
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('lost connection to server, reason:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          this.showConnectionError('Disconnected from server. Attempting to reconnect...');
        } else if (reason === 'transport close' || reason === 'ping timeout') {
          this.showConnectionError('Connection lost. Attempting to reconnect...');
        }
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected after', attemptNumber, 'attempts');
        this.hideConnectionError();
        this.showSuccessMessage('Reconnected to server!');
        // Request history again after reconnecting
        this.requestHistory();
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Reconnection attempt', attemptNumber);
        this.showConnectionError(`Reconnecting... (attempt ${attemptNumber})`);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('Reconnection failed');
        this.showConnectionError('Could not reconnect to server. Please refresh the page.');
      });

    // when someone else draws
    this.socket.on('drawing', (data) => {
      if (this.canvas) {
        this.canvas.renderLine(data.x0, data.y0, data.x1, data.y1, data.color, data.lineWidth);
      }
    });

    this.socket.on('stopDrawing', () => {
      if (this.canvas) {
        this.canvas.ctx.beginPath();
      }
    });

    // remote cursor updates
    this.socket.on('remoteCursor', (data) => {
      if (this.cursorManager) {
        this.cursorManager.updateCursor(data.id, data.x, data.y, data.color, data.username, data.state);
      }
    });

    this.socket.on('userDisconnected', (data) => {
      if (this.cursorManager) {
        this.cursorManager.removeCursor(data.id);
      }
    });

    // initial drawing history when we first connect
    this.socket.on('initialHistory', (hist) => {
      console.log('got initial history:', hist.length, 'strokes');
      if (this.canvas) {
        this.canvas.redrawFromHistory(hist);
      } else {
        console.log('ERROR: canvas not ready yet');
      }
    });

    // server tells us to redraw everything (undo/redo happened)
    this.socket.on('redrawAll', (hist) => {
      if (this.canvas) {
        this.canvas.redrawFromHistory(hist);
      }
    });

    // user list changed
    this.socket.on('updateUserList', (users) => {
      console.log('user list update, now', users.length, 'users online');
      console.log('userList object:', this.userList);
      console.log('users array:', users);
      if (this.userList) {
        this.userList.update(users);
      } else {
        console.log('WARNING: userList not registered yet!');
      }
    });
    });
  }

  emitDrawing(data) {
    this.socket.emit('drawing', data);
  }

  emitStopDrawing() {
    this.socket.emit('stopDrawing');
  }

  emitCursorMove(data) {
    this.socket.emit('cursorMove', data);
  }

  emitStartStroke(data) {
    this.socket.emit('startStroke', data);
  }

  emitUndo() {
    this.socket.emit('undo');
  }

  emitRedo() {
    this.socket.emit('redo');
  }

  requestHistory() {
    if (this.socket) {
      console.log('asking server for drawing history');
      this.socket.emit('requestHistory');
    }
  }

  showConnectionError(message) {
    let errorDiv = document.getElementById('connection-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'connection-error';
      errorDiv.className = 'connection-status error';
      document.body.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }

  hideConnectionError() {
    const errorDiv = document.getElementById('connection-error');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  showSuccessMessage(message) {
    let successDiv = document.getElementById('connection-success');
    if (!successDiv) {
      successDiv = document.createElement('div');
      successDiv.id = 'connection-success';
      successDiv.className = 'connection-status success';
      document.body.appendChild(successDiv);
    }
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      successDiv.style.display = 'none';
    }, 3000);
  }
}

export const socketClient = new SocketClient();
