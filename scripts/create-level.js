const fs = require("fs");

const levelData = {};

const directions = [
    { x: -1, y: -1 },
    { x: 0, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
];

function randint(min, max) {
    const range = Math.abs(max - min);
    const q = Math.round(Math.random() * range);
    return min + q;
}

function randomElement(array) {
    return array[randint(0, array.length - 1)];
}

function tab(n) {
    return "    ".repeat(n);
}

function isTravellable(x1, y1, x2, y2, tiles, connections) {
    return (
        tileCountValue(x2, y2, tiles) < 4
        && !connectionExists(x1, y1, x2, y2, connections)
        && newDirection(x1, y1, x2, y2, connections)
    );
}

function tileCountValue(x, y, tiles) {
    let index = tiles.findIndex(e => e[0] === x && e[1] === y);
    if (index === -1) return 0;
    else return tiles[index][2];
}

function increaseTileCountValue(x, y, tiles) {
    let index = tiles.findIndex(e => e[0] === x && e[1] === y);
    if (index === -1) tiles.push([x, y, 1]);
    else tiles[index][2] = tiles[index][2] + 1;
}

function connectionExists(x1, y1, x2, y2, connections) {
    const index1 = connections.findIndex(e => e[0] === x1 && e[1] === y1 && e[2] === x2 && e[3] === y2);
    const index2 = connections.findIndex(e => e[0] === x2 && e[1] === y2 && e[2] === x1 && e[3] === y1);
    return (index1 !== -1 || index2 !== -1);
}

function newDirection(x1, y1, x2, y2, connections) {
    if (connections.length === 0) return true;
    const direction1 = computeDirection([x1, y1, x2, y2]);
    const direction2 = computeDirection(connections[connections.length - 1]);
    return (direction1[0] !== direction2[0] || direction1[1] !== direction2[1]);
}

function computeDirection(points) {
    return [points[2] - points[0], points[3] - points[1]];
}

function getTravellableTiles(x, y, tiles, connections) {
    const candidates = [];
    for (let direction of directions) {
        const tileX = x + direction.x;
        const tileY = y + direction.y;
        if (isTravellable(x, y, tileX, tileY, tiles, connections)) candidates.push([tileX, tileY]);
    }
    return candidates;
}

function formatTiles(tiles, connections) {
    const tilePositions = [];
    const tileCounters = [];
    for (let tile of tiles) {
        tilePositions.push(`${tile[0]}-${tile[1]}`);
        tileCounters.push(tileCountValue(tile[0], tile[1], tiles))
    }
    let solutionFormatted = [];
    for (let connection of connections) {
        solutionFormatted.push(`${connection[0]}-${connection[1]}`);
    }
    solutionFormatted.push(`${tiles[tiles.length - 1][0]}-${tiles[tiles.length - 1][1]}`);
    solutionFormatted = `["${solutionFormatted.join("\",\"")}"]`;
    return { tilePositions, tileCounters, solutionFormatted };
}

function getDimensionsAndCorrections(tiles) {

    let minX = 2 * MAX_GRID_WIDTH;
    let maxX = -2 * MAX_GRID_WIDTH;
    let minY = 2 * MAX_GRID_HEIGHT;
    let maxY = -2 * MAX_GRID_HEIGHT;

    for (let tile of tiles) {
        if (tile[0] < minX) minX = tile[0];
        if (tile[0] > maxX) maxX = tile[0];
        if (tile[1] < minY) minY = tile[1];
        if (tile[1] > maxY) maxY = tile[1];
    }

    let width = maxX - minX + 1;
    let height = maxY - minY + 1;

    let xCorrection = -minX;
    let yCorrection = -minY;

    return { width, height, xCorrection, yCorrection };
}

function createLevel(levelNumber) {

    let length = levelNumber * 2 + 2;

    let x = 0;
    let y = 0;

    const tiles = [[x, y, 1]];
    const connections = [];
    let total = 1;

    for (let i = 0; i < length; i++) {
        const candidates = getTravellableTiles(x, y, tiles, connections);
        const nextTile = randomElement(candidates);
        connections.push([x, y, nextTile[0], nextTile[1]]);
        increaseTileCountValue(nextTile[0], nextTile[1], tiles);
        x = nextTile[0];
        y = nextTile[1];
        total++;
    }

    let { width, height, xCorrection, yCorrection } = getDimensionsAndCorrections(tiles);

    for (let tile of tiles) {
        tile[0] += xCorrection;
        tile[1] += yCorrection;
    }

    for (let connection of connections) {
        connection[0] += xCorrection;
        connection[2] += xCorrection;
        connection[1] += yCorrection;
        connection[3] += yCorrection;
    }

    return { tiles, connections, width, height, total };

}

const MAX_GRID_WIDTH = 20;
const MAX_GRID_HEIGHT = 20;

for (let levelNumber = 50; levelNumber < 100; levelNumber++) {

    let output = [];

    for (let counter = 0; counter < 10; counter++) {

        const { tiles, connections, width, height, total } = createLevel(levelNumber);
        const { tilePositions, tileCounters, solutionFormatted } = formatTiles(tiles, connections);

        const positionsFormatted = `["${tilePositions.join("\",\"")}"]`;
        const countersFormatted = `["${tileCounters.join("\",\"")}"]`;

        output.push(`${tab(2)}{\n${tab(3)}"id": "${levelNumber}-${counter}",\n${tab(3)}"tiles": ${positionsFormatted},\n${tab(3)}"tileCounters": ${countersFormatted},\n${tab(3)}"solution": ${solutionFormatted},\n${tab(3)}"width": ${width},\n${tab(3)}"height": ${height},\n${tab(3)}"total": ${total}\n${tab(2)}}`);
        // output.push(`${tab(2)}{\n${tab(3)}"tiles": ${positionsFormatted},\n${tab(3)}"tileCounters": ${countersFormatted},\n${tab(3)}"solution": ${solutionFormatted},\n${tab(3)}"width": ${width},\n${tab(3)}"height": ${height},\n${tab(3)}"total": ${total}\n${tab(1)}\n${tab(2)}}`);

    }

    let string = "";
    string = string + "{" + "\n";
    string = string + `${tab(1)}"level-number": ${levelNumber},` + "\n";
    string = string + `${tab(1)}"levels": [` + "\n";
    string = string + output.join(`,\n`) + "\n";
    string = string + `${tab(1)}]` + "\n";
    string = string + "}";

    console.log("Writing level " + levelNumber);
    fs.writeFileSync(`./levels/level-${levelNumber}.json`, string);
}
