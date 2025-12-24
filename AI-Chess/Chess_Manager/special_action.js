class SpecialAction {
  constructor(board, moves){
    this.board = board;
    this.moves = moves;
  }

  detectGameState(){
    const color = this.board.turn;
    const inCheck = this.moves.isInCheck(color);
    const hasMoves = this.moves.hasAnyLegalMove(color);
    if (inCheck && !hasMoves) return {state:'checkmate', winner: color === 'white' ? 'black' : 'white', inCheck:true};
    if (!inCheck && !hasMoves) return {state:'stalemate', winner: null, inCheck:false};
    if (inCheck) return {state:'check', winner: null, inCheck:true};
    return {state:'ongoing', winner: null, inCheck:false};
  }

  // Material evaluation for scoring
  evaluateMaterial(){
    const values = {'p':1,'n':3,'b':3,'r':5,'q':9,'k':0};
    let white = 0, black = 0;
    for (let r=0;r<8;r++) for (let c=0;c<8;c++){
      const p = this.board.board[r][c]; if (!p) continue;
      const v = values[p.type.toLowerCase()] || 0;
      if (p.color === 'white') white += v; else black += v;
    }
    return {white, black, diff: white - black};
  }

  // Simple auto-queen promotion placeholder; UI can override
  applyPromotion(square){
    const coord = this.board.squareToCoord(square);
    const p = this.board.getPiece(square);
    if (!p) return;
    if (p.type.toLowerCase() !== 'p') return;
    if ((p.color === 'white' && coord.row === 0) || (p.color === 'black' && coord.row === 7)){
      // default to queen
      const newType = p.color === 'white' ? 'Q' : 'q';
      this.board.setPiece(square, {type:newType, color:p.color});
    }
  }
}
