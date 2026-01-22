```html
<div class="row justify-content-center">
    <div class="col-4">
      One of two columns
    </div>
    <div class="col-4">
      One of two columns
    </div>
  </div>
```
layout
```html
<div class="row justify-content-center my-4">
    <div class="col-4 m-4">
      <canvas class="Demo-Canvas" id="BinSearch" width="400" height="450"></canvas>
    </div>
    <div class="col-4">
      <h3>Title</h3>
      <p>Description</p>
      <p class="d-inline-flex gap-1">
        <a class="btn btn-primary" onclick="demo_start()">
    Play Demo
  </a>
  <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
    Code Here
  </button>
</p>
<div class="collapse" id="collapseExample">
  <div class="card card-body" data-bs-theme="dark">
    <pre><code class="language-python"># code here</code></pre>
  </div>
</div>
    </div>
</div>
```
quicksort
```py
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)
```
ascii art gen 
```html
<div id="ascii-art-gen">

  <h2>ASCII Art Generator</h2>

  <label for="ascii-input">Enter text:</label>
  <textarea id="ascii-input" placeholder="Type something..."></textarea>

  <label for="ascii-font">Choose font:</label>
  <select id="ascii-font">
    <option value="standard">Standard</option>
    <option value="shadow">Shadow</option>
    <option value="block">Block</option>
    <option value="banner">Banner</option>
  </select>

  <button id="ascii-generate">Generate ASCII Art</button>

  <div class="output" id="ascii-output">
    <!-- ASCII art will appear here -->
  </div>
</div>
```
```html
<div id="ascii-art-gen">

<h1>Image to ASCII Converter</h1>
  <hr>

  <div class="row g-4">
    <!-- LEFT -->
    <div class="col-md-4">
      <input type="file" id="imageInput" class="form-control mb-3" accept="image/*">

      <div id="controls">
        <label class="w-100 mb-3">
          Width
          <input type="range" id="widthSlider" class="form-range" min="40" max="200" value="100">
        </label>

        <label class="w-100 mb-3">
          Charset
          <select id="charsetSelect" class="form-select">
            <option value="@%#*+=-:. ">Default</option>
            <option value="█▓▒░ ">Blocks</option>
            <option value="M0xc:. ">Detailed Contrast</option>
            <option value="MWNXK0Okxdolc:;,. ">Detailed</option>
            <option value="@#S%?*+;:,. ">Classic</option>
          </select>
        </label>

        <label class="w-100 mb-3">
          Sampling
          <input type="range" id="sampleSlider" class="form-range" min="1" max="5" value="3">
        </label>

        <div class="form-check mb-2">
          <input class="form-check-input" type="checkbox" id="faceMode">
          <label class="form-check-label">Face mode</label>
        </div>

        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="invertCheckbox">
          <label class="form-check-label">Invert</label>
        </div>
      </div>
    </div>

    <!-- RIGHT -->
    <div class="col-md-8">
      <canvas id="canvas"></canvas>

      <div class="card ascii-card dark" id="asciiCard">
        <div class="card-body">
          <h2>Generated ASCII Art</h2>

          <div class="d-flex gap-2 mb-3 flex-wrap">
            <button class="btn btn-sm btn-accent" id="copyTextBtn">Copy Text</button>
            <button class="btn btn-sm btn-outline-warning" id="copyHtmlBtn">Copy HTML</button>
            <button class="btn btn-sm btn-outline-warning" id="exportTxtBtn">Export TXT</button>
          </div>

          <pre id="asciiOutput">No file chosen</pre>
        </div>
      </div>
    </div>
  </div>

</div>
```