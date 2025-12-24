class RandomAgent {
  constructor(api){ this.api = api; }
  pickMove(color){
    const moves = this.api.moves.allLegalMoves(color);
    if (!moves.length) return null;
    return moves[Math.floor(Math.random()*moves.length)];
  }
}

class MinimaxAgent {
  constructor(api, depth=2){ this.api = api; this.depth = depth; }

  pickMove(color){
    const moves = this.api.moves.allLegalMoves(color);
    if (!moves.length) return null;
    let best = null; let bestScore = -Infinity;
    for (const m of moves){
      // apply
      const ok = this.api.moves.move(m.from, m.to);
      if (!ok) continue;
      const score = -this.negamax(this.depth - 1, -Infinity, Infinity, this._opponent(color));
      // undo
      this.api.moves.undoMove();
      if (score > bestScore){ bestScore = score; best = m; }
    }
    return best;
  }

  _opponent(color){ return color === 'white' ? 'black' : 'white'; }

  negamax(depth, alpha, beta, color){
    if (depth === 0) return this.evaluate(color);
    const moves = this.api.moves.allLegalMoves(color);
    if (!moves.length) return this.evaluate(color);
    let max = -Infinity;
    for (const m of moves){
      if (!this.api.moves.move(m.from, m.to)) continue;
      const val = -this.negamax(depth -1, -beta, -alpha, this._opponent(color));
      this.api.moves.undoMove();
      if (val > max) max = val;
      if (val > alpha) alpha = val;
      if (alpha >= beta) break;
    }
    return max;
  }

  evaluate(color){
    // evaluation: captured score diff + material diff
    const scoreObj = this.api.getScore(); // {white,black,diff}
    const mat = this.api.special.evaluateMaterial(); // {white,black,diff}
    const combined = scoreObj.diff + mat.diff * 0.1; // material has less weight
    return color === 'white' ? combined : -combined;
  }
}

class RLAgent {
  constructor(api){ this.api = api; this.q = new Map(); this.epsilon = 0.15; }
  _stateKey(){ return JSON.stringify(this.api.GetBoardState()); }
  pickMove(color){
    const moves = this.api.moves.allLegalMoves(color); if (!moves.length) return null;
    // epsilon-greedy
    if (Math.random() < this.epsilon) return moves[Math.floor(Math.random()*moves.length)];
    // score by Q-values
    const key = this._stateKey(); let best = null; let bestV = -Infinity;
    for (const m of moves){ const k = `${key}|${m.from}-${m.to}`; const v = this.q.get(k) || 0; if (v > bestV){ bestV = v; best = m; }}
    return best || moves[Math.floor(Math.random()*moves.length)];
  }
  pickPromotion(color){
    return 'Q';
  }
}

class NeuralEval {
  constructor(seed=0){
    // simple linear weights for material features
    this.weights = {p:1,n:3,b:3,r:5,q:9};
    // small random bias
    this.bias = (Math.sin(seed+1) * 0.5);
  }
  evaluateMaterial(board){
    const vals = {'p':1,'n':3,'b':3,'r':5,'q':9}; let white=0,black=0;
    for (let r=0;r<8;r++) for (let c=0;c<8;c++){ const p = board[r][c]; if (!p) continue; const v = vals[p.type.toLowerCase()] || 0; if (p.color==='white') white+=v; else black+=v; }
    return (white - black) + this.bias;
  }
}

class NeuralAgent {
  constructor(api){ this.api = api; this.net = new NeuralEval(Math.random()); }
  pickMove(color){
    const moves = this.api.moves.allLegalMoves(color); if (!moves.length) return null;
    let best = null; let bestV = -Infinity;
    for (const m of moves){ if (!this.api.moves.move(m.from, m.to)) continue; const v = this.net.evaluateMaterial(this.api.moves.board.board); this.api.moves.undoMove(); if ((color==='white' && v>bestV) || (color==='black' && -v>bestV)){ bestV = color==='white'? v : -v; best = m; }}
    return best || moves[Math.floor(Math.random()*moves.length)];
  }
  pickPromotion(color){ return 'Q'; }
}

class AlphaZeroAgent {
  constructor(api, rollouts=10){ this.api = api; this.rollouts = rollouts; this.eval = new NeuralEval(Math.random()); }

  pickMove(color){
    const moves = this.api.moves.allLegalMoves(color); if (!moves.length) return null;
    const stats = new Map();
    // run playouts
    for (let i=0;i<this.rollouts;i++){
      const choice = moves[Math.floor(Math.random()*moves.length)];
      if (!this.api.moves.move(choice.from, choice.to)) continue;
      const v = this._simulatePlayout(this._opponent(color), 6);
      this.api.moves.undoMove();
      // accumulate
      const key = `${choice.from}-${choice.to}`;
      const s = stats.get(key) || {sum:0,n:0,move:choice}; s.sum += v; s.n += 1; stats.set(key,s);
    }
    // pick best average
    let best=null; let bestAvg=-Infinity;
    for (const [k,s] of stats.entries()){ const avg = s.sum / s.n; if (avg > bestAvg){ bestAvg = avg; best = s.move; }}
    return best || moves[0];
  }
  pickPromotion(color){
    // pick queen, but occasionally a knight for tactical value
    if (Math.random() < 0.1) return 'N';
    return 'Q';
  }

