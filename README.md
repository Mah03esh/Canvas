# Real-Time Collaborative Drawing Canvas# Collaborative Canvas
A multi-user canvas where people can draw together in real time. Think shared whiteboard - everyone sees the same thing instantly.A real-time drawing app where multiple people can draw on the same canvas together. Built this to learn WebSockets and canvas rendering.

## Setup## What it does

```bash- **Draw stuff in real-time** - whatever you draw shows up instantly for everyone else

npm install- **Pick colors** - got 4 colors to choose from: black, red, blue, and green

node server/server.js- **Eraser tool** - click the eraser button to draw in white (basically erasing)

```- **Adjustable brush size** - slider goes from 1 to 50 pixels, works for both drawing and erasing

- **See who's online** - live user list in the top-right showing everyone connected

Open `http://localhost:3000` in your browser. Open multiple tabs to see the collaboration in action.- **Colored cursors** - each person gets a random color, their cursor shows up as a colored dot

- **Undo anything** - anyone can undo the last stroke (even if someone else drew it)

## Features- **Redo too** - bring back stuff that got undone

- **History sync** - when someone new joins, they see everything that's already been drawn (with the correct colors and widths)

**Drawing Tools**

- Brush and eraser## Getting started

- 8 colors (black, red, blue, green, yellow, orange, purple, cyan)

- Stroke width from 1-50 pixelsJust the usual:

- Keyboard shortcuts: `b` (brush), `e` (eraser), `Ctrl+Z` (undo), `Ctrl+Y` (redo)

```bash

**Real-time Sync**npm install

- See other users drawing as they draw (not after)npm start

- Every mouse movement sends a line segment to the server```

- Server broadcasts to all connected clients

- Client-side prediction makes it feel instantThen go to `http://localhost:3000` in your browser. Open a few tabs or windows to see the multi-user stuff work.



**User Management**## Stuff that needs fixing

- Login with username (required)

- See who's online in the user list- **User IDs are cryptic** - ~~The user list just shows the first 6 characters of the socket ID.~~ Actually this is fixed now with the username system, but keeping this note for historical context.

- Each user gets a random color

- Colored cursor dots show where everyone is drawing- **Gets slow with lots of strokes** - If there's like hundreds of lines drawn, undo/redo starts feeling sluggish. That's cause we redraw the entire canvas from scratch every time. Could probably optimize with some caching or layering but it works fine for now.

- Usernames appear next to cursors

- **Cursors are just dots** - They show the user's color and username which is nice, but actual cursor shapes or icons would be better.

**Undo/Redo**

- Global undo/redo (anyone can undo anyone's stroke)## What I used

- Server maintains drawing history

- When someone undos, everyone's canvas redraws from history- Node.js + Express (for the server)

- Keeps everyone perfectly in sync- Socket.io (WebSockets are way easier with this)

- HTML5 Canvas API (for the actual drawing)

## Testing Multi-User- Just vanilla JS with ES6 modules, no framework needed



1. Start the server## Time spent

2. Open `http://localhost:3000` in one tab

3. Enter a name (e.g. "Alice")Roughly 8-10 hours total, broken down like this:

4. Open another tab (or different browser)

5. Enter a different name (e.g. "Bob")- **Initial setup & basic drawing** (2 hours) - Got the canvas working, mouse events, basic line drawing

6. Draw in one window - it appears instantly in the other- **WebSocket integration** (2 hours) - Setting up Socket.io, real-time sync between clients

- **Tools & colors** (1.5 hours) - Color picker, eraser, stroke width slider

## Known Limitations- **Undo/redo system** (2 hours) - This was the trickiest part, figuring out the server-side history management

- **User management & cursors** (1.5 hours) - Colored cursors, user list, username system

**Performance**: After hundreds of strokes, undo/redo gets slower because the entire canvas redraws from scratch. Could optimize with layering or caching but works fine for typical use.- **UI polish** (1 hour) - Login modal, floating panels, keyboard shortcuts

- **Bug fixes & testing** (1 hour) - Race conditions, cursor updates, user list sync issues

**Canvas Resize**: Window resizing now preserves the drawing (fixed during development).

## Time Spent

Approximately 10 hours:

- Setup & basic drawing (2h)
- WebSocket integration (2h)
- Tools & UI (2h)
- Undo/redo system (2h) - hardest part
- User features (1.5h)
- Keyboard shortcuts & polish (0.5h)
- Bug fixes & testing (1h)

## Tech Stack

**Backend**: Node.js + Express + Socket.io
- Express for serving static files
- Socket.io makes WebSockets way easier than native WebSocket API
- Single server maintains source of truth

**Frontend**: Vanilla JavaScript + HTML5 Canvas
- No frameworks (per assignment requirements)
- ES6 modules for clean code organization
- Two canvas layers (one for drawings, one for cursors) for performance

**No Libraries**: All canvas operations hand-coded
- No Fabric.js or Paper.js
- Direct Canvas API usage
- Full control over rendering

## Architecture Highlights

**Server-Authoritative Design**
- Server stores all drawing history
- Server manages undo/redo stacks
- Clients are thin - they just render what server tells them
- Avoids complex conflict resolution

**Two-Canvas Approach**
- Bottom canvas: drawings (static until redraw)
- Top canvas: cursors (redrawn every frame)
- Cursors move constantly, but drawings don't
- Massive performance improvement vs single canvas

**Event Streaming**
- Each `mousemove` emits one line segment
- Format: `{x0, y0, x1, y1, color, lineWidth}`
- Server broadcasts immediately (no batching)
- Server also pushes to current stroke array

See `ARCHITECTURE.md` for detailed data flow and design decisions.

