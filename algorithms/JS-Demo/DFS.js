const dCanvas = document.getElementById('DFS_Canvas');
const dCtx = dCanvas.getContext('2d');

// State Management
let dNodes = [];
let dAdj = {};
let dVisited = new Set();
let dStack = [];
let dIsRunning = false;
let dTargetNode = null;
let showStackOverlay = false;

// Zoom & Pan State
let dScale = 1.0;
let dOffset = { x: 0, y: 0 };
let isDragging = false;
let lastMouse = { x: 0, y: 0 };

function initDFS() {
    dNodes = [];
    dAdj = {};
    dVisited.clear();
    dStack = [];
    
    // Generate Random Tree (approx 25-30 nodes)
    const totalNodes = 30;
    dTargetNode = Math.floor(Math.random() * (totalNodes - 5)) + 5;
    
    // Root
    dNodes.push({ id: 0, x: 1000, y: 100 }); 
    dAdj[0] = [];

    for (let i = 1; i < totalNodes; i++) {
        let parentIdx = Math.floor(Math.random() * i);
        let parent = dNodes[parentIdx];
        
        // Spread nodes out
        let x = parent.x + (Math.random() * 400 - 200);
        let y = parent.y + 150;
        
        dNodes.push({ id: i, x: x, y: y });
        if (!dAdj[parentIdx]) dAdj[parentIdx] = [];
        dAdj[parentIdx].push(i);
        dAdj[i] = [];
    }
    
    // Center the root initially
    dOffset.x = dCanvas.width / 2 - 1000 * dScale;
    dOffset.y = 50;
    
    drawDFS();
}

function drawDFS(currentNode = null) {
    dCtx.save();
    dCtx.clearRect(0, 0, dCanvas.width, dCanvas.height);
    
    // Apply Zoom and Pan
    dCtx.translate(dOffset.x, dOffset.y);
    dCtx.scale(dScale, dScale);

    // Draw Edges
    dCtx.strokeStyle = "#cbd5e0";
    dCtx.lineWidth = 2;
    for (let u in dAdj) {
        dAdj[u].forEach(v => {
            dCtx.beginPath();
            dCtx.moveTo(dNodes[u].x, dNodes[u].y);
            dCtx.lineTo(dNodes[v].x, dNodes[v].y);
            dCtx.stroke();
        });
    }

    // Draw Nodes
    dNodes.forEach(node => {
        dCtx.beginPath();
        dCtx.arc(node.x, node.y, 25, 0, Math.PI * 2);
        
        if (node.id === dTargetNode) {
            dCtx.fillStyle = "#ef4444"; // Target (Red)
            dCtx.strokeStyle = "#b91c1c";
        } else if (node.id === currentNode) {
            dCtx.fillStyle = "#fbbf24"; // Current (Yellow)
        } else if (dVisited.has(node.id)) {
            dCtx.fillStyle = "#3b82f6"; // Visited (Blue)
        } else {
            dCtx.fillStyle = "#f8f9fa";
            dCtx.strokeStyle = "#4a5568";
        }
        
        dCtx.fill();
        dCtx.stroke();

        dCtx.fillStyle = (dVisited.has(node.id) || node.id === dTargetNode) ? "#fff" : "#1a202c";
        dCtx.font = "bold 16px Arial";
        dCtx.textAlign = "center";
        dCtx.fillText(node.id, node.x, node.y + 6);
    });

    dCtx.restore();

    // UI Overlay (Not affected by zoom/pan)
    drawUI();
}

function drawUI() {
    // Top Info
    dCtx.fillStyle = "rgba(255, 255, 255, 0.8)";
    dCtx.fillRect(10, 10, 180, 60);
    dCtx.fillStyle = "#2d3748";
    dCtx.font = "14px Arial";
    dCtx.fillText(`Target Node: ${dTargetNode}`, 20, 30);
    dCtx.fillText(`Scroll to Zoom / Drag to Pan`, 20, 50);

    // Bottom Left Toggle Button Area
    dCtx.fillStyle = "#4a5568";
    dCtx.fillRect(10, dCanvas.height - 40, 120, 30);
    dCtx.fillStyle = "#fff";
    dCtx.font = "12px Arial";
    dCtx.fillText(showStackOverlay ? "Hide Stack" : "Show Stack", 40, dCanvas.height - 20);

    // Stack Visualization Overlay
    if (showStackOverlay) {
        dCtx.fillStyle = "rgba(0, 0, 0, 0.7)";
        dCtx.fillRect(dCanvas.width - 120, 50, 100, 350);
        dCtx.fillStyle = "#fff";
        dCtx.fillText("STACK", dCanvas.width - 70, 70);
        
        dStack.forEach((val, i) => {
            dCtx.fillStyle = "#fbbf24";
            dCtx.fillRect(dCanvas.width - 110, 380 - (i * 30), 80, 25);
            dCtx.fillStyle = "#000";
            dCtx.fillText(val, dCanvas.width - 70, 397 - (i * 30));
        });
    }
}

// Interaction Listeners
dCanvas.addEventListener('wheel', e => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    dScale += e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    dScale = Math.max(0.2, Math.min(3, dScale));
    drawDFS();
});

dCanvas.addEventListener('mousedown', e => {
    // Check if Toggle Button Clicked
    if (e.offsetX > 10 && e.offsetX < 130 && e.offsetY > dCanvas.height - 40) {
        showStackOverlay = !showStackOverlay;
        drawDFS();
        return;
    }
    isDragging = true;
    lastMouse = { x: e.offsetX, y: e.offsetY };
});

window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    dOffset.x += e.offsetX - lastMouse.x;
    dOffset.y += e.offsetY - lastMouse.y;
    lastMouse = { x: e.offsetX, y: e.offsetY };
    drawDFS();
});

window.addEventListener('mouseup', () => isDragging = false);

// DFS Logic
async function runDFS(u) {
    if (dVisited.has(dTargetNode)) return;

    dVisited.add(u);
    dStack.push(u);
    drawDFS(u);
    await new Promise(r => setTimeout(r, 600));

    if (u === dTargetNode) return;

    for (let v of dAdj[u]) {
        if (!dVisited.has(v) && !dVisited.has(dTargetNode)) {
            await runDFS(v);
            if (!dVisited.has(dTargetNode)) {
                drawDFS(u);
                await new Promise(r => setTimeout(r, 300));
            }
        }
    }
    if (!dVisited.has(dTargetNode)) dStack.pop();
    drawDFS(u);
}

async function dfs_demo_start() {
    if (dIsRunning) return;
    dIsRunning = true;
    initDFS();
    await runDFS(0);
    dIsRunning = false;
}

initDFS();