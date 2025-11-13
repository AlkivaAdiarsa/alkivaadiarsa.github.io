var myGamePiece;
//* setup game
function startgame() {
  myGameArea.start();
  myGamePiece = new component(30, 30, "red", 10, 120);
}
//* game area
var myGameArea = {
  canvas : document.createElement("canvas"),
  start : function() {
   this.canvas.width = 480;
   this.canvas.height = 270;
   this.canvas.style.marginTop = "3rem"
   this.context = this.canvas.getContext("2d");
   document.body.appendChild()
   this.interval = setInterval(updateGameArea, 20);
   },
 clear : function() {
   this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
 }
}
//* components
function component(width, height, colour, x, y) {
  this.width = width;
  this.height = height;
  this.x = x;
  this.y = y;
  this.speedX = 0;
  this.speedY = 0;
  this.update = function() {
   ctx = myGameArea.context;
   ctx.fillstyle = colour;
   ctx.fillRect(this.x, this.y, this.width, this.height);
  }
  this.newPos = function() {
    this.x += this.speedX;
    this.y += this.speedY;
  }
}
//* update game area 
function updateGameArea() {
  myGameArea.clear();
  myGamePiece.newPos();
  myGamePiece.Update();
}
//* movements
function moveUp() {
  myGamePiece.speedY -= 1;
}
function moveDown() {
  myGamePiece.speedY += 1;
}
function moveLeft() {
  myGamePiece.speedX -= 1;
}
function moveRight() {
  myGamepIece.speedX += 1;
}
function stopMove() {
  myGamePiece.speedX = 0;
  myGamePiece.speedY = 0;
}
  
