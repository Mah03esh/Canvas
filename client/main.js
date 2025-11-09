import { Canvas } from './canvas.js';
import { socketClient } from './websocket.js';
import { CursorManager } from './cursorManager.js';
import { UserList } from './userList.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM ready, showing login.');
  
  const joinButton = document.getElementById('join-button');
  const usernameInput = document.getElementById('username-input');
  const loginOverlay = document.getElementById('login-overlay');

  // Function to handle joining
  const joinApp = () => {
    const username = usernameInput.value.trim();
    if (username === '') {
      alert('Please enter a name.');
      return;
    }

    // Hide the modal
    loginOverlay.style.display = 'none';

    // Start the app!
    initializeApp(username);
  };

  // Add listeners
  joinButton.addEventListener('click', joinApp);

  // Allow pressing 'Enter' to join
  usernameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      joinApp();
    }
  });
});

// Initialize the app after login
async function initializeApp(username) {
  console.log(`Initializing app for user: ${username}`);
  
  // Initialize main components
  const canvas = new Canvas('drawing-canvas');
  const cursorManager = new CursorManager('cursor-canvas');
  const userList = new UserList('user-list');
  
  // Wire everything together
  socketClient.registerCanvas(canvas);
  socketClient.registerCursorManager(cursorManager);
  socketClient.registerUserList(userList);
  canvas.registerCursorManager(cursorManager);
  cursorManager.init();
  
  try {
    // Wait for socket to connect before requesting history
    await socketClient.init(username);
    console.log('Socket connected, now requesting drawing history from server');
    socketClient.requestHistory();
  } catch (error) {
    console.error('Failed to connect to server:', error);
    alert('Could not connect to the server. Please check your connection and try again.');
    return;
  }

  // Color picker setup
  const colorButtons = document.querySelectorAll('.color-swatch');
  const eraserBtn = document.getElementById('tool-eraser');
  const brushButton = document.getElementById('tool-brush');
  const sizeSlider = document.getElementById('stroke-width');
  
  colorButtons.forEach((btn) => {
    btn.addEventListener('click', function() {
      const pickedColor = btn.dataset.color;
      canvas.setColor(pickedColor);

      // Update UI - deselect eraser and select brush
      eraserBtn.classList.remove('selected');
      brushButton?.classList.add('selected');

      // Deselect all colors then select this one
      colorButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Black is default
  document.getElementById('color-black')?.classList.add('selected');
  // Select brush by default
  brushButton?.classList.add('selected');

  // Eraser button
  eraserBtn.addEventListener('click', function() {
    canvas.setTool('eraser');
    eraserBtn.classList.add('selected');
    // De-select brush
    brushButton?.classList.remove('selected');

    // Deselect all colors
    document.querySelectorAll('.color-swatch').forEach(function(swatch) {
      swatch.classList.remove('selected');
    });
  });

  // Brush button
  brushButton?.addEventListener('click', () => {
    canvas.setTool('brush');
    brushButton.classList.add('selected');
    eraserBtn.classList.remove('selected');
    // Re-select last used color if available
    document.getElementById(`color-${canvas.lastColor}`)?.classList.add('selected');
  });

  // Brush size slider
  sizeSlider.addEventListener('input', function(evt) {
    const newSize = evt.target.value;
    canvas.setLineWidth(newSize);
  });
  
  // Undo/redo buttons
  const undoBtn = document.getElementById('undo-button');
  const redoBtn = document.getElementById('redo-button');

  undoBtn.addEventListener('click', function() {
    socketClient.emitUndo();
  });

  redoBtn.addEventListener('click', function() {
    socketClient.emitRedo();
  });

  // Global keyboard shortcuts
  window.addEventListener('keydown', (event) => {
    // Don't steal keypresses from input fields
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
      return;
    }

    // Tool switching shortcuts
    if (event.key === 'b') {
      brushButton?.click();
    }

    if (event.key === 'e') {
      eraserBtn?.click();
    }

    // Undo shortcut (Ctrl+Z or Cmd+Z)
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      event.preventDefault();
      undoBtn?.click();
    }

    // Redo shortcut (Ctrl+Y or Cmd+Y)
    if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
      event.preventDefault();
      redoBtn?.click();
    }
  });
}

