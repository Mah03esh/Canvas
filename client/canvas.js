import { socketClient } from './websocket.js';

export class Canvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.drawing = false;
    this.prevX = 0; 
    this.prevY = 0; 
    this.currentColor = 'black';
    this.activeTool = 'brush';
    this.savedColor = 'black'; // remember what color they had before eraser
    this.brushSize = 5;
    this.cachedHistory = []; // cache drawing history for resize
    this.cursorState = 'moving'; // Track cursor state
    this.cursorManager = null; // Reference to cursor manager
    this.init();
  }

  init() {
    this.resizeCanvas();
    this.setupEventListeners();
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }

  resizeCanvas() {
    // Save current dimensions
    const oldWidth = this.canvas.width;
    const oldHeight = this.canvas.height;
    
    // Resize canvas
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Also resize the cursor overlay
    const cursorCanvas = document.getElementById('cursor-canvas');
    if (cursorCanvas) {
      cursorCanvas.width = window.innerWidth;
      cursorCanvas.height = window.innerHeight;
    }
    
    // Redraw from cached history if we have it
    if (this.cachedHistory && this.cachedHistory.length > 0) {
      this.redrawFromHistory(this.cachedHistory);
    }
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.beginDrawing.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.endDrawing.bind(this));
  }

  beginDrawing(e) {
    this.drawing = true;
    this.prevX = e.clientX;
    this.prevY = e.clientY;
    
    // Set cursor state based on tool
    this.cursorState = (this.activeTool === 'eraser') ? 'erasing' : 'drawing';
    
    // Update local cursor state
    if (this.cursorManager) {
      this.cursorManager.updateLocalCursor(e.clientX, e.clientY, this.cursorState);
    }
    
    socketClient.emitStartStroke({ 
      color: this.currentColor, 
      lineWidth: this.brushSize 
    });
  }

  handleMouseMove(e) {
    // Track current mouse position
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    
    // always send cursor position with state
    socketClient.emitCursorMove({ 
      x: e.clientX, 
      y: e.clientY, 
      state: this.cursorState 
    });
    
    // Update local cursor in cursor manager
    if (this.cursorManager) {
      this.cursorManager.updateLocalCursor(e.clientX, e.clientY, this.cursorState);
    }
    
    if (this.drawing) {
      this.drawSegment(e);
    }
  }

  drawSegment(e) {
    if (!this.drawing) return;

    const x = e.clientX;
    const y = e.clientY;
    
    const segmentData = {
      x0: this.prevX,
      y0: this.prevY,
      x1: x,
      y1: y,
      color: this.currentColor,
      lineWidth: this.brushSize
    };
    
    socketClient.emitDrawing(segmentData);
    this.renderLine(this.prevX, this.prevY, x, y, this.currentColor, this.brushSize);
    
    // update position for next segment
    this.prevX = x;
    this.prevY = y;
  }

  renderLine(x0, y0, x1, y1, col, width) {
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = col;
    this.ctx.beginPath();
    this.ctx.moveTo(x0, y0);
    this.ctx.lineTo(x1, y1);
    this.ctx.stroke();
  }

  changeColor(col) {
    this.currentColor = col;
    this.savedColor = col;
    this.activeTool = 'brush'; // switching color means back to brush mode
    console.log('switched to color:', col);
  }

  switchTool(toolName) {
    this.activeTool = toolName;
    
    if (toolName === 'eraser') {
      // eraser = drawing in white
      this.savedColor = this.currentColor;
      this.currentColor = '#FFFFFF';
    } else if (toolName === 'brush') {
      // restore previous color
      this.currentColor = this.savedColor;
    }
    console.log('tool changed to:', toolName);
  }

  updateBrushSize(size) {
    this.brushSize = parseInt(size, 10);
  }

  wipeCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  redrawFromHistory(strokeArray) {
    console.log('redrawing', strokeArray.length, 'strokes');
    
    // Cache the history for resize events
    this.cachedHistory = strokeArray;
    
    this.wipeCanvas();
    
    // go through each saved stroke
    for (let s = 0; s < strokeArray.length; s++) {
      const stroke = strokeArray[s];
      
      this.ctx.strokeStyle = stroke.color;
      this.ctx.lineWidth = stroke.lineWidth;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      
      // connect all the points
      for (let p = 0; p < stroke.points.length; p++) {
        const pt = stroke.points[p];
        if (p === 0) {
          this.ctx.moveTo(pt.x0, pt.y0);
        }
        this.ctx.lineTo(pt.x1, pt.y1);
      }
      
      this.ctx.stroke();
    }
  }

  endDrawing() {
    this.drawing = false;
    this.cursorState = 'moving'; // Reset state when stopping
    
    // Update local cursor state
    if (this.cursorManager) {
      this.cursorManager.updateLocalCursor(this.mouseX, this.mouseY, this.cursorState);
    }
    
    socketClient.emitStopDrawing();
    this.ctx.beginPath();
  }

  registerCursorManager(manager) {
    this.cursorManager = manager;
  }
}

// aliasing some method names for the external calls
Canvas.prototype.setColor = Canvas.prototype.changeColor;
Canvas.prototype.setTool = Canvas.prototype.switchTool;
Canvas.prototype.setLineWidth = Canvas.prototype.updateBrushSize;
Canvas.prototype.clearCanvas = Canvas.prototype.wipeCanvas;
Canvas.prototype.isDrawing = false;
Canvas.prototype.mouseX = 0;
Canvas.prototype.mouseY = 0;
