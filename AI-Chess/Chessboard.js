class Chessboard {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = 8;
    this.pixelSize = canvas.width; // assume square
    this.squareSize = this.pixelSize / this.size;
    this.selection = null;
    this.turn = 'white';    this.highlightMoves = [];

    this.initPosition();
  }

  initPosition() {
    // board[row][col], row 0 is top (rank 8), row 7 bottom (rank 1)
    this.board = Array.from({ length: 8 }, () => Array(8).fill(null));
    const back = ['r','n','b','q','k','b','n','r'];
    // black
    for (let c=0;c<8;c++){ this.board[0][c] = {type: back[c], color:'black', moved:false} }
    for (let c=0;c<8;c++){ this.board[1][c] = {type: 'p', color:'black', moved:false} }
    // white
    for (let c=0;c<8;c++){ this.board[6][c] = {type: 'P', color:'white', moved:false} }
    for (let c=0;c<8;c++){ this.board[7][c] = {type: back[c].toUpperCase(), color:'white', moved:false} }

    this.enPassant = null; // square coordinate eligible for en passant capture
    this.pendingPromotion = null; // {square, color}
    this.cursorSquare = 'e1'; // keyboard cursor default
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0,0,this.pixelSize,this.pixelSize);
    for (let r=0;r<8;r++){
      for (let c=0;c<8;c++){
        const isLight = (r + c) % 2 === 0;
        ctx.fillStyle = isLight ? '#EEE' : '#777';
        ctx.fillRect(c*this.squareSize, r*this.squareSize, this.squareSize, this.squareSize);

        const sq = this.coordToSquare(r,c);
        if (this.highlightMoves && this.highlightMoves.includes(sq)){
          ctx.fillStyle = 'rgba(0,128,0,0.25)';
          ctx.fillRect(c*this.squareSize, r*this.squareSize, this.squareSize, this.squareSize);
        }
        if (this.selection && this.selection === sq) {
          ctx.fillStyle = 'rgba(0,0,255,0.25)';
          ctx.fillRect(c*this.squareSize, r*this.squareSize, this.squareSize, this.squareSize);
        }
      }
    }

    // draw pieces with borders
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${this.squareSize * 0.7}px serif`;
    for (let r=0;r<8;r++){
      for (let c=0;c<8;c++){
        const p = this.board[r][c];
        if (p) {
          const x = c*this.squareSize + this.squareSize/2;
          const y = r*this.squareSize + this.squareSize/2;
          // stroke for border
          ctx.lineWidth = 2;
          ctx.strokeStyle = p.color === 'white' ? '#000' : '#fff';
          ctx.strokeText(this.pieceToUnicode(p), x, y);
          ctx.fillStyle = p.color === 'white' ? '#fff' : '#000';
          ctx.fillText(this.pieceToUnicode(p), x, y);
        }
      }
    }

    // draw cursor if present
    if (this.cursorSquare){
      const cc = this.squareToCoord(this.cursorSquare);
      ctx.strokeStyle = 'rgba(255,165,0,0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cc.col*this.squareSize + 2, cc.row*this.squareSize + 2, this.squareSize - 4, this.squareSize - 4);
    }

    // draw promotion menu if pending
    if (this.pendingPromotion){
      const coord = this.squareToCoord(this.pendingPromotion.square);
      const menuW = this.squareSize * 2.2;
      const menuH = this.squareSize * 0.9;
      const mx = coord.col*this.squareSize + (this.squareSize - menuW)/2;
      const my = coord.row*this.squareSize - menuH - 6;
      ctx.fillStyle = 'rgba(50,50,50,0.95)';
      ctx.fillRect(mx, my, menuW, menuH);
      ctx.strokeStyle = '#222'; ctx.strokeRect(mx, my, menuW, menuH);
      ctx.fillStyle = '#fff';
      ctx.font = `${this.squareSize * 0.6}px serif`;
      const opts = ['Q','R','B','N'];
      for (let i=0;i<opts.length;i++){
        const px = mx + 8 + i*(menuW-16)/opts.length + (menuW-16)/(opts.length*2);
        const py = my + menuH/2;
        const opt = opts[i];
        // highlight agent choice if exists
        if (this.pendingPromotionChoice && this.pendingPromotionChoice === opt){
          ctx.fillStyle = 'rgba(99,102,241,0.9)';
          ctx.fillRect(mx + 6 + i*(menuW-16)/opts.length, my+4, (menuW-16)/opts.length - 4, menuH - 8);
          ctx.fillStyle = '#fff';
        } else {
          ctx.fillStyle = '#fff';
        }
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeText(this.pieceToUnicode({type: opt, color: this.pendingPromotion.color} ), px, py);
        ctx.fillText(this.pieceToUnicode({type: opt, color: this.pendingPromotion.color} ), px, py);
      }
    }

    // draw status/score bar
    try{
      if (window && window._API){
        const statusText = window._API.getStatus();
        const score = window._API.getScore();
        const boxW = this.pixelSize;
        const boxH = Math.max(32, Math.floor(this.squareSize * 0.35));
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, this.pixelSize - boxH, boxW, boxH);
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.max(12,Math.floor(this.squareSize*0.12))}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`Turn: ${this.turn}  State: ${statusText}`, 8, this.pixelSize - boxH/2 - 4);
        if (score) {
          const diff = (score.white || 0) - (score.black || 0);
          ctx.fillText(`Score W:${score.white||0} B:${score.black||0} Diff:${diff}`, 8, this.pixelSize - 6);
        }
      }
    }catch(e){ /* ignore when not in browser */ }
  }

  pieceToUnicode(p){
    const map = {
      'K':'\u2654','Q':'\u2655','R':'\u2656','B':'\u2657','N':'\u2658','P':'\u2659',
      'k':'\u265A','q':'\u265B','r':'\u265C','b':'\u265D','n':'\u265E','p':'\u265F'
    };
    return map[p.type] || '?';
  }

  coordToSquare(row,col){
    const file = String.fromCharCode('a'.charCodeAt(0) + col);
    const rank = 8 - row;
    return `${file}${rank}`;
  }

  squareToCoord(square){
    if (!/^[a-h][1-8]$/.test(square)) return null;
    const col = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const row = 8 - parseInt(square[1]);
    return {row,col};
  }

  pixelToSquare(x,y){
    const col = Math.floor(x / this.squareSize);
    const row = Math.floor(y / this.squareSize);
    if (col<0||col>7||row<0||row>7) return null;
    return this.coordToSquare(row,col);
  }

  getPiece(square){
    const coord = this.squareToCoord(square);
    if (!coord) return null;
    return this.board[coord.row][coord.col];
  }

  setSelection(square){ this.selection = square; }

  setPiece(square, piece){
    const coord = this.squareToCoord(square);
    if (!coord) return false;
    this.board[coord.row][coord.col] = piece;
    return true;
  }

  removePiece(square){
    const coord = this.squareToCoord(square);
    if (!coord) return false;
    this.board[coord.row][coord.col] = null;
    return true;
  }

  cloneBoard(){
    return this.board.map(r => r.map(c => c ? {type:c.type, color:c.color} : null));
  }

  findKing(color){
    for (let r=0;r<8;r++) for (let c=0;c<8;c++){
      const p = this.board[r][c]; if (p && (p.type.toLowerCase() === 'k') && p.color === color) return this.coordToSquare(r,c);
    }
    return null;
  }

  setHighlights(moves){ this.highlightMoves = moves || []; }
  clearHighlights(){ this.highlightMoves = []; }

  setCursor(square){ this.cursorSquare = square; }

  setPendingPromotion(square, color){ this.pendingPromotion = {square, color}; }
  clearPendingPromotion(){ this.pendingPromotion = null; }

  applyPromotionChoice(choice){
    if (!this.pendingPromotion) return false;
    const sq = this.pendingPromotion.square;
    const color = this.pendingPromotion.color;
    const type = (color === 'white') ? choice.toUpperCase() : choice.toLowerCase();
    this.setPiece(sq, {type, color, moved:true});
    this.clearPendingPromotion();
    // after promotion, switch turn
    this.turn = this.turn === 'white' ? 'black' : 'white';
    return true;
  }
}
