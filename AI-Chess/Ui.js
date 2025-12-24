class Ui {
  constructor(board){ this.board = board; }

  promptPromotion(color){
    // simple prompt fallback; in-canvas menu can be implemented later
    const choice = prompt('Promote to (q/r/b/n) — default q', 'q');
    const c = (choice || 'q')[0].toLowerCase();
    if ('qrbn'.includes(c)) return c;
    return 'q';
  }
}

window.Ui = Ui;
