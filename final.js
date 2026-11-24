// Me and Gustav have worked together on this project. If you want to know more, contact us

let canvasSize = 500;    // Size of canvas
let numGridElems = 12;  // Amount of grid elements
let framecount = 0;    // Frame count
let grid;
let start = [2, 0];
let target = [4, 11];
let path = [];

// Spawn time period
let waveDelay = 180;          // Delay before a wave starts, in frames (10s at 60 FPS)
let waitingForWave = true;   // Whether we're currently counting down to the next wave
let waveCountdownStart = 0; // The frame the current countdown began

// Display variables
let health = 100;         // Amount of starting health
let money = 600;         // Amount of starting cash
let killReward = 35;    // Money earned per monster killed
let costOfWall = 50;    // Price of placing a wall
let highScore_mk = 0;  // Highscore for monsters killed
let highScore_wn = 0; // Highscore for highest wave completed
let waveNumber = 1;  // Which wave we are on
let wallPlacementErrorUntil = 0; // If you cant get frem s to t make error

// Monster
let monstersKilled = 0;            // Monsters killed
let monstersinwave = 0;           // Monsters in the current wave
let bossinwave = 0;              // Boss in current wave
let bossspawned = false;         // Whether the current wave's boss has spawned
let monstersspawned = 0;        // Monsters spawned in the current wave
let monsterspawninterval = 60; // Spawn a monster every 60 frames (1 second at 60fps)
let lastMonsterSpawnTime = 0; // Last time a monster was spawned (in frames)
let waveActive = false;      // Whether a wave is currently active
let monsters = [];          // Array to hold all active monsters

// Monster stats
let monsterdamage1 = 10;     // The damage of monster 1
let monsterspeed1 = 2;      // The speed of monster 1
let monsterhealth1 = 100;  // The health of monster 1
let bosshealth = 1000     // Health of boss
let bossspeed = 1.5;       // Speed of boss


// Towers
let towers = [];                        // List of placed towers
let selectedTowerIndex = -1;           // Track which tower is selected
let towerRadius = 3;                  // Tower radius in tiles
let towerdps = monsterhealth1/3;     // Damage per shot (one shot per second)
let towerCooldown = 60;             // Frames between shots
let shotDuration = 8;              // How many frames a shot line stays visible
let numberoftowers = 0;           // Number of towers placed
let towerBaseCost = 200;         // Price of the first tower
let towerCostIncrease = 20;     // How much each extra tower adds to the price

function makeGrid() {
    // 0 = open, 1 = blocked
    const g = Array.from({ length: numGridElems }, () => Array(numGridElems).fill(0));
    const walls = [
        [0, 6], [0, 8], // This is preplaced walls
        [1, 2], [1, 3], [1, 8],
        [2, 5],
        [3, 1], [3, 7],
        [4, 3], [4, 9],
        [5, 1], [5, 5], [5, 6],
        [6, 4]
    ];
    for (const [r, c] of walls) {
        g[r][c] = 1;
    }
    return g;
}

function setup() {
    createCanvas(canvasSize, canvasSize);
    grid = {
        numElems: numGridElems,
        sizeElems: canvasSize / numGridElems,
        data: makeGrid()
    };
    computePath();
}

function computePath() {
    path = findPath(grid.data);
    if (path.length === 0) {
        throw new Error("No path exists from the monster spawn to the exit.");
    }
}

function findPath(gridData) {
    if (gridData[start[0]][start[1]] === 1 || gridData[target[0]][target[1]] === 1) {
        return [];
    }
    const graph = new BinaryMatrixGraph(gridData, grid.numElems, grid.numElems);
    return shortestPathBFS(start, target, graph);
}

function isPathCell(row, col) {
    return path.some(cell => cell[0] === row && cell[1] === col);
}


// ---------------- Monsters ----------------

function createMonster() {
    return {
        x: start[1] * grid.sizeElems + grid.sizeElems / 2,
        y: start[0] * grid.sizeElems + grid.sizeElems / 2,
        pathIndex: 0,
        speed: monsterspeed1,
        health: monsterhealth1,
        damage: monsterdamage1,
        isAlive: true,
        reachedEnd: false
    };
}

