class ChessMoves {
  constructor(board){
    this.board = board;
    this.history = [];
    this.captureValues = {'p':1,'n':3,'b':3,'r':5,'q':9};
  }

  inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }

  // undo the last move (used by minimax simulation and tests)
  undoMove(){
    const h = this.history.pop();
    if (!h) return false;
    // restore enPassant
    this.board.enPassant = h.prevEnPassant;

    // if promotion happened and was pending, revert appropriately
    if (h.promotionPending){
      // the promoted piece currently sits at h.to; revert to original pawn
      this.board.setPiece(h.from, h.piece);
      // restore captured piece if any
      if (h.cap) this.board.setPiece(h.to, h.cap);
      else this.board.removePiece(h.to);
      // undo any score changes
      if (h.capPoints){ this.board.scores[h.piece.color] -= h.capPoints; }
      this.board.clearPendingPromotion();
      this.board.turn = h.prevTurn;
      return true;
    }

    // normal undo
    // move piece back
    this.board.setPiece(h.from, h.piece);
    // restore target
    if (h.cap){ this.board.setPiece(h.to, h.cap); } else { this.board.removePiece(h.to); }

    // handle en passant capture undo
    if (h.epCapture){
      const tc = this.board.squareToCoord(h.to);
      const capRow = h.piece.color === 'white' ? tc.row + 1 : tc.row - 1;
      // restore captured pawn
      this.board.board[capRow][tc.col] = h.cap || {type: 'p', color: (h.piece.color === 'white' ? 'black' : 'white'), moved:true};
    }

    // handle castling undo
    if (h.castle){
      // rook moved from rookFrom -> rookTo, move back
      if (h.rookFrom && h.rookTo){
        const rook = this.board.getPiece(h.rookTo);
        if (rook){ this.board.setPiece(h.rookFrom, rook); this.board.removePiece(h.rookTo); }
      }
    }

    // revert moved flags
    if (h.piece) h.piece.moved = h.prevPieceMoved || false;
    if (h.rook){ h.rook.moved = h.prevRookMoved || false; }

    // revert capture scoring
    if (h.capPoints){ this.board.scores[h.piece.color] -= h.capPoints; }

    // restore turn
    this.board.turn = h.prevTurn;
    return true;
  }

  possibleMovesFrom(square){
    const p = this.board.getPiece(square);
    if (!p) return [];
    const coord = this.board.squareToCoord(square);
    const moves = [];
    const dir = p.color === 'white' ? -1 : 1; // row delta for pawns

    const pushIf = (r,c) => { if (this.inBounds(r,c)) moves.push(this.board.coordToSquare(r,c)); };

    const {row,col} = coord;
    const t = p.type.toLowerCase();

    if (t === 'p'){
      // forward
      const r1 = row + dir;
      if (this.inBounds(r1,col) && !this.board.board[r1][col]){
        moves.push(this.board.coordToSquare(r1,col));
        // double
        const startRow = p.color === 'white' ? 6 : 1;
        const r2 = row + 2*dir;
        if (row === startRow && !this.board.board[r2][col]) moves.push(this.board.coordToSquare(r2,col));
      }
      // captures
      for (const dc of [-1,1]){
        const rc = row + dir; const cc = col + dc;
        if (!this.inBounds(rc,cc)) continue;
        const target = this.board.board[rc][cc];
        if (target && target.color !== p.color) moves.push(this.board.coordToSquare(rc,cc));
        // en passant - only allow if the adjacent square contains an opponent pawn (the one that moved two steps)
        const ep = this.board.enPassant;
        if (ep){
          const epCoord = this.board.squareToCoord(ep);
          if (epCoord.row === rc && epCoord.col === cc){
            const adj = this.board.board[row][cc]; // the pawn that would be captured sits beside the capturing pawn
            if (adj && adj.type && adj.type.toLowerCase() === 'p' && adj.color !== p.color){
              moves.push(this.board.coordToSquare(rc,cc));
            }
          }
        }
      }
    } else if (t === 'n'){
      const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dr,dc] of deltas){ const r=row+dr,c=col+dc; if (this.inBounds(r,c)){ const target=this.board.board[r][c]; if (!target||target.color!==p.color) moves.push(this.board.coordToSquare(r,c)); }}
    } else if (t === 'b' || t === 'r' || t === 'q'){
      const dirs = [];
      if (t==='b' || t==='q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
      if (t==='r' || t==='q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
      for (const [dr,dc] of dirs){
        let r=row+dr,c=col+dc;
        while (this.inBounds(r,c)){
          const target=this.board.board[r][c];
          if (!target){ moves.push(this.board.coordToSquare(r,c)); }
          else { if (target.color!==p.color) moves.push(this.board.coordToSquare(r,c)); break; }
          r+=dr; c+=dc;
        }
      }
    } else if (t === 'k'){
      for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++){ if (dr===0 && dc===0) continue; const r=row+dr,c=col+dc; if (this.inBounds(r,c)){ const target=this.board.board[r][c]; if (!target||target.color!==p.color) moves.push(this.board.coordToSquare(r,c)); }}
      // Castling
      if (!p.moved){
        // kingside
        const rookK = this.board.getPiece(this.board.coordToSquare(row,7));
        if (rookK && !rookK.moved){
          // squares between empty
          if (!this.board.board[row][5] && !this.board.board[row][6]){
            // king not in check, and passing squares not attacked
            const kingSq = this.board.coordToSquare(row,col);
            const fSq = this.board.coordToSquare(row,5);
            const gSq = this.board.coordToSquare(row,6);
            if (!this.isSquareAttacked(kingSq, p.color === 'white' ? 'black' : 'white') && !this.isSquareAttacked(fSq, p.color === 'white' ? 'black' : 'white') && !this.isSquareAttacked(gSq, p.color === 'white' ? 'black' : 'white')){
              moves.push(this.board.coordToSquare(row,6));
            }
          }
        }
        // queenside
        const rookQ = this.board.getPiece(this.board.coordToSquare(row,0));
        if (rookQ && !rookQ.moved){
          if (!this.board.board[row][1] && !this.board.board[row][2] && !this.board.board[row][3]){
            const kingSq = this.board.coordToSquare(row,col);
            const dSq = this.board.coordToSquare(row,3);
            const cSq = this.board.coordToSquare(row,2);
            if (!this.isSquareAttacked(kingSq, p.color === 'white' ? 'black' : 'white') && !this.isSquareAttacked(dSq, p.color === 'white' ? 'black' : 'white') && !this.isSquareAttacked(cSq, p.color === 'white' ? 'black' : 'white')){
              moves.push(this.board.coordToSquare(row,2));
            }
          }
        }
      }
    }

    // Filter out moves that leave own king in check
    const legal = moves.filter(to => this.isLegalMove(square, to));
    return legal;
  }

  isSquareAttacked(square, byColor){
    // Iterate all enemy pieces and see if they can move to square (pseudo-legal)
    for (let r=0;r<8;r++) for (let c=0;c<8;c++){
      const p = this.board.board[r][c]; if (!p || p.color!==byColor) continue;
      const sq = this.board.coordToSquare(r,c);
      const moves = this.possibleMovesRaw(sq, true); // raw moves ignoring check
      if (moves.includes(square)) return true;
    }
    return false;
  }

  possibleMovesRaw(square, ignoreColor=false){
    // Like possibleMovesFrom but without final king-in-check filtering; used for attack detection
    const p = this.board.getPiece(square);
    if (!p) return [];
    const coord = this.board.squareToCoord(square);
    const moves = [];
    const row=coord.row,col=coord.col; const t=p.type.toLowerCase(); const dir = p.color === 'white'? -1:1;
    const inB=this.inBounds.bind(this);
    if (t==='p'){
      const r1=row+dir;
      for (const dc of [-1,1]){ const rc=row+dir, cc=col+dc; if (inB(rc,cc)) moves.push(this.board.coordToSquare(rc,cc)); }
    } else if (t==='n'){
      const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dr,dc] of deltas){ if (inB(row+dr,col+dc)) moves.push(this.board.coordToSquare(row+dr,col+dc)); }
    } else if (t==='b' || t==='r' || t==='q'){
      const dirs = [];
      if (t==='b' || t==='q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
      if (t==='r' || t==='q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
      for (const [dr,dc] of dirs){ let r=row+dr,c=col+dc; while (inB(r,c)){ moves.push(this.board.coordToSquare(r,c)); if (this.board.board[r][c]) break; r+=dr; c+=dc;} }
    } else if (t==='k'){
      for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++){ if (dr===0&&dc===0) continue; if (inB(row+dr,col+dc)) moves.push(this.board.coordToSquare(row+dr,col+dc)); }
    }
    return moves;
  }

  isLegalMove(from, to){
    // simulate
    const savedBoard = this.board.cloneBoard();
    const pieceFrom = this.board.getPiece(from);
    const target = this.board.getPiece(to);
    // handle en passant capture simulation
    const epCapture = (pieceFrom.type.toLowerCase()==='p' && this.board.enPassant && to === this.board.enPassant && target === null);

    this.board.setPiece(to, pieceFrom);
    this.board.removePiece(from);
    if (epCapture){
      // remove pawn behind to
      const tc = this.board.squareToCoord(to);
      const capRow = pieceFrom.color === 'white' ? tc.row + 1 : tc.row - 1;
      this.board.board[capRow][tc.col] = null;
    }

    const kingSquare = this.board.findKing(pieceFrom.color);
    const inCheck = this.isSquareAttacked(kingSquare, pieceFrom.color === 'white' ? 'black' : 'white');

    // restore
    this.board.board = savedBoard;
    return !inCheck;
  }

  move(from,to){
    const piece = this.board.getPiece(from);
    if (!piece) return false;
    const legal = this.possibleMovesFrom(from);
    if (!legal.includes(to)) return false;

    // handle en passant capture
    const epCapture = (piece.type.toLowerCase() === 'p' && this.board.enPassant && to === this.board.enPassant && !this.board.getPiece(to));

    // save previous state for undo
    const prevEn = this.board.enPassant;
    const prevTurn = this.board.turn;
    const prevPieceMoved = piece.moved || false;

    // target piece at destination
    const target = this.board.getPiece(to);

    // make the move
    this.board.setPiece(to, piece);
    this.board.removePiece(from);

    // record additional data for history
    const historyEntry = {from,to,piece,cap:target,prevEnPassant: prevEn, prevTurn, prevPieceMoved};

    // If king moved two squares -> castle: move rook and record rook info
    const fromCoord = this.board.squareToCoord(from);
    const toCoord = this.board.squareToCoord(to);
    if ((piece.type.toLowerCase() === 'k') && Math.abs(fromCoord.col - toCoord.col) === 2){
      historyEntry.castle = true;
      if (toCoord.col === 6){
        const rookFrom = this.board.coordToSquare(fromCoord.row,7);
        const rookTo = this.board.coordToSquare(fromCoord.row,5);
        const rook = this.board.getPiece(rookFrom);
        if (rook){ this.board.setPiece(rookTo, rook); this.board.removePiece(rookFrom); historyEntry.rookFrom = rookFrom; historyEntry.rookTo = rookTo; historyEntry.rook = rook; historyEntry.prevRookMoved = rook.moved || false; rook.moved = true; }
      } else if (toCoord.col === 2){
        const rookFrom = this.board.coordToSquare(fromCoord.row,0);
        const rookTo = this.board.coordToSquare(fromCoord.row,3);
        const rook = this.board.getPiece(rookFrom);
        if (rook){ this.board.setPiece(rookTo, rook); this.board.removePiece(rookFrom); historyEntry.rookFrom = rookFrom; historyEntry.rookTo = rookTo; historyEntry.rook = rook; historyEntry.prevRookMoved = rook.moved || false; rook.moved = true; }
      }
    }

    if (epCapture){
      const capRow = piece.color === 'white' ? toCoord.row + 1 : toCoord.row - 1;
      const capturedPawn = this.board.board[capRow][toCoord.col];
      historyEntry.epCapture = true; historyEntry.capturedPawn = capturedPawn ? {type: capturedPawn.type, color: capturedPawn.color, moved: capturedPawn.moved} : null;
      this.board.board[capRow][toCoord.col] = null; // remove captured pawn
    }

    // update enPassant possibility
    this.board.enPassant = null;
    if (piece.type.toLowerCase()==='p'){
      if (Math.abs(fromCoord.row - toCoord.row) === 2){
        // set square behind pawn as enPassant target
        const epRow = (fromCoord.row + toCoord.row) / 2;
        this.board.enPassant = this.board.coordToSquare(epRow, fromCoord.col);
      }
    }

    // handle capture scoring
    this.board.scores = this.board.scores || {white:0,black:0};
    let capPoints = 0;
    if (target){ capPoints = this.captureValues[target.type.toLowerCase()] || 0; if (capPoints) this.board.scores[piece.color] += capPoints; }
    if (epCapture && historyEntry.capturedPawn){ const capType = historyEntry.capturedPawn.type; const cp = this.captureValues[capType.toLowerCase()] || 0; if (cp) { capPoints += cp; this.board.scores[piece.color] += cp; } }
    historyEntry.capPoints = capPoints;

    // promotion: if reaching last rank, set pending promotion (do NOT switch turn until promotion choice)
    if (piece.type === 'P' && toCoord.row === 0){
      this.board.setPendingPromotion(to, 'white');
      // keep the pawn there temporarily, don't switch turn
      historyEntry.promotionPending = true;
      this.history.push(historyEntry);
      piece.moved = true;
      return true;
    }
    if (piece.type === 'p' && toCoord.row === 7){
      this.board.setPendingPromotion(to, 'black');
      historyEntry.promotionPending = true;
      this.history.push(historyEntry);
      piece.moved = true;
      return true;
    }

    // mark piece as moved
    piece.moved = true;

    // switch turn
    this.board.turn = this.board.turn === 'white' ? 'black' : 'white';

    this.history.push(historyEntry);

    return true;
  }

  isInCheck(color){
    const king = this.board.findKing(color);
    return this.isSquareAttacked(king, color === 'white' ? 'black' : 'white');
  }

  hasAnyLegalMove(color){
    for (let r=0;r<8;r++) for (let c=0;c<8;c++){
      const p = this.board.board[r][c]; if (!p || p.color !== color) continue;
      const sq = this.board.coordToSquare(r,c);
      const moves = this.possibleMovesFrom(sq);
      if (moves.length) return true;
    }
    return false;
  }

  allLegalMoves(color){
    const out = [];
    for (let r=0;r<8;r++) for (let c=0;c<8;c++){
      const p = this.board.board[r][c]; if (!p || p.color !== color) continue;
      const sq = this.board.coordToSquare(r,c);
      const moves = this.possibleMovesFrom(sq);
      for (const to of moves) out.push({from: sq, to});
    }
    return out;
  }
}
