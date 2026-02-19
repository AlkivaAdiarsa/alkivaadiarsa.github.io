/* app.js — UI wiring for the MP3 volume + colour exporter (FPS, pitch-based colours) */

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const fpsInput = document.getElementById('fpsInput');
  const outputType = document.getElementById('outputType');
  const colorSourceInput = document.getElementById('colorSource');
  const pitchMinInput = document.getElementById('pitchMin');
  const pitchMaxInput = document.getElementById('pitchMax');
  const processBtn = document.getElementById('processBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const downloadColorsBtn = document.getElementById('downloadColorsBtn');
  const clearBtn = document.getElementById('clearBtn');
  const outputPreview = document.getElementById('outputPreview');
  const colorPreview = document.getElementById('colorPreview');
  const colorSwatches = document.getElementById('colorSwatches');
  const hueStartInput = document.getElementById('hueStart');
  const hueEndInput = document.getElementById('hueEnd');
  const hueStartValue = document.getElementById('hueStartValue');
  const hueEndValue = document.getElementById('hueEndValue');
  const highlightColorInput = document.getElementById('highlightColor');
  const highlightThresholdInput = document.getElementById('highlightThreshold');
  const highlightThresholdValue = document.getElementById('highlightThresholdValue');
  const spinner = document.getElementById('spinner');
  const progressLabel = document.getElementById('progressLabel');

  let volumeBlobUrl = null;
  let colorsBlobUrl = null;

  function setWorking(isWorking) {
    processBtn.disabled = isWorking;
    spinner.style.display = isWorking ? 'flex' : 'none';
    progressLabel.textContent = isWorking ? '0%' : '';
    if (isWorking) {
      downloadBtn.classList.add('disabled');
      downloadColorsBtn.classList.add('disabled');
    }
  }

  function updateProgress(pct) {
    progressLabel.textContent = pct + '%';
  }

  function revokeAll() {
    if (volumeBlobUrl) { URL.revokeObjectURL(volumeBlobUrl); volumeBlobUrl = null; }
    if (colorsBlobUrl) { URL.revokeObjectURL(colorsBlobUrl); colorsBlobUrl = null; }
    downloadBtn.classList.add('disabled');
    downloadBtn.removeAttribute('href');
    downloadColorsBtn.classList.add('disabled');
    downloadColorsBtn.removeAttribute('href');
  }

  function clearResult() {
    revokeAll();
    outputPreview.textContent = 'No data yet.';
    colorPreview.textContent = '';
    colorSwatches.innerHTML = '';
  }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function renderColorSwatches(hexArray, max=80) {
    colorSwatches.innerHTML = '';
    const count = Math.min(max, hexArray.length);
    for (let i = 0; i < count; i++) {
      const d = document.createElement('div');
      d.className = 'color-swatch';
      d.title = hexArray[i];
      d.style.background = hexArray[i];
      colorSwatches.appendChild(d);
    }
  }

  // UI resets
  clearBtn.addEventListener('click', () => {
    fileInput.value = '';
    fpsInput.value = 10;
    outputType.value = 'rms';
    colorSourceInput.value = 'pitch';
    pitchMinInput.value = 80;
    pitchMaxInput.value = 1000;
    pitchMinInput.disabled = false;
    pitchMaxInput.disabled = false;
    hueStartInput.value = 200;
    hueEndInput.value = 40;
    hueStartValue.textContent = hueStartInput.value;
    hueEndValue.textContent = hueEndInput.value;
    highlightColorInput.value = '#ff2d55';
    highlightThresholdInput.value = 0.2;
    highlightThresholdValue.textContent = Number(highlightThresholdInput.value).toFixed(2);
    clearResult();
  });

  // interactive sliders update
  hueStartInput.addEventListener('input', () => { hueStartValue.textContent = hueStartInput.value; });
  hueEndInput.addEventListener('input', () => { hueEndValue.textContent = hueEndInput.value; });
  highlightThresholdInput.addEventListener('input', () => { highlightThresholdValue.textContent = Number(highlightThresholdInput.value).toFixed(2); });

  // color source toggle (enable/disable pitch inputs)
  colorSourceInput.addEventListener('change', () => {
    const isPitch = colorSourceInput.value === 'pitch';
    pitchMinInput.disabled = !isPitch;
    pitchMaxInput.disabled = !isPitch;
  });

  processBtn.addEventListener('click', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) { alert('Please choose an MP3 file first.'); return; }

    const fps = Math.max(1, Number(fpsInput.value) || 10);
    const outType = outputType.value; // 'rms' or 'db'
    const hueStart = Number(hueStartInput.value);
    const hueEnd = Number(hueEndInput.value);
    const highlightHex = highlightColorInput.value || '#ff2d55';
    const threshold = Math.max(0, Math.min(1, Number(highlightThresholdInput.value) || 0.2));
    const colorSource = colorSourceInput.value; // 'pitch' or 'amplitude'
    const pitchMin = Math.max(1, Number(pitchMinInput.value) || 50);
    const pitchMax = Math.max(pitchMin + 1, Number(pitchMaxInput.value) || 2000);

    setWorking(true);
    clearResult();

    try {
      const rows = await window.VolumeExtractor.extractFromFile(file, { fps, output: 'rms', pitch: colorSource === 'pitch', pitchMin, pitchMax }, (pct) => updateProgress(pct));

      // Build volume-only text (one value per line)
      const volumeLines = rows.map(r => outType === 'db' ? (isFinite(r.db) ? r.db.toFixed(2) : '-Infinity') : r.rms.toFixed(6));

      // Prepare normalized values depending on colour source
      const normValues = new Array(rows.length);
      if (colorSource === 'pitch') {
        const spanP = Math.max(1, pitchMax - pitchMin);
        for (let i = 0; i < rows.length; i++) {
          const p = rows[i].pitch || 0; // 0 means unvoiced / undetected
          // normalized in [0,1], clamp
          normValues[i] = p > 0 ? Math.min(1, Math.max(0, (p - pitchMin) / spanP)) : 0;
        }
      } else {
        const rmsVals = rows.map(r => r.rms);
        const maxRms = Math.max(...rmsVals, 1e-9);
        for (let i = 0; i < rows.length; i++) normValues[i] = rmsVals[i] / maxRms;
      }

      // generate colours from normalized values
      const spanHue = ((hueEnd - hueStart) + 360) % 360;
      const colours = [];
      let prevNorm = null;
      for (let i = 0; i < normValues.length; i++) {
        const norm = normValues[i];
        const hue = (hueStart + norm * spanHue) % 360;
        const hex = hslToHex(hue, 80, 50);
        if (prevNorm !== null && Math.abs(norm - prevNorm) >= threshold) {
          colours.push(highlightHex.toLowerCase());
        } else {
          colours.push(hex.toLowerCase());
        }
        prevNorm = norm;
      }

      // create blobs and set download links
      const volumeText = volumeLines.join('\n');
      const colorsText = colours.join('\n');

      revokeAll();
      const vBlob = new Blob([volumeText], { type: 'text/plain;charset=utf-8' });
      const cBlob = new Blob([colorsText], { type: 'text/plain;charset=utf-8' });
      volumeBlobUrl = URL.createObjectURL(vBlob);
      colorsBlobUrl = URL.createObjectURL(cBlob);

      const baseName = file.name.replace(/\.[^/.]+$/, '');
      downloadBtn.href = volumeBlobUrl;
      downloadBtn.download = `${baseName}_volume.txt`;
      downloadBtn.classList.remove('disabled');

      downloadColorsBtn.href = colorsBlobUrl;
      downloadColorsBtn.download = `${baseName}_colors.txt`;
      downloadColorsBtn.classList.remove('disabled');

      // previews
      outputPreview.textContent = volumeLines.slice(0, 200).join('\n') + (volumeLines.length > 200 ? '\n…' : '');
      colorPreview.textContent = colours.slice(0, 200).join('\n') + (colours.length > 200 ? '\n…' : '');
      renderColorSwatches(colours.slice(0, 200), 120);
    } catch (err) {
      console.error(err);
      alert('Error processing file — open console for details.');
    } finally {
      setWorking(false);
    }
  });

  // revoke blob URLs when unload
  window.addEventListener('unload', () => { revokeAll(); });

  // initialize displayed values
  hueStartValue.textContent = hueStartInput.value;
  hueEndValue.textContent = hueEndInput.value;
  highlightThresholdValue.textContent = Number(highlightThresholdInput.value).toFixed(2);
  // ensure pitch fields state is correct
  pitchMinInput.disabled = false;
  pitchMaxInput.disabled = false;
});