
(function() {
  document.body.insertAdjacentHTML('afterbegin', '<canvas class="Procedural-bg-Canvas"></canvas>');
  const canvas = document.querySelector(".Procedural-bg-Canvas");
  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  //ctx.filter = 'blur(4px)';

  // Utility: random HSL color with brightness 60–85%
  function randomColor() {
    const h = Math.floor(Math.random() * 360);
    const s = 80 + Math.random() * 40;
    const l = 60 + Math.random() * 25;
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  // Shape class
  class Shape {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = 30 + Math.random() * 80;
      this.type = Math.floor(Math.random() * 3); // 0 circle, 1 rect, 2 triangle
      this.color = randomColor();
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.01;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.opacity = 0; // start faded
      this.fadeIn = true;
      this.life = 600 + Math.random() * 600; // frames
    }
    update(scrollOffset) {
      this.x += this.vx + scrollOffset * 0.001;
      this.y += this.vy + scrollOffset * 0.001;
      this.rotation += this.rotationSpeed;

      // Wrap around edges
      if (this.x < -this.size) this.x = canvas.width + this.size;
      if (this.x > canvas.width + this.size) this.x = -this.size;
      if (this.y < -this.size) this.y = canvas.height + this.size;
      if (this.y > canvas.height + this.size) this.y = -this.size;

      // Fade logic
      if (this.fadeIn) {
        this.opacity += 0.02;
        if (this.opacity >= 1) {
          this.opacity = 1;
          this.fadeIn = false;
        }
      } else if (this.life <= 0) {
        this.opacity -= 0.02;
        if (this.opacity <= 0) {
          this.reset();
        }
      }

      this.life--;
    }
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      if (this.type === 0) {
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      } else if (this.type === 1) {
        ctx.rect(-this.size/2, -this.size/2, this.size, this.size);
      } else {
        ctx.moveTo(0, -this.size/2);
        ctx.lineTo(this.size/2, this.size/2);
        ctx.lineTo(-this.size/2, this.size/2);
        ctx.closePath();
      }
      ctx.fill();
      ctx.restore();
    }
  }

  // Create shapes
  const shapes = Array.from({length: 30}, () => new Shape());

  let scrollY = window.scrollY;
  window.addEventListener("scroll", () => {
    scrollY = window.scrollY;
  });

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const shape of shapes) {
      shape.update(scrollY/10);
      shape.draw(ctx);
    }
    requestAnimationFrame(animate);
  }
  animate();
})();
