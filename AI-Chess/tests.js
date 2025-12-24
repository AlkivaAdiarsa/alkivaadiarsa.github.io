function assert(cond, msg){ if(!cond) console.error('FAIL:', msg); else console.log('PASS:', msg); }

function resetBoard(){ window._board.initPosition(); window._board.draw(); window._API = new ChessAPI(window._board); }

function runTests(){
  console.log('Running basic tests...');
  resetBoard();

  // Test initial pieces
  const board = window.GetBoardState();
  assert(board[7][4] === 'K' && board[0][4] === 'k', 'Kings in starting positions');

  // Test pawn move via API
  const ok1 = window.move('pawn','e2','e4');
  assert(ok1 === true, 'pawn e2->e4 allowed');
  const s1 = window.GetBoardState();
  assert(s1[4][4] === 'P', 'white pawn at e4');

  // Test illegal move
  const ok2 = window.move('pawn','e4','e6');
  assert(ok2 === false, 'illegal pawn move blocked');

  // Test possibleMoves
  const pMoves = window.possibleMoves('pawn','d2');
  assert(Array.isArray(pMoves) && pMoves.includes('d3') && pMoves.includes('d4'), 'd2 pawn moves include d3 and d4');

  // Test simple check detection - Fool's mate
  resetBoard();
  window.move('pawn','f2','f3');
  window.move('pawn','e7','e5');
  window.move('pawn','g2','g4');
  const okmate = window.move('queen','d8','h4');
  assert(okmate === true, 'queen d8->h4 checkmate move allowed');
  const status = window._API.getStatus();
  assert(status === 'checkmate (black wins)' || status === 'checkmate' || status === 'check', 'game status reports check/checkmate after queen h4');

  // check status object includes winner when checkmate
  const statusObj = window._API.getStatusObject ? window._API.getStatusObject() : null;
  if (statusObj && statusObj.state === 'checkmate'){
    assert(statusObj.winner === 'black', 'checkmate winner is black');
  }

  // En Passant test
  resetBoard();
  window.move('pawn','e2','e4');
  window.move('pawn','a7','a6'); // dummy black move
  window.move('pawn','e4','e5');
  window.move('pawn','d7','d5'); // black double step
  const epMoves = window.possibleMoves('pawn','e5');
  assert(epMoves.includes('d6'), 'en passant move available e5->d6');
  const epOk = window.move('pawn','e5','d6');
  assert(epOk === true, 'en passant capture executed');
  const sEP = window.GetBoardState();
  assert(sEP[2][3] === 'P' && sEP[3][3] === null, 'en passant updated board (pawn moved to d6, d5 empty)');

  // Promotion test (in-canvas / auto-queen fallback)
  resetBoard();
  // place a white pawn on a7 and move to a8
  window._board.setPiece('a7',{type:'P', color:'white'});
  window._board.removePiece('a2');
  window._board.draw();
  const okPromo = window.move('pawn','a7','a8');
  assert(okPromo === true, 'pawn a7->a8 promotion move allowed (pending)');
  // apply promotion choice (simulated user choosing queen)
  const applied = window._board.applyPromotionChoice ? window._board.applyPromotionChoice('Q') : false;
  assert(applied === true, 'promotion choice applied');
  const sPromo = window.GetBoardState();
  assert(sPromo[0][0] === 'Q', 'pawn promoted to Queen at a8');

  // Castling test (white kingside)
  resetBoard();
  window.move('pawn','e2','e3');
  window.move('bishop','f1','b5');
  window.move('knight','g1','e2');
  const okCastle = window.move('king','e1','g1');
  assert(okCastle === true, 'king castled e1->g1');
  const sCastle = window.GetBoardState();
  assert(sCastle[7][6] === 'K' && sCastle[7][5] === 'R', 'castle result: king g1, rook f1');

  // Random agent sanity
  resetBoard();
  const api = new ChessAPI(window._board);
  const agent = new RandomAgent(api);
  const m = agent.pickMove('white');
  assert(m && m.from && m.to, 'random agent picks a move');

  // Scoring test
  resetBoard();
  // capture a black pawn and verify scoring increments
  window.move('pawn','e2','e4');
  window.move('pawn','a7','a6');
  window.move('pawn','e4','e5');
  window.move('pawn','d7','d5');
  // en passant capture
  const epOk2 = window.move('pawn','e5','d6');
  assert(epOk2 === true, 'en passant capture executed');
  const sc2 = window._board.scores;
  assert(sc2 && sc2.white >= 1, 'capture increments white score at least 1');
  const apiScore = window._API.getScore();
  assert(apiScore && typeof apiScore.white === 'number', 'API getScore returns capture totals');

  // Minimax basic pickMove
  resetBoard();
  const api2 = new ChessAPI(window._board);
  const mm = new MinimaxAgent(api2,2);
  const pick = mm.pickMove('white');
  assert(pick && pick.from && pick.to, 'minimax picks a legal move');

  // RL / Neural / AlphaZero agent basic tests
  resetBoard();
  const api3 = new ChessAPI(window._board);
  const rl = new RLAgent(api3);
  const rlPick = rl.pickMove('white');
  assert(rlPick && rlPick.from && rlPick.to, 'RL agent picks a legal move');

  const neuralA = new NeuralAgent(api3);
  const nPick = neuralA.pickMove('white');
  assert(nPick && nPick.from && nPick.to, 'Neural agent picks a legal move');

  const az = new AlphaZeroAgent(api3,6);
  const azPick = az.pickMove('white');
  assert(azPick && azPick.from && azPick.to, 'AlphaZero agent picks a legal move');

  console.log('Tests finished. Visit console for details.');
}
