// ===== DOM =====
const imageInput = document.getElementById("imageInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const asciiOutput = document.getElementById("asciiOutput");
const asciiCard = document.getElementById("asciiCard");

const widthSlider = document.getElementById("widthSlider");
const charsetSelect = document.getElementById("charsetSelect");
const sampleSlider = document.getElementById("sampleSlider");
const invertCheckbox = document.getElementById("invertCheckbox");
const faceModeCheckbox = document.getElementById("faceMode");

const copyTextBtn = document.getElementById("copyTextBtn");
const copyHtmlBtn = document.getElementById("copyHtmlBtn");
const exportTxtBtn = document.getElementById("exportTxtBtn");

// ===== STATE =====
let sourceImage = null;

// ===== CONFIG =====
const HEIGHT_RATIO = 0.5;
const CONTRAST = 1.3;
const FACE_CHARS = "@#S%?*+;:,. ";

// ===== THEME =====
function updateOutputTheme() {
  const inverted = invertCheckbox.checked;
  asciiCard.classList.toggle("light", !inverted);
  asciiCard.classList.toggle("dark", inverted);
}

// ===== RENDER =====
function renderASCII() {
  if (!sourceImage) return;

  const sampleStep = Number(sampleSlider.value);
  const outputWidth = Number(widthSlider.value);
  const chars = faceModeCheckbox.checked
    ? FACE_CHARS
    : charsetSelect.value;

  const scale = outputWidth / sourceImage.width;
  const width = outputWidth;
  const height = Math.floor(sourceImage.height * scale * HEIGHT_RATIO);

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(sourceImage, 0, 0, width, height);

  const { data } = ctx.getImageData(0, 0, width, height);
  const rows = [];

  const levels = chars.length;
  const step = 255 / (levels - 1);

  for (let y = 0; y < height; y += sampleStep) {
    const row = [];

    for (let x = 0; x < width; x += sampleStep) {
      const i = (y * width + x) * 4;

      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      let brightness = 0.299 * r + 0.587 * g + 0.114 * b;

      if (faceModeCheckbox.checked) {
        brightness = 128 + (brightness - 128) * 0.8;
        const edge =
          Math.abs(r - (data[i + 4] || r)) +
          Math.abs(r - (data[i + width * 4] || r));
        brightness -= edge * 0.25;
      }

      brightness = (brightness - 128) * CONTRAST + 128;
      brightness = Math.max(0, Math.min(255, brightness));

      const quantized = Math.round(brightness / step) * step;
      const value = invertCheckbox.checked ? 255 - quantized : quantized;

      const index = Math.floor((value / 255) * (chars.length - 1));
      row.push(chars[index]);
    }

    rows.push(row.join(""));
  }

  asciiOutput.textContent = rows.join("\n");
}

// ===== EVENTS =====
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    sourceImage = img;
    renderASCII();
  };
  img.src = URL.createObjectURL(file);
});

[
  widthSlider,
  charsetSelect,
  sampleSlider,
  invertCheckbox,
  faceModeCheckbox
].forEach(el => el.addEventListener("input", () => {
  updateOutputTheme();
  renderASCII();
}));

// ===== ACTIONS =====
copyTextBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(asciiOutput.textContent);
});

copyHtmlBtn.addEventListener("click", async () => {
  const html = `<pre style="background:#000;color:#ffd000;font-family:monospace;font-size:8px;line-height:8px;white-space:pre;">${asciiOutput.textContent}</pre>`;
  await navigator.clipboard.writeText(html);
});

exportTxtBtn.addEventListener("click", () => {
  const blob = new Blob([asciiOutput.textContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ascii-art.txt";
  a.click();
  URL.revokeObjectURL(url);
});

// Init
updateOutputTheme();
