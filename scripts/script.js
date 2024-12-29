/* Bubilee - A game by Jack Miller */

const canvas = element("game-canvas");
const ctx = canvas.getContext("2d");
const gameContainer = element("game-container");

let GRID_WIDTH = 15;
let GRID_HEIGHT = 15;
let tileWidth = gameContainer.clientWidth / GRID_WIDTH;
let tileHeight = gameContainer.clientHeight / GRID_HEIGHT;
let lineWidth = 0;

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

let currentLevel;
let levelNumber = 1;
let id = 0;
let levelID = "";
let path = []
let tilesClicked = 0;

function element(id) {
    return document.getElementById(id);
}

function getGridStyle(height) {
    return `position: absolute; top: 0; left: 0; display: grid; grid-template-rows: repeat(${height}, 1fr); width: 100%; height: 100%;`;
}

function getCanvasRowStyle(width) {
    return `display: grid; grid-template-columns: repeat(${width}, 1fr); width: 100%; height: 100%;`;
}

function resizeCanvas(width, height) {
    tileWidth = 0.7 * window.innerWidth / GRID_WIDTH;
    tileHeight = 0.8 * window.innerHeight / GRID_HEIGHT;
    let tileSize = (tileWidth * width < tileHeight * height) ? tileWidth : tileHeight;
    tileSize = Math.min(tileSize, 0.1 * window.innerHeight)
    tileWidth = tileSize;
    tileHeight = tileSize;
    gameContainer.style.width = `${tileWidth * width}px`;
    gameContainer.style.height = `${tileHeight * height}px`;
    canvas.width = tileWidth * width;
    canvas.height = tileHeight * height;
}

function createGrid(width, height) {
    let rows = height;
    let columns = width;
    GRID_WIDTH = width;
    GRID_HEIGHT = height;
    resizeCanvas(width, height);
    lineWidth = tileWidth * 0.15;
    halfLineWidth = lineWidth / 2;
    let output = `<div id="grid" style="${getGridStyle(GRID_HEIGHT)}">`;
    for (let row = 0; row < rows; row++) {
        let rowString = "";
        for (let column = 0; column < columns; column++) {
            rowString = rowString + `<div onclick="clickTile(${column}, ${row})" id="${column}-${row}" class="canvas-tile"></div>`;
        }
        rowString = `<div style="${getCanvasRowStyle(GRID_WIDTH)}">${rowString}</div>\n`;
        output = output + rowString;
    }
    output = output + "</div>"
    element("grid-container").innerHTML = output;
}

function clickTile(x, y) {
    if (!clickable(x, y)) return;
    let elem = element(`${x}-${y}`);
    let counter = parseInt(elem.style.background.slice(18, 19));
    elem.style.background = `var(--colour-tile-${counter - 1})`;
    path.push({ x, y });
    if (path.length > 1) {
        drawPath();
    }
    if (++tilesClicked >= currentLevel.total) currentLevel = loadLevel(++levelNumber);
}

function clickable(x, y) {

    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return false;

    let elem = element(`${x}-${y}`);
    if (elem.style.background === "var(--colour-tile-0)") return false;
    if (elem.style.background === "var(--colour-unused-tile)") return false;

    if (path.length > 0) {
        let lastSelectedTile = path[path.length - 1];
        if (!tilesAdjacent(lastSelectedTile.x, lastSelectedTile.y, x, y)) return false;
        if (path.length >= 2) {

            let direction = { x: x - lastSelectedTile.x, y: y - lastSelectedTile.y };

            let prevLastSelectedTile = path[path.length - 2];
            let prevDirection = { x: lastSelectedTile.x - prevLastSelectedTile.x, y: lastSelectedTile.y - prevLastSelectedTile.y };
            if (direction.x === prevDirection.x && direction.y === prevDirection.y) return false;

            if (pathContainsConnection(lastSelectedTile, { x, y })) return false;
        }
    }

    return true;

}

function formatPosition(tile) {
    return `${tile.x}-${tile.y}`;
}

function pathContainsConnection(tile1, tile2) {
    for (let index = 0; index < path.length - 1; index++) {
        let pathTile1 = path[index];
        let pathTile2 = path[index + 1];
        if (tilesMatch(tile1, pathTile1) && tilesMatch(tile2, pathTile2)) return true;
        if (tilesMatch(tile1, pathTile2) && tilesMatch(tile2, pathTile1)) return true;
    }
    return false;
}

function tilesMatch(tile1, tile2) {
    return (tile1.x === tile2.x && tile1.y === tile2.y);
}

