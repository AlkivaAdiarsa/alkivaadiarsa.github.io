class ChessAPI {
  constructor(board){
    this.board = board;
    this.moves = new ChessMoves(this.board);
    this.special = new SpecialAction(this.board, this.moves);
  }

  // Public API expected by instructions: move("pawn","e2","e4")
  move(pieceName, from, to){
    // normalize pieceName -> single char
    const map = {pawn:'p',rook:'r',knight:'n',bishop:'b',queen:'q',king:'k'};
    const desired = map[pieceName.toLowerCase()];
    const piece = this.board.getPiece(from);
    if (!piece) return false;
    if (piece.type.toLowerCase() !== desired) return false;
    return this.movePiece(from,to);
  }

  movePiece(from,to){
    const ok = this.moves.move(from,to);
    if (!ok) return false;
    // post move handling: promotion is handled via board.pendingPromotion / UI

    // detect game state
    this.lastState = this.special.detectGameState();
    return true;
  }

  GetBoardState(){
    // return a copy as array of rows with piece letters or null
    return this.board.board.map(row => row.map(cell => cell ? cell.type : null));
  }

  getFEN(){
    // builds a simple FEN string from current board (no halfmove/fullmove tracking accuracy)
    const rows = [];
    for (let r=0;r<8;r++){
      let empty = 0; let rowStr = '';
      for (let c=0;c<8;c++){
        const p = this.board.board[r][c];
        if (!p) { empty++; }
        else { if (empty>0){ rowStr += empty; empty=0; } rowStr += p.type; }
      }
      if (empty>0) rowStr += empty;
      rows.push(rowStr);
    }
    const piecePlacement = rows.join('/');
    const active = this.board.turn === 'white' ? 'w' : 'b';
    // castling rights (simple: check moved flags)
    let cast = '';
    const wKing = this.board.findKing('white');
    const wKR = this.board.getPiece('h1');
    const wQR = this.board.getPiece('a1');
    const bKing = this.board.findKing('black');
    const bKR = this.board.getPiece('h8');
    const bQR = this.board.getPiece('a8');
    if (wKing){ if (wKR && !wKR.moved) cast += 'K'; if (wQR && !wQR.moved) cast += 'Q'; }
    if (bKing){ if (bKR && !bKR.moved) cast += 'k'; if (bQR && !bQR.moved) cast += 'q'; }
    if (!cast) cast = '-';
    const ep = this.board.enPassant || '-';
    return `${piecePlacement} ${active} ${cast} ${ep} 0 1`;
  }

  possibleMoves(pieceName, square){
    const map = {pawn:'p',rook:'r',knight:'n',bishop:'b',queen:'q',king:'k'};
    const desired = map[pieceName.toLowerCase()];
    const p = this.board.getPiece(square);
    if (!p || p.type.toLowerCase() !== desired) return [];
    return this.moves.possibleMovesFrom(square);
  }

  getStatus(){
    this.lastState = this.special.detectGameState();
    const s = this.lastState;
    if (s.state === 'ongoing') return s.inCheck ? 'check' : 'ongoing';
    if (s.state === 'check') return 'check';
    if (s.state === 'stalemate') return 'stalemate';
    if (s.state === 'checkmate') return `checkmate (${s.winner} wins)`;
    return s.state;
  }

  getStatusObject(){ this.lastState = this.special.detectGameState(); return this.lastState; }

  getScore(){
    // capture scores tracked on board (start at 0)
    this.board.scores = this.board.scores || {white:0, black:0};
    return this.board.scores;
  }

  getMaterial(){ return this.special.evaluateMaterial(); }
}

// expose short-cased global helpers as requested
window.move = function(pieceName, from, to){ return (window._API || new ChessAPI(window._board)).move(pieceName, from, to); };
window.GetBoardState = function(){ return (window._API || new ChessAPI(window._board)).GetBoardState(); };
window.possibleMoves = function(pieceName, square){ return (window._API || new ChessAPI(window._board)).possibleMoves(pieceName, square); };
