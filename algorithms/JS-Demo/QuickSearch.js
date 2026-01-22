const qsCanvas = document.getElementById('QuickSearch');
const qsCtx = qsCanvas.getContext('2d');

let qsItems = [];
let qsIsSorting = false;
const qsTotalElements = 20; // Reduced count slightly so numbers are readable
const qsMaxHeight = 300;

function initQuickSort() {
    qsItems = [];
    for (let i = 0; i < qsTotalElements; i++) {
        qsItems.push({
            value: Math.floor(Math.random() * qsMaxHeight) + 30,
            status: 'default'
        });
    }
    drawQuickSort();
}

function drawQuickSort() {
    qsCtx.clearRect(0, 0, qsCanvas.width, qsCanvas.height);
    
    // Calculate width based on total elements
    const padding = 10;
    const barWidth = (qsCanvas.width - (padding * 2)) / qsTotalElements;

    qsItems.forEach((item, i) => {
        const x = padding + i * barWidth;
        const y = qsCanvas.height - item.value - 30; // Leave room for numbers at bottom

        // Set Colors
        if (item.status === 'pivot') qsCtx.fillStyle = "#ffca28";      
        else if (item.status === 'comparing') qsCtx.fillStyle = "#0d6efd"; 
        else if (item.status === 'sorted') qsCtx.fillStyle = "#198754";    
        else qsCtx.fillStyle = "#dee2e6";                                  

        // 1. Draw the Bar
        qsCtx.fillRect(x + 2, y, barWidth - 4, item.value);

        // 2. Draw the Number Label
        qsCtx.fillStyle = "#212529";
        qsCtx.font = "bold 11px Arial";
        qsCtx.textAlign = "center";
        
        // Position text slightly above the bar
        qsCtx.fillText(item.value, x + barWidth / 2, y - 8);
    });
}

const qsWait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function qsPartition(low, high) {
    let pivotValue = qsItems[high].value;
    qsItems[high].status = 'pivot';
    let i = low - 1;

    for (let j = low; j < high; j++) {
        qsItems[j].status = 'comparing';
        drawQuickSort();
        await qsWait(150); // Slower speed to see the numbers move

        if (qsItems[j].value < pivotValue) {
            i++;
            [qsItems[i], qsItems[j]] = [qsItems[j], qsItems[i]];
            drawQuickSort(); // Redraw after swap
        }
        qsItems[j].status = 'default';
    }
    [qsItems[i + 1], qsItems[high]] = [qsItems[high], qsItems[i + 1]];
    qsItems[i + 1].status = 'sorted';
    drawQuickSort();
    return i + 1;
}

async function quickSortLogic(low, high) {
    if (low < high) {
        let pivotIndex = await qsPartition(low, high);
        await quickSortLogic(low, pivotIndex - 1);
        await quickSortLogic(pivotIndex + 1, high);
    } else if (low >= 0 && low < qsItems.length) {
        qsItems[low].status = 'sorted';
        drawQuickSort();
    }
}

async function quick_sort_demo_start() {
    if (qsIsSorting) return;
    qsIsSorting = true;
    initQuickSort(); 
    await quickSortLogic(0, qsItems.length - 1);
    qsItems.forEach(item => item.status = 'sorted');
    drawQuickSort();
    qsIsSorting = false;
}

initQuickSort();