  _simulatePlayout(color, depth){
    if (depth<=0) return this.eval.evaluateMaterial(this.api.moves.board.board);
    const moves = this.api.moves.allLegalMoves(color);
    if (!moves.length) return this.eval.evaluateMaterial(this.api.moves.board.board);
    // make a random move
    const m = moves[Math.floor(Math.random()*moves.length)];
    if (!this.api.moves.move(m.from, m.to)) return 0;
    const v = this._simulatePlayout(this._opponent(color), depth-1);
    this.api.moves.undoMove();
    return v;
  }

  _opponent(color){ return color === 'white' ? 'black' : 'white'; }
}

class StockfishAgent {
  constructor(api){ this.api = api; this.worker = null; this.available = false; }
  async init(){
    // If user supplies a Stockfish.js that exposes a Stockfish() factory, use it
    if (window.Stockfish){ try{ this.worker = Stockfish(); this.available = true; this.worker.onmessage = (e)=>{ /* messages handled in pickMove */ }; return true; }catch(e){ console.warn('Stockfish factory found but failed to construct', e); } }
    // Try if a global Worker constructor is available for 'stockfish.js'
    try{
      this.worker = new Worker('stockfish.js');
      this.available = true;
      return true;
    }catch(e){ /* ignore */ }
    this.available = false; return false;
  }

  async pickMove(color){
    if (!this.available){ return new RandomAgent(this.api).pickMove(color); }
    const fen = this.api.getFEN();
    return await this._queryBestMoveFromEngine(fen);
  }

  _queryBestMoveFromEngine(fen){
    return new Promise((resolve)=>{
      let responded = false;
      const onmsg = (e) => {
        const data = (e.data || e);
        const text = (typeof data === 'string') ? data : (data.data||'');
        // parse bestmove lines
        if (text && text.includes('bestmove')){
          const m = text.split('bestmove')[1].trim().split(' ')[0];
          if (m && m.length >=4){
            const from = m.slice(0,2);
            const to = m.slice(2,4);
            // handle promotion if fifth char exists
            const promo = m.length >=5 ? m[4].toUpperCase() : null;
            resolve({from,to,promo}); responded = true;
            if (this.worker && this.worker.removeEventListener) this.worker.removeEventListener('message', onmsg);
          }
        }
      };

      if (this.worker.addEventListener){ this.worker.addEventListener('message', onmsg); }
      else if (this.worker.onmessage !== undefined){ this.worker.onmessage = onmsg; }

      // send commands
      const send = (cmd) => { try{ if (this.worker.postMessage) this.worker.postMessage(cmd); else if (this.worker.send) this.worker.send(cmd); }catch(e){ /* ignore */ } };
      send('uci');
      send(`position fen ${fen}`);
      send('go movetime 200');

      // fallback timeout
      setTimeout(()=>{ if (!responded){ // try to read bestmove by polling or fallback to random
          if (this.worker.removeEventListener) this.worker.removeEventListener('message', onmsg);
          const r = new RandomAgent(this.api).pickMove(color); resolve(r);
      } }, 700);
    });
  }

  pickPromotion(color){ return 'Q'; }
}

/**
 * OptimalAlphaBetaAgent
 * Builds upon the provided GameManager classes with advanced heuristics.
 */
class ChatGPTAgent {
    constructor(api, maxDepth = 4) {
        this.api = api;
        this.maxDepth = maxDepth;
        // Piece values in centipawns
        this.weights = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
        
        // Piece-Square Table for Knights (encourages center control)
        this.pst_n = [
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ];
    }

    pickMove(color) {
        let bestMove = null;
        // Iterative Deepening
        for (let d = 1; d <= this.maxDepth; d++) {
            const result = this.search(d, -Infinity, Infinity, color, true);
            if (result.move) bestMove = result.move;
        }
        return bestMove;
    }

    // Negamax with Alpha-Beta Pruning
    search(depth, alpha, beta, color, isRoot = false) {
        if (depth === 0) return { score: this.evaluate(color) };

        let moves = this.api.moves.allLegalMoves(color);
        if (moves.length === 0) {
            // use existing isInCheck method
            return { score: this.api.moves.isInCheck(color) ? -100000 : 0 };
        }

        // Move Ordering: Sort captures first (MVV-LVA) by inspecting target square
        moves.sort((a, b) => this._moveCaptureValue(b) - this._moveCaptureValue(a));


        let bestMove = null;
        let maxEval = -Infinity;

        for (const m of moves) {
            this.api.moves.move(m.from, m.to); // Apply move
            const evalResult = -this.search(depth - 1, -beta, -alpha, this.opponent(color)).score;
            this.api.moves.undoMove(); // Undo move

            if (evalResult > maxEval) {
                maxEval = evalResult;
                bestMove = m;
            }
            alpha = Math.max(alpha, evalResult);
            if (beta <= alpha) break; // Alpha-beta cutoff
        }

        return { score: maxEval, move: bestMove };
    }