function createBoss() {
    let boss = createMonster();
    boss.speed = bossspeed;
    boss.health = bosshealth;
    boss.isBoss = true;
    return boss;
}

function moveMonster(monster) {
    if (monster.pathIndex >= path.length - 1) {
        health -= monster.damage;
        monster.reachedEnd = true; // Mark the monster as having reached the end
        return monster;
    }

    let nextCell = path[monster.pathIndex + 1];
    let targetX = nextCell[1] * grid.sizeElems + grid.sizeElems / 2;
    let targetY = nextCell[0] * grid.sizeElems + grid.sizeElems / 2;

    let dx = targetX - monster.x;
    let dy = targetY - monster.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < monster.speed) {
        monster.x = targetX;
        monster.y = targetY;
        monster.pathIndex++;
    } else {
        monster.x += (dx / distance) * monster.speed;
        monster.y += (dy / distance) * monster.speed;
    }
    return monster;
}

function drawMonster(monster) {
    fill(monster.isBoss ? "red" : color(50, 191, 165));
    let size = monster.isBoss ? 0.9 : 0.6;
    ellipse(monster.x, monster.y, grid.sizeElems * size, grid.sizeElems * size);
}

function startwave() {
    waveActive = true;
    monstersspawned = 0;
    monstersinwave = 25;
bossinwave = (waveNumber > 0 && waveNumber % 3 === 0) ? 1 : 0;
    bossspawned = false;
}

function updateWave() {
    if (waveActive === false) {
        return; // No wave is currently active
    }
    if (monstersspawned >= monstersinwave && (!bossinwave || bossspawned)) {
        waveActive = false; // All monsters in the wave have been spawned
        return;
    }
    if (framecount - lastMonsterSpawnTime >= monsterspawninterval) {
        if (monstersspawned < monstersinwave) {
            monsters.push(createMonster());
            monstersspawned++;
        } else if (bossinwave && !bossspawned) {
            monsters.push(createBoss());
            bossspawned = true;
        }
        lastMonsterSpawnTime = framecount;
    }
}

function updatemonsters() {
    for (let i = monsters.length - 1; i >= 0; i--) {
        let m = monsters[i];

        // Killed by a tower
        if (m.health <= 0) {
            monsters.splice(i, 1);
            monstersKilled++;
            money += killReward;
            continue;
        }

        m = moveMonster(m);

        // Reached the end (does NOT count as a kill)
        if (m.reachedEnd) {
            monsters.splice(i, 1);
            continue;
        }

        drawMonster(m);
        monsters[i] = m;
    }
}

function isWaveFinished() {
    return waveActive === false && monsters.length === 0;
}

// ---------------- Towers ----------------

// Current price of the next tower (recalculated every time it is needed)
function getTowerCost() {
    return towerBaseCost + numberoftowers * towerCostIncrease;
}

// Get mouse position in grid coordinates
function mousePositionInGrid() {
    let col = floor(mouseX / grid.sizeElems);
    let row = floor(mouseY / grid.sizeElems);
    return {col: col, row: row};
}

function toggleWall(row, col) {
    const isPlacingWall = grid.data[row][col] === 0;

    if (isPlacingWall && money < costOfWall) {
        return;
    }

    if (isPlacingWall && towers.some(tower => tower.row === row && tower.col === col)) {
        return;
    }

    const updatedGrid = grid.data.map(gridRow => gridRow.slice());
    updatedGrid[row][col] = isPlacingWall ? 1 : 0;
    const updatedPath = findPath(updatedGrid);

    if (updatedPath.length === 0) {
        wallPlacementErrorUntil = framecount + 180;
        return;
    }

    grid.data = updatedGrid;
    path = updatedPath;
    if (isPlacingWall) {
        money -= costOfWall;
    }
}

// Check if a tower is at the clicked position
function getTowerAtPosition(col, row) {
    for (let i = 0; i < towers.length; i++) {
        let tower = towers[i];
        let towerX = tower.col * grid.sizeElems + grid.sizeElems / 2;
        let towerY = tower.row * grid.sizeElems + grid.sizeElems / 2;
        let clickX = col * grid.sizeElems + grid.sizeElems / 2;
        let clickY = row * grid.sizeElems + grid.sizeElems / 2;
        let distance = dist(clickX, clickY, towerX, towerY);
        if (distance < grid.sizeElems) {
            return i;
        }
    }
    return -1;
}