function tilesAdjacent(x1, y1, x2, y2) {
    if (x1 === x2 && y1 === y2) return false;
    return (Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1);
}

function getCanvasPosition(tileX, tileY) {
    let x = (tileX + 0.5) * tileWidth;
    let y = (tileY + 0.5) * tileHeight;
    return { x, y };
}

function drawPath() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "black";
    ctx.lineWidth = lineWidth;

    let start = path[0];
    drawTileDot(start.x, start.y, halfLineWidth);

    path.slice(1).forEach(end => {
        drawLine(start, end);
        drawTileDot(end.x, end.y, halfLineWidth);
        start = end;
    });

    // draw circle on current tile
    let lastTile = path[path.length - 1];
    drawTileDot(lastTile.x, lastTile.y, lineWidth);

}

function drawLine(start, end) {
    let startPos = getCanvasPosition(start.x, start.y);
    let endPos = getCanvasPosition(end.x, end.y);
    ctx.beginPath();
    ctx.moveTo(startPos.x, startPos.y);
    ctx.lineTo(endPos.x, endPos.y);
    ctx.stroke();
}

function drawTileDot(x, y, radius) {
    let pos = getCanvasPosition(x, y);
    ctx.beginPath();
    ctx.lineWidth = 0;
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
}

function randint(min, max) {
    let range = Math.abs(max - min);
    let q = Math.round(Math.random() * range);
    return min + q;
}

function loadLevel(number, id = -1) {
    levelNumber = number;
    if (levelNumber > 50) {
        changeToMenu("end-screen");
        return;
    }
    levelID = (id === -1) ? randint(0, 9) : id;
    levelRef = `${levelNumber}-${levelID}`;
    console.log("Loading level " + levelRef);
    element("level-value").innerHTML = levelNumber.toString();
    element("level-id").innerHTML = levelID.toString();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    path.splice(0);
    tilesClicked = 0;
    let currentLevel = levelData[levelRef];
    GRID_WIDTH = currentLevel.width;
    GRID_HEIGHT = currentLevel.height;
    createGrid(currentLevel.width, currentLevel.height);
    for (let x = 0; x < GRID_WIDTH; x++) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            let elem = element(`${x}-${y}`);
            let index = currentLevel.tiles.indexOf(`${x}-${y}`);
            if (index === -1) {
                elem.style.background = "var(--colour-unused-tile)";
                elem.style.borderColor = "transparent";
            }
            else {
                let counter = currentLevel.tileCounters[index];
                elem.style.background = `var(--colour-tile-${counter})`;
                elem.style.borderColor = "black";
            }
        }
    }
    console.log(`Level ${levelID}`);
    return currentLevel;
}

function onClickPlay(level = 1, id = NaN) {
    if (isNaN(level)) level = 1;
    if (isNaN(id)) id = randint(0, 9);
    levelNumber = level;
    levelID = id;
    currentLevel = loadLevel(levelNumber, levelID);
    element("menu-container").style.opacity = "0%";
    element("menu-container").style.display = "none";
    element("game-container").style.display = "block";
    element("left-pane").style.display = "block";
    element("right-pane").style.display = "grid";
    element("background").style.opacity = "0%";
}

function changeToMenu(menuName) {

    element("menu-main").style.display = "none";
    element("menu-level-select").style.display = "none";
    element("menu-how-to-play").style.display = "none";
    element("menu-attributions").style.display = "none";
    element("menu-pause").style.display = "none";
    element("menu-end-screen").style.display = "none";

    element(`menu-${menuName}`).style.display = "block";

    element("menu-container").style.display = "block";
    element("menu-container").style.opacity = "100%";

    element("reddit-link").style.display = (menuName === "main") ? "grid" : "none";

    if (menuName === "main") {
        element("background").style.opacity = "100%";
    }

    if (menuName === "main" || menuName === "pause" || menuName === "end-screen") {
        element("menu-back-button").style.display = "none";
    }
    else {
        element("menu-back-button").style.display = "block";
    }

}

function onClickExit() {
    element("game-container").style.display = "none";
    element("left-pane").style.display = "none";
    element("right-pane").style.display = "none";
    changeToMenu("main");
}

canvas.addEventListener("click", e => {
    let tileX = Math.floor(e.offsetX / tileWidth);
    let tileY = Math.floor(e.offsetY / tileHeight);
    clickTile(tileX, tileY);
});

document.addEventListener("keydown", e => {
    if (e.keyCode === 27) {
        loadLevel(levelNumber, levelID);
    }
});

window.onload = () => {
    element("menu-container").style.opacity = "100%";
    element("background").style.opacity = "100%";
};
