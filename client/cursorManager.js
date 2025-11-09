// manages the remote cursor display on a separate canvas layer
export class CursorManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.cursors = {}; // stores cursor positions by user id
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

  updateCursor(userId, xPos, yPos, userColor, username) {
    this.cursors[userId] = { 
      x: xPos, 
      y: yPos, 
      color: userColor,
      username: username
    };
  }

  removeCursor(userId) {
    delete this.cursors[userId];
  }

  drawAllCursors() {
    // clear the layer first
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // draw each cursor as a colored dot with username
    const cursorList = Object.values(this.cursors);
    for (let i = 0; i < cursorList.length; i++) {
      const c = cursorList[i];
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
      this.ctx.fillStyle = c.color ? c.color : '#888'; // fallback color
      this.ctx.fill();
      
      // Draw username next to cursor
      this.ctx.fillStyle = '#000'; // Text color
      this.ctx.font = '12px Arial';
      this.ctx.fillText(c.username || 'Anonymous', c.x + 10, c.y + 5);
    }
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