function updateTowerAttacks() {
    for (let tower of towers) {
        if (tower.cooldown > 0) {
            tower.cooldown--;
            continue;
        }

        let towerX = tower.col * grid.sizeElems + grid.sizeElems / 2;
        let towerY = tower.row * grid.sizeElems + grid.sizeElems / 2;
        let target = null;
        let nearestDistance = Infinity;

        for (let monster of monsters) {
            if (monster.reachedEnd || monster.health <= 0) continue;

            let distance = dist(towerX, towerY, monster.x, monster.y);
            if (distance <= towerRadius * grid.sizeElems && distance < nearestDistance) {
                target = monster;
                nearestDistance = distance;
            }
        }

        if (target) {
            target.health -= towerdps;
            tower.cooldown = towerCooldown;
            // Remember the shot so it can be drawn for a few frames
            tower.shot = {x1: towerX, y1: towerY, x2: target.x, y2: target.y, frame: framecount};
        }
    }
}

function drawShots() {
    for (let tower of towers) {
        if (tower.shot && framecount - tower.shot.frame < shotDuration) {
            stroke(255, 255, 0);
            strokeWeight(3);
            line(tower.shot.x1, tower.shot.y1, tower.shot.x2, tower.shot.y2);
        }
    }
    stroke(0);
    strokeWeight(1);
}

// ---------------- p5 ----------------


function draw() {
    framecount++;
    background(95, 135, 49);
    stroke(0);
    strokeWeight(1);

    // Draw grid x axes
    for (let i = 0; i < grid.numElems; i++) {
        line(0, i * grid.sizeElems, width, i * grid.sizeElems);
    }
    // Draw grid y axes
    for (let i = 0; i < grid.numElems; i++) {
        line(i * grid.sizeElems, 0, i * grid.sizeElems, canvasSize);
    }

    // Draw blocked cells and the route found by BFS
    for (let i = 0; i < grid.numElems; i++) {
        for (let j = 0; j < grid.numElems; j++) {
            if (grid.data[i][j] === 1) {
                fill(55, 66, 88);
                rect(j * grid.sizeElems, i * grid.sizeElems, grid.sizeElems);
            } else if (isPathCell(i, j)) {
                fill(176, 136, 93);
                rect(j * grid.sizeElems, i * grid.sizeElems, grid.sizeElems);
            }
        }
    }

    // Size of tower in pixels
    let towerSize = 30;

    // Draw radius for selected tower
    if (selectedTowerIndex >= 0 && selectedTowerIndex < towers.length) {
        let tower = towers[selectedTowerIndex];
        let x = tower.col * grid.sizeElems + grid.sizeElems / 2;
        let y = tower.row * grid.sizeElems + grid.sizeElems / 2;
        let radiusPixels = towerRadius * grid.sizeElems;
        fill(100, 150, 255, 30);
        stroke(100, 150, 255, 60);
        strokeWeight(1);
        circle(x, y, radiusPixels * 2);
        stroke(0);
        strokeWeight(1);
    }

    // Draw towers that have been placed
    fill(0, 0, 0);
    for (let tower of towers) {
        let x = tower.col * grid.sizeElems + grid.sizeElems / 2;
        let y = tower.row * grid.sizeElems + grid.sizeElems / 2;
        circle(x, y, towerSize);
    }

    // Draws a preview of where the tower is going to be placed
    let col = floor(mouseX / grid.sizeElems);
    let row = floor(mouseY / grid.sizeElems);
    if (money >= getTowerCost()) {
        if (col >= 0 && col < grid.numElems && row >= 0 && row < grid.numElems) {
            if (grid.data[row][col] === 0 && !isPathCell(row, col)) {
                let x = col * grid.sizeElems + grid.sizeElems / 2;
                let y = row * grid.sizeElems + grid.sizeElems / 2;
                fill(0, 0, 0, 100);
                circle(x, y, towerSize);
            }           }
    }

    // Start a wave once the countdown has passed
    if (waitingForWave && (framecount - waveCountdownStart >= waveDelay)) {
        waitingForWave = false;
        startwave();
    }

    // Game logic - each is called exactly once per frame
    updateWave();
    updateTowerAttacks();
    updatemonsters();
    drawShots();

    // Draw text for health, money, tower cost, and monster stats
    stroke(0);
    strokeWeight(1);
    fill("white");
    textSize(16);
    textAlign(LEFT, TOP);
    text("Health: " + health, 6, 15);
    text("Money: " + money, 6, 30);
    text("Tower Cost: " + getTowerCost(), 6, 45);
    text("Wall Cost: " + costOfWall, 6, 60);
    text("Monsters Killed: " + monstersKilled, 6, 75);
    text("Wave: " + waveNumber, 6, 90);
    if (framecount < wallPlacementErrorUntil) {
        fill("red");
        textAlign(CENTER, TOP);
        text("You cant blocked the monster completely", width / 2, 95);
        textAlign(LEFT, TOP);
    }

    // Show a countdown while waiting for the next wave
    if (waitingForWave) {
        let secondsLeft = ceil((waveDelay - (framecount - waveCountdownStart)) / 60);
        fill("white");
        textSize(24);
        textAlign(CENTER, CENTER);
        text("Next wave in: " + secondsLeft, 250, 45);
    }

    // Once a wave is finished, start counting down to the next one
    if (isWaveFinished() && !waitingForWave) {
        waveNumber++;
        monsterhealth1 += 50;
        waitingForWave = true;
        waveCountdownStart = framecount;
    }

    // Game over
    if (health <= 0 || waveNumber === 30) {
        highScore_mk = max(highScore_mk, monstersKilled);
        highScore_wn = max(highScore_wn, waveNumber - 1); // Waves actually completed
        background(0);
        fill("White");
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(30);
        text("Game Over - Your Score: " + monstersKilled + "\nYour Highscore: " + highScore_mk + " monsters killed" + "\nMax wave cleared: " + highScore_wn + "\nLeft-click to restart", width / 2, height / 2);
        noLoop(); // Stops the draw loop when the game is over
    }
}