    _moveCaptureValue(move){
        const target = this.api.moves.board.getPiece(move.to);
        if (!target) return 0;
        return this.weights[target.type.toLowerCase()] || 0;
    }

    evaluate(color) {
        const board = this.api.GetBoardState();
        let total = 0;
        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const piece = board[r][f];
                if (!piece) continue;
                const isWhite = piece === piece.toUpperCase();
                const type = piece.toLowerCase();
                let score = this.weights[type] || 0;

                // Add PST bonus for Knights
                if (type === 'n') score += this.pst_n[isWhite ? 7 - r : r][f];

                total += (isWhite === (color === 'white')) ? score : -score;
            }
        }
        return total;
    }

    opponent(c) { return c === 'white' ? 'black' : 'white'; }
    opponent(c) { return c === 'white' ? 'black' : 'white'; }
}



class GameManager {
  constructor(board, api, ui){
    this.board = board; this.api = api; this.ui = ui;
    this.players = {white: 'human', black: 'human'};
    this.agents = {random: new RandomAgent(api), minimax: new MinimaxAgent(api,2), rl: new RLAgent(api), neural: new NeuralAgent(api), alphazero: new AlphaZeroAgent(api,10), chatgpt: new ChatGPTAgent(api), stockfish: new StockfishAgent(api)};
    this.running = false;
    this.autoPlayDelay = 350;
    this._pendingTimeout = null;
  }

  setPlayers(white, black){ this.players.white = white; this.players.black = black; }

  newGame(){
    this.board.initPosition(); this.board.clearHighlights(); this.board.setSelection(null);
    this.board.clearPendingPromotion();
    this.board.turn = 'white';
    this.api = new ChessAPI(this.board); // refresh API link
    window._API = this.api;
    // rebind agents to new API instance preserving config
    const minimaxDepth = (this.agents.minimax && this.agents.minimax.depth) || 2;
    const azRollouts = (this.agents.alphazero && this.agents.alphazero.rollouts) || 10;
    this.agents = { random: new RandomAgent(this.api), minimax: new MinimaxAgent(this.api,minimaxDepth), rl: new RLAgent(this.api), neural: new NeuralAgent(this.api), alphazero: new AlphaZeroAgent(this.api, azRollouts), stockfish: new StockfishAgent(this.api) };

    this.board.draw();
    this.onTurn();
  }

  onTurn(){
    // Check for end game
    const state = this.api.special.detectGameState();
    if (state.state === 'checkmate' || state.state === 'stalemate'){
      const s = document.getElementById('status'); if (s) s.textContent = (state.state === 'checkmate') ? `Checkmate - ${state.winner} wins` : 'Stalemate';
      // stop any further agent moves
      clearTimeout(this._pendingTimeout);
      return;
    }

    // if promotion pending, handle according to player type
    if (this.board.pendingPromotion){
      const color = this.board.pendingPromotion.color;
      const player = this.players[color];
      if (player !== 'human'){
        // ask agent for promotion choice if available
        const agent = this.agents[player];
        const choice = (agent && agent.pickPromotion) ? agent.pickPromotion(color) : 'Q';
        // show chosen option in UI briefly
        this.board.pendingPromotionChoice = choice;
        this.board.draw();
        setTimeout(()=>{
          this.board.applyPromotionChoice(choice);
          this.board.pendingPromotionChoice = null;
          this.board.draw();
          const s = document.getElementById('status'); if (s) s.textContent = this.api.getStatus();
          this.onTurn();
        }, 400);
      }
      return;
    }

    const color = this.board.turn;
    const player = this.players[color];
    if (player === 'human') return;
    // agent's move (supports Promise or sync return)
    clearTimeout(this._pendingTimeout);
    this._pendingTimeout = setTimeout(async ()=>{
      const agent = this.agents[player];
      if (!agent) return;
      let move = null;
      try{
        move = await agent.pickMove(color);
      }catch(e){ console.error('Agent pickMove failed', e); }
      if (!move) return;
      // if engine returns promo char, apply via move with promotion if supported
      if (move.promo){
        this.api.moves.move(move.from, move.to);
        this.board.setPendingPromotion(move.to, color);
        this.board.pendingPromotionChoice = move.promo;
        // apply immediately
        this.board.applyPromotionChoice(move.promo);
      } else {
        this.api.movePiece(move.from, move.to);
      }
      this.board.clearHighlights(); this.board.draw();
      // update status display if present
      const s = document.getElementById('status'); if (s) s.textContent = this.api.getStatus();
      this.onTurn();
    }, this.autoPlayDelay);
  }
}

window.GameManager = GameManager; window.RandomAgent = RandomAgent; window.MinimaxAgent = MinimaxAgent; window.RLAgent = RLAgent; window.NeuralAgent = NeuralAgent; window.AlphaZeroAgent = AlphaZeroAgent; window.StockfishAgent = StockfishAgent;