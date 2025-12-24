# Chess API

This document lists the callable API functions exposed by the page for agents and automation.

Global helper functions (simple):

- move(pieceName, from, to)
  - Example: move("pawn","e2","e4")
  - Returns: true if move applied, false otherwise. Uses piece name (pawn, rook, knight, bishop, queen, king).

- GetBoardState()
  - Returns: 2D array [rankRows][files] of piece letters (upper-case = white, lower-case = black), or null in empty squares.
  - Example: GetBoardState()[7][4] === 'K' -> white king at e1.

- possibleMoves(pieceName, square)
  - Example: possibleMoves("pawn","e2") -> ['e3', 'e4']
  - Returns: array of legal destination squares for that piece on the given square.

Other programmatic hooks (via window):

- window._board — instance of `Chessboard` with methods:
  - `getPiece(square)`, `setPiece(square,piece)`, `removePiece(square)`, `applyPromotionChoice(choice)`, etc.
  - `pendingPromotion` property indicates a promotion menu is waiting.

- window._API — instance of `ChessAPI` exposing methods:
  - `move(pieceName, from, to)` — same as global helper
  - `movePiece(from, to)` — lower-level move by square
  - `GetBoardState()` — same as above
  - `possibleMoves(pieceName, square)` — same as above
  - `getStatus()` — returns a human-readable status string (e.g. 'ongoing', 'check', 'stalemate', 'checkmate (black wins)')
  - `getStatusObject()` — returns a structured object `{state, winner, inCheck}` for programmatic inspection
  - `getScore()` — returns `{white, black}` where `white` and `black` are cumulative capture scores (start at 0); capture values: pawn=1, knight=3, bishop=3, rook=5, queen=9
- `getMaterial()` — returns material evaluation `{white, black, diff}` based on current piece placement (useful for neural/AlphaZero evaluation)

Stockfish integration:
- To use Stockfish in the browser, place a browser build of Stockfish (e.g., stockfish.wasm+loader or stockfish.js) at `stockfish.js` and the code will attempt to create a Worker or factory with `Stockfish()`.
- Once loaded, pick `Stockfish` from the player selectors; the agent will send UCI `position` and `go movetime` commands to get `bestmove` replies.
- If you want, I can fetch a known Stockfish WebAssembly build and add it to the repo (it's ~1-4MB depending on build).


- window.GameManager — `GameManager` class available for automated play control
  - Create: `const gm = new GameManager(board, api, ui)`
  - `gm.setPlayers('human'|'random', 'human'|'random')`
  - `gm.newGame()` — resets board and applies player settings

Notes:
- Promotion is presented as an in-canvas menu. If an agent is playing and promotion occurs, the engine auto-promotes to queen unless overridden.
- Castling, en-passant, check, checkmate, and stalemate are supported.

Agents available via UI / programmatic control:

- `Random` — picks random legal moves.
- `Minimax` — depth-limited negamax with alpha-beta.
- `RL` — simple RL-style epsilon-greedy agent with a Q-table placeholder (no training built-in).
- `Neural` — a simple neural-evaluation agent using a tiny material-based evaluator (no training).
- `AlphaZero` — a lightweight AlphaZero-style MCTS agent that uses the `Neural` evaluator for leaf evaluation (prototype-level).
- `Stockfish` — stub wrapper; if you supply a `Stockfish` worker (stockfish.js/wasm) it will use it; otherwise it falls back to Random.

Notes:
- The RL/Neural/AlphaZero agents are **prototypes** implemented in plain JS for experimentation — they are not production-strength nor trained.
- To use Stockfish, download a browser build (e.g., stockfish.wasm or stockfish.js) and expose a `Stockfish` worker constructor on `window` before calling the agent; the wrapper will detect availability.

If you want, I can integrate a full Stockfish build and add training utilities for RL/AlphaZero, but that will require adding dependencies or WASM files to the project.