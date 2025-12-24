// App: wire canvas events to Chessboard and API
const canvas = document.getElementById('chessboard');
const status = document.getElementById('status');
const board = new Chessboard(canvas);
let API = new ChessAPI(board);

board.draw();
status.textContent = API.getStatus();

let selected = null;
// Game Manager and UI
const ui = new Ui(board);
window._ui = ui;
const gm = new GameManager(board, API, ui);
window._gm = gm;

// init selectors
const whiteSel = document.getElementById('whitePlayer');
const blackSel = document.getElementById('blackPlayer');
const newBtn = document.getElementById('newGame');
const runTestsBtn = document.getElementById('runTestsBtn');
const minDepth = document.getElementById('minDepth');
const azRollouts = document.getElementById('azRollouts');

whiteSel.value = 'human'; blackSel.value = 'human';
whiteSel.addEventListener('change', ()=>{ gm.setPlayers(whiteSel.value, blackSel.value); gm.onTurn(); });
blackSel.addEventListener('change', ()=>{ gm.setPlayers(whiteSel.value, blackSel.value); gm.onTurn(); });
minDepth.addEventListener('input', ()=>{ gm.agents.minimax = new MinimaxAgent(API, parseInt(minDepth.value,10)); });
azRollouts.addEventListener('input', ()=>{ gm.agents.alphazero = new AlphaZeroAgent(API, parseInt(azRollouts.value,10)); });
newBtn.addEventListener('click', ()=>{ gm.newGame(); API = window._API; status.textContent = API.getStatus(); });
runTestsBtn.addEventListener('click', ()=>{ window.runTests(); });

gm.setPlayers(whiteSel.value, blackSel.value);

gm.newGame();
API = window._API; // keep local ref updated

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // If promotion pending, handle menu click
  if (board.pendingPromotion){
    const coord = board.squareToCoord(board.pendingPromotion.square);
    const menuW = board.squareSize * 2.2;
    const menuH = board.squareSize * 0.9;
    const mx = coord.col*board.squareSize + (board.squareSize - menuW)/2;
    const my = coord.row*board.squareSize - menuH - 6;
    if (x >= mx && x <= mx+menuW && y >= my && y <= my+menuH){
      const rel = x - mx - 8;
      const optW = (menuW-16)/4;
      const idx = Math.floor(rel / optW);
      const opts = ['Q','R','B','N'];
      const choice = opts[Math.max(0, Math.min(3, idx))];
      board.applyPromotionChoice(choice);
      board.draw();
      status.textContent = API.getStatus();
      gm.onTurn();
      return;
    }
  }

  const sq = board.pixelToSquare(x, y);
  if (!sq) return;

  // Normal selection/move flow
  const piece = board.getPiece(sq);
  // If there's a selection, attempt move
  if (selected) {
    const from = selected;
    const to = sq;
    const moved = API.movePiece(from, to);
    if (moved) {
      selected = null;
      board.clearHighlights();
      board.setSelection(null);
      board.draw();
      status.textContent = API.getStatus();
      gm.onTurn();
    } else {
      // change selection if own piece
      if (piece && piece.color === board.turn) {
        selected = sq;
        const moves = API.moves.possibleMovesFrom(selected);
        board.setHighlights(moves);
      } else {
        selected = null; board.clearHighlights();
      }
      board.setSelection(selected);
      board.draw();
    }
  } else {
    if (piece && piece.color === board.turn) {
      selected = sq;
      board.setSelection(selected);
      const moves = API.moves.possibleMovesFrom(selected);
      board.setHighlights(moves);
      board.draw();
    }
  }
});

// Keyboard cursor control
window.addEventListener('keydown', (ev) => {
  const key = ev.key;
  if (board.pendingPromotion){
    // allow q/r/b/n
    const pick = {'q':'Q','r':'R','b':'B','n':'N'}[key.toLowerCase()];
    if (pick){ board.applyPromotionChoice(pick); board.draw(); status.textContent = API.getStatus(); gm.onTurn(); }
    return;
  }
  const cur = board.squareToCoord(board.cursorSquare);
  let movedCursor = false;
  if (key === 'ArrowLeft'){ cur.col = Math.max(0, cur.col - 1); movedCursor = true; }
  else if (key === 'ArrowRight'){ cur.col = Math.min(7, cur.col + 1); movedCursor = true; }
  else if (key === 'ArrowUp'){ cur.row = Math.max(0, cur.row - 1); movedCursor = true; }
  else if (key === 'ArrowDown'){ cur.row = Math.min(7, cur.row + 1); movedCursor = true; }
  else if (key === 'Enter'){
    const sq = board.coordToSquare(cur.row, cur.col);
    const piece = board.getPiece(sq);
    if (selected){
      const moved = API.movePiece(selected, sq);
      if (moved){ selected = null; board.clearHighlights(); board.setSelection(null); board.draw(); status.textContent = API.getStatus(); gm.onTurn(); }
      else { if (piece && piece.color === board.turn){ selected = sq; board.setSelection(selected); board.setHighlights(API.moves.possibleMovesFrom(selected)); board.draw(); } }
    } else {
      if (piece && piece.color === board.turn){ selected = sq; board.setSelection(selected); board.setHighlights(API.moves.possibleMovesFrom(selected)); board.draw(); }
    }
  } else if (key === 'Escape' || key === ' '){ selected = null; board.clearHighlights(); board.setSelection(null); board.draw(); }

  if (movedCursor){
    board.setCursor(board.coordToSquare(cur.row, cur.col));
    board.draw();
  }
});

// expose for debug
window._board = board;
window._API = API;
window._gm = gm;
