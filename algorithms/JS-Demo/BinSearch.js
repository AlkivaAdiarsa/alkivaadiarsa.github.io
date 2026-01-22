const canvas = document.getElementById('BinSearch');
const ctx = canvas.getContext('2d');

// Grid Configuration
const rows = 10;
const cols = 10;
const totalElements = rows * cols;
const rectSize = 30;
const padding = 5;
const offset = { x: 25, y: 60 };

// Generate sorted data: 1 to 100
const data = Array.from({ length: totalElements }, (_, i) => i + 1);
let target = 67; 

let isRunning = false;

function getCoords(index) {
    const r = Math.floor(index / cols);
    const c = index % cols;
    return {
        x: offset.x + c * (rectSize + padding),
        y: offset.y + r * (rectSize + padding)
    };
}

function draw(low, high, mid) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Header Info
    ctx.fillStyle = "#212529";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Target: ${target}`, 25, 30);
    
    data.forEach((val, i) => {
        const { x, y } = getCoords(i);

        // Default: Out of search range
        ctx.fillStyle = "#f8f9fa";
        ctx.strokeStyle = "#dee2e6";

        // Highlight Active Search Range
        if (i >= low && i <= high) {
            ctx.fillStyle = "#cfe2ff"; // Light Blue
            ctx.strokeStyle = "#0d6efd";
        }

        // Highlight Midpoint
        if (i === mid) {
            ctx.fillStyle = "#ffca28"; // Amber
        }

        // Highlight Found
        if (val === target && mid === i) {
            ctx.fillStyle = "#198754"; // Success Green
        }

        ctx.fillRect(x, y, rectSize, rectSize);
        ctx.strokeRect(x, y, rectSize, rectSize);

        // Draw Value (Small text for grid)
        ctx.fillStyle = (i === mid || (val === target && mid === i)) ? "#fff" : "#6c757d";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(val, x + rectSize / 2, y + rectSize / 1.6);
    });
}

async function bin_search_demo_start() {
    target = Math.floor(Math.random() * 100) + 1; // New target each run
    if (isRunning) return;
    isRunning = true;

    let low = 0;
    let high = data.length - 1;

    while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        draw(low, high, mid);

        await new Promise(r => setTimeout(r, 800)); // Animation delay

        if (data[mid] === target) {
            draw(mid, mid, mid); // Final state highlight
            break;
        } else if (data[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    isRunning = false;
}

// Initial Render
draw(-1, -1, -1);