function mousePressed(event) {
    if (health <= 0 || waveNumber === 4) {
        health = 100;                     // Reset health
        money = 500;                     // Reset money
        monsters = [];                  // Reset the monsters array
        monstersKilled = 0;            // Reset the number of monsters killed
        waveNumber = 1;               // Reset wave number
        monsterhealth1 = 100;          // Reset monster health scaling
        towers = [];                 // Reset placed towers
        selectedTowerIndex = -1;    // Reset selected tower
        waveActive = false;        // Reset wave state
        bossinwave = 0;            // Reset boss state
        bossspawned = false;
        monstersspawned = 0;      // Reset spawn counter
        waitingForWave = true;   // Delay applies again before the first wave
        waveCountdownStart = framecount; // Restart the countdown from now
        numberoftowers = 0;             // Reset number of towers (and therefore the price)
        grid.data = makeGrid();         // Restore the original wall layout
        computePath();
        wallPlacementErrorUntil = 0;
        loop();                        // Restart the draw loop
        return;
    }

    let mousePosition = mousePositionInGrid();

    // Ignore clicks outside the canvas
    if (mousePosition.col < 0 || mousePosition.col >= grid.numElems || mousePosition.row < 0 || mousePosition.row >= grid.numElems) {
        return;
    }

    // if (event && event.button === 2) {
    //     toggleWall(mousePosition.row, mousePosition.col);
    //     return false;
    // } DET HER SKAL GØRES SÅ AT MAN IKKE KAN SÆTTE VÆGGE I MENS WAVE ER AKTIV
    

    // Check if clicking on an existing tower
    let towerIndex = getTowerAtPosition(mousePosition.col, mousePosition.row);
    if (towerIndex >= 0) {
        selectedTowerIndex = towerIndex;
        return;
    }

    // Keep towers off blocked cells and the monster route
    if (grid.data[mousePosition.row][mousePosition.col] === 1 || isPathCell(mousePosition.row, mousePosition.col)) {
        return;
    }

    // Check if money is sufficient compared to tower cost
    if (money < getTowerCost()) {
        return;
    }

    // Place tower
    money -= getTowerCost();
    towers.push({row: mousePosition.row, col: mousePosition.col, cooldown: 0, shot: null});
    numberoftowers++;
    selectedTowerIndex = towers.length - 1;
}