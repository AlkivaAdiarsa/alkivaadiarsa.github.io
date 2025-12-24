# Chess
## Files
```powershell
# modules may be used
Root
|> Index.html # Main file
|> Style.css # UI Styling
|> App.js # UI code
|> Main.js # Main loop
|- Chess_Manager /
|--> Chessboard.js # rendering and board layout
|--> Chess_moves.js # validating and applying moves
|--> special_action.js # special move detection and application - En Passant, Promote, Check, Checkmate, Stalemate, Win/lose
|--> chess_API.js # call moves, and for agents, get possible moves, get board layout
|--> Ui.js # text, promotion menu
```
## Board
- 8 x 8, 1 at the bottom and A at left edge
- White and Grayish Black
- canvas element
- canvas is 320*320
## Pieces
- Unicode chess pieces
- White side at bottom
- Black on top
- En Passant enabled
- Check, Checkmate, Stalemate, win/loss detection

## UI
**All UI for playing chess has to be all in main chessboard canvas**
## API
- call moves.  ``move("pawn", "e2", "e4")``
- agent: get current board state / layout ``GetBoardState()``, return board layout in array
- agent: get possible moves of piece: ``possibleMoves("pawn","e2")``

## How to run & test
- Open `index.html` in a modern browser (Chrome/Edge/Firefox).
- Open the Developer Console (F12) and use these helpers:
  - `runTests()` — runs the basic test suite and logs PASS/FAIL messages in the console.
  - `move(pieceName, from, to)` — perform a move, e.g. `move("pawn","e2","e4")`.
  - `GetBoardState()` — returns a 2D array of piece letters (upper-case white, lower-case black) or `null`.
  - `possibleMoves("pawn","e2")` — get possible moves for that piece.

Notes:
- Promotion is presented via an **in-canvas promotion menu**. Agents now show their promotion selection and apply it automatically.
- Castling (king-side and queen-side) is implemented and validated (including check/path validation).
- Controls: Keyboard arrow keys move a cursor; Enter selects and moves; Escape clears selection. The cursor is visible on the board.
- Agents: selectable players include `Human`, `Random`, `Minimax`, `RL`, `Neural`, `AlphaZero`, and `Stockfish` (Stockfish requires you to provide a browser stockfish build to `window.Stockfish`).
- To enable Stockfish: add a stockfish.js/wasm and expose a `Stockfish` constructor on `window` (I can add instructions for a specific build if you want).
- Headless automated testing (Node/jsdom) couldn't be run here because `node` is not available in the environment; open the page in a browser to run `runTests()` manually.

See `CHESS_API.md` for the API callable reference.



