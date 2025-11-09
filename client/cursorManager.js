// manages the remote cursor display on a separate canvas layer
export class CursorManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.cursors = {}; // stores cursor positions by user id
    this.localCursor = { x: -100, y: -100, state: 'moving' }; // Local cursor
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));
    this.startRenderLoop();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  updateCursor(userId, xPos, yPos, userColor, username, state) {
    this.cursors[userId] = { 
      x: xPos, 
      y: yPos, 
      color: userColor,
      username: username,
      state: state
    };
  }

  removeCursor(userId) {
    delete this.cursors[userId];
  }

  updateLocalCursor(x, y, state) {
    this.localCursor.x = x;
    this.localCursor.y = y;
    this.localCursor.state = state;
  }

  drawCursor(cursor) {
    this.ctx.fillStyle = cursor.color || 'gray';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';

    if (cursor.state === 'drawing') {
      // Draw a filled circle (brush)
      this.ctx.beginPath();
      this.ctx.arc(cursor.x, cursor.y, 5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#000';
      if (cursor.username) {
        this.ctx.fillText(cursor.username, cursor.x + 10, cursor.y + 5);
      }

    } else if (cursor.state === 'erasing') {
      // Draw a white square with a border (eraser)
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.rect(cursor.x - 5, cursor.y - 5, 10, 10);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = '#000';
      if (cursor.username) {
        this.ctx.fillText(cursor.username, cursor.x + 10, cursor.y + 5);
      }

    } else {
      // Default 'moving' state: draw a small pointer
      this.ctx.beginPath();
      this.ctx.moveTo(cursor.x, cursor.y);
      this.ctx.lineTo(cursor.x + 10, cursor.y + 10);
      this.ctx.lineTo(cursor.x, cursor.y + 12);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.fillStyle = '#000';
      if (cursor.username) {
        this.ctx.fillText(cursor.username, cursor.x + 10, cursor.y + 12);
      }
    }
  }

  drawAllCursors() {
    // clear the layer first
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // draw each remote cursor
    Object.values(this.cursors).forEach(cursor => {
      this.drawCursor(cursor);
    });
    
    // draw local cursor
    this.drawCursor(this.localCursor);
  }

  startRenderLoop() {
    this.drawAllCursors();
    requestAnimationFrame(this.startRenderLoop.bind(this));
  }
}

// alternate names for compatibility
CursorManager.prototype.remoteCursors = {};
CursorManager.prototype.drawCursors = CursorManager.prototype.drawAllCursors;
CursorManager.prototype.renderLoop = CursorManager.prototype.startRenderLoop;
