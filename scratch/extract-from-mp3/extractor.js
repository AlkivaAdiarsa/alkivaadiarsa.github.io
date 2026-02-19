/* extractor.js — decode MP3 in-browser and compute short-term volume (RMS / dBFS)
   + YIN pitch detection per frame when requested
   Exports: VolumeExtractor.extractFromFile(file, options, onProgress)
   options: { windowMs, fps, output, pitch: bool, pitchMin, pitchMax, pitchThreshold }
*/

// YIN pitch detector (lightweight JS implementation)
function parabolicInterpolate(buffer, x) {
  const x0 = x <= 0 ? x : x - 1;
  const x2 = x + 1 < buffer.length ? x + 1 : x;
  if (x0 === x && x2 === x) return x;
  const s0 = buffer[x0], s1 = buffer[x], s2 = buffer[x2];
  const a = (s0 + s2 - 2 * s1) / 2;
  if (a === 0) return x;
  const b = (s2 - s0) / 2;
  return x - b / (2 * a);
}

function yinPitch(signal, sampleRate, minFreq = 50, maxFreq = 2000, threshold = 0.12) {
  const N = signal.length;
  if (N < 2) return 0;
  const maxTau = Math.min(Math.floor(sampleRate / minFreq), N - 1);
  const minTau = Math.max(1, Math.floor(sampleRate / maxFreq));
  const yinBuffer = new Float32Array(maxTau + 1);
  yinBuffer[0] = 1.0;

  // difference function
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < N - tau; i++) {
      const delta = signal[i] - signal[i + tau];
      sum += delta * delta;
    }
    yinBuffer[tau] = sum;
  }

  // cumulative mean normalized difference function (CMNDF)
  let runningSum = 0.0;
  for (let tau = 1; tau <= maxTau; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] = yinBuffer[tau] / (runningSum / tau || 1);
  }

  // find first dip below threshold
  let tauEstimate = -1;
  for (let tau = minTau; tau <= maxTau; tau++) {
    if (yinBuffer[tau] < threshold) {
      while (tau + 1 <= maxTau && yinBuffer[tau + 1] < yinBuffer[tau]) tau++;
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === -1) return 0;
  const betterTau = parabolicInterpolate(yinBuffer, tauEstimate);
  const pitch = sampleRate / betterTau;
  if (!isFinite(pitch) || pitch < minFreq || pitch > maxFreq) return 0;
  return pitch;
}

const VolumeExtractor = {
  async extractFromFile(file, options = {}, onProgress) {
    const { windowMs: optWindowMs, fps, output = 'rms', pitch = false, pitchMin = 50, pitchMax = 2000, pitchThreshold = 0.12 } = options;
    const windowMs = optWindowMs ?? (fps ? 1000 / fps : 100);

    // read file to ArrayBuffer
    let arrayBuffer;
    if (file.arrayBuffer) arrayBuffer = await file.arrayBuffer();
    else arrayBuffer = await new Promise((res, rej) => {
      const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(fr.error); fr.readAsArrayBuffer(file);
    });

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const sampleRate = audioBuffer.sampleRate;
    const windowSamples = Math.max(1, Math.floor((windowMs / 1000) * sampleRate));
    const totalSamples = audioBuffer.length;
    const channels = audioBuffer.numberOfChannels;
    const frames = Math.ceil(totalSamples / windowSamples);

    const out = new Array(frames);

    for (let i = 0; i < frames; i++) {
      const start = i * windowSamples;
      const end = Math.min(totalSamples, start + windowSamples);
      let sumSquares = 0;
      let count = 0;

      // accumulate sum of squares across channels and build mono buffer for pitch
      const mono = new Float32Array(end - start);
      for (let s = start, idx = 0; s < end; s++, idx++) {
        let sampleSum = 0;
        for (let ch = 0; ch < channels; ch++) sampleSum += audioBuffer.getChannelData(ch)[s];
        const sample = sampleSum / channels;
        mono[idx] = sample;
        sumSquares += sample * sample; // using mono for RMS gives perceptually correct result
        count++;
      }

      const meanSq = sumSquares / (count || 1);
      const rms = Math.sqrt(meanSq);
      const db = rms > 0 ? 20 * Math.log10(rms) : -Infinity;

      let detectedPitch = 0;
      if (pitch) {
        detectedPitch = yinPitch(mono, sampleRate, pitchMin, pitchMax, pitchThreshold) || 0;
      }

      out[i] = {
        time: start / sampleRate,
        rms,
        db,
        pitch: detectedPitch
      };

      if (onProgress && (i % 10 === 0 || i === frames - 1)) onProgress(Math.round(((i + 1) / frames) * 100));
    }

    if (audioCtx.close) audioCtx.close();
    return out; // array of {time, rms, db, pitch}
  }
};

window.VolumeExtractor = VolumeExtractor;