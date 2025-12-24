AlphaZero-style training scaffold

This folder contains minimal scaffolding to generate self-play games and export training data for offline training.

Why not full training here?
- Full AlphaZero requires a neural network framework (PyTorch / TensorFlow) and GPU for practical training. This repo includes a browser-friendly prototype only.

Available utilities:
- `selfplay_export.html` — lightweight browser page that runs self-play between two `AlphaZeroAgent` instances (configurable rollouts/depth) and lets you download game records (states + moves) as JSON for offline training.

How to use:
1. Open `selfplay_export.html` in a browser (same folder) and press `Generate Game` repeatedly to collect multiple games.
2. Download JSON and feed into an offline trainer (Python + PyTorch recommended). The downloaded format is an array of {states, policy, value} records per position.

If you want, I can add a Python trainer example (PyTorch) and a tiny model architecture to complete the loop (will require installing PyTorch).