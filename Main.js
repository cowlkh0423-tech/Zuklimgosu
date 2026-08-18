const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const hpText = document.getElementById("hp");
const levelText = document.getElementById("level");
const timeText = document.getElementById("time");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const finalTime = document.getElementById("finalTime");


// =========================
// 화면 크기
// =========================

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);


// =========================
// 게임 변수
// =========================

let gameRunning = false;

let hp = 100;
let level = 1;

let gameTime = 0;

let enemies = [];
let bullets = [];

let lastTime = 0;
let enemyTimer = 0;
let shootTimer = 0;


// =========================
// 키보드
// =========================

const keys = {};

window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});


// =========================
// 플레이어
// =========================

const player = {
    x: 0,
    y: 0,

    width: 40,
    height: 40,

    speed: 350,

    color: "#d8b45a",

    attackSpeed: 0.25
};


function resetPlayer() {
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
}


// =========================
// 게임 시작
// =========================

function startGame() {

    gameRunning = true;

    hp = 100;
    level = 1;
    gameTime = 0;

    enemies = [];
    bullets = [];

    enemyTimer = 0;
    shootTimer = 0;

    resetPlayer();

    startScreen.style.display = "none";
    gameOverScreen.style.display = "none";

    updateUI();

    lastTime = performance.now();

    requestAnimationFrame(gameLoop);
}


// =========================
// 게임 오버
// =========================

function gameOver() {

    gameRunning = false;

    finalTime.textContent =
        "생존 시간: " + Math.floor(gameTime) + "초";

    gameOverScreen.style.display = "flex";
}


// =========================
// 플레이어 이동
// =========================

function updatePlayer(deltaTime) {

    let dx = 0;
    let dy = 0;

    if (keys["w"] || keys["arrowup"]) {
        dy -= 1;
    }

    if (keys["s"] || keys["arrowdown"]) {
        dy += 1;
    }

    if (keys["a"] || keys["arrowleft"]) {
        dx -= 1;
    }

    if (keys["d"] || keys["arrowright"]) {
        dx += 1;
    }


    // 대각선 이동 속도 보정

    if (dx !== 0 || dy !== 0) {

        const length = Math.sqrt(dx * dx + dy * dy);

        dx /= length;
        dy /= length;

        player.x += dx * player.speed * deltaTime;
        player.y += dy * player.speed * deltaTime;
    }


    // 화면 밖으로 못 나가게

    const halfWidth = player.width / 2;
    const halfHeight = player.height / 2;

    player.x = Math.max(
        halfWidth,
        Math.min(canvas.width - halfWidth, player.x)
    );

    player.y = Math.max(
        halfHeight,
        Math.min(canvas.height - halfHeight, player.y)
    );
}


// =========================
// 총알 발사
// =========================

function shoot() {

    bullets.push({
        x: player.x,
        y: player.y - 20,

        radius: 5,

        speed: 700,

        damage: 25
    });
}


// =========================
// 총알 업데이트
// =========================

function updateBullets(deltaTime) {

    for (let i = bullets.length - 1; i >= 0; i--) {

        const bullet = bullets[i];

        bullet.y -= bullet.speed * deltaTime;


        // 화면 밖

        if (bullet.y < -20) {
            bullets.splice(i, 1);
        }
    }
}


// =========================
// 적 생성
// =========================

function spawnEnemy() {

    const side = Math.floor(Math.random() * 4);

    let x;
    let y;


    if (side === 0) {
        x = Math.random() * canvas.width;
        y = -40;
    }

    else if (side === 1) {
        x = canvas.width + 40;
        y = Math.random() * canvas.height;
    }

    else if (side === 2) {
        x = Math.random() * canvas.width;
        y = canvas.height + 40;
    }

    else {
        x = -40;
        y = Math.random() * canvas.height;
    }


    const enemyLevel = Math.floor(gameTime / 20);

    enemies.push({

        x: x,
        y: y,

        radius: 20,

        speed: 70 + enemyLevel * 10,

        hp: 50 + enemyLevel * 10,

        damage: 10,

        color: "#7a4a32"
    });
}


// =========================
// 적 이동
// =========================

function updateEnemies(deltaTime) {

    for (const enemy of enemies) {

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {

            enemy.x +=
                (dx / distance) *
                enemy.speed *
                deltaTime;

            enemy.y +=
                (dy / distance) *
                enemy.speed *
                deltaTime;
        }
    }
}


// =========================
// 충돌 판정
// =========================

function checkCollisions() {

    // 총알 ↔ 적

    for (let i = bullets.length - 1; i >= 0; i--) {

        const bullet = bullets[i];

        for (let j = enemies.length - 1; j >= 0; j--) {

            const enemy = enemies[j];

            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;

            const distance =
                Math.sqrt(dx * dx + dy * dy);


            if (distance < enemy.radius + bullet.radius) {

                enemy.hp -= bullet.damage;

                bullets.splice(i, 1);

                if (enemy.hp <= 0) {
                    enemies.splice(j, 1);
                }

                break;
            }
        }
    }


    // 플레이어 ↔ 적

    for (let i = enemies.length - 1; i >= 0; i--) {

        const enemy = enemies[i];

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;

        const distance =
            Math.sqrt(dx * dx + dy * dy);


        if (
            distance <
            enemy.radius +
            Math.max(player.width, player.height) / 2
        ) {

            hp -= enemy.damage;

            enemies.splice(i, 1);

            if (hp <= 0) {

                hp = 0;

                updateUI();

                gameOver();

                return;
            }
        }
    }
}


// =========================
// 레벨 업데이트
// =========================

function updateLevel() {

    level =
        Math.floor(gameTime / 15) + 1;
}


// =========================
// UI
// =========================

function updateUI() {

    hpText.textContent =
        "HP: " + Math.max(0, Math.floor(hp));

    levelText.textContent =
        "LEVEL: " + level;

    timeText.textContent =
        "TIME: " + Math.floor(gameTime);
}


// =========================
// 배경
// =========================

function drawBackground() {

    ctx.fillStyle = "#18251b";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // 대나무

    for (
        let x = 0;
        x < canvas.width;
        x += 80
    ) {

        const offset =
            Math.sin(x * 0.1) * 10;

        ctx.strokeStyle = "#314b32";
        ctx.lineWidth = 12;

        ctx.beginPath();

        ctx.moveTo(
            x + offset,
            0
        );

        ctx.lineTo(
            x - offset,
            canvas.height
        );

        ctx.stroke();


        // 대나무 마디

        ctx.strokeStyle = "#223824";
        ctx.lineWidth = 4;

        for (
            let y = 50;
            y < canvas.height;
            y += 80
        ) {

            ctx.beginPath();

            ctx.moveTo(
                x - 7 + offset,
                y
            );

            ctx.lineTo(
                x + 7 + offset,
                y
            );

            ctx.stroke();
        }
    }
}


// =========================
// 플레이어 그리기
// =========================

function drawPlayer() {

    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );


    // 몸

    ctx.fillStyle = player.color;

    ctx.beginPath();

    ctx.moveTo(0, -25);
    ctx.lineTo(20, 20);
    ctx.lineTo(0, 12);
    ctx.lineTo(-20, 20);

    ctx.closePath();

    ctx.fill();


    // 코어

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        6,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();
}


// =========================
// 적 그리기
// =========================

function drawEnemies() {

    for (const enemy of enemies) {

        ctx.fillStyle = enemy.color;

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            enemy.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();


        // 눈

        ctx.fillStyle = "#ffffff";

        ctx.beginPath();

        ctx.arc(
            enemy.x - 7,
            enemy.y - 4,
            4,
            0,
            Math.PI * 2
        );

        ctx.arc(
            enemy.x + 7,
            enemy.y - 4,
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


// =========================
// 총알 그리기
// =========================

function drawBullets() {

    ctx.fillStyle = "#ffffff";

    for (const bullet of bullets) {

        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


// =========================
// 게임 업데이트
// =========================

function update(deltaTime) {

    gameTime += deltaTime;

    updatePlayer(deltaTime);

    updateBullets(deltaTime);

    updateEnemies(deltaTime);

    checkCollisions();

    updateLevel();


    // 적 생성

    enemyTimer += deltaTime;

    const spawnInterval =
        Math.max(
            0.25,
            1.2 - gameTime * 0.01
        );


    if (enemyTimer >= spawnInterval) {

        enemyTimer = 0;

        spawnEnemy();
    }


    // 자동 공격

    shootTimer += deltaTime;

    if (shootTimer >= player.attackSpeed) {

        shootTimer = 0;

        shoot();
    }


    updateUI();
}


// =========================
// 화면 그리기
// =========================

function draw() {

    drawBackground();

    drawBullets();

    drawEnemies();

    drawPlayer();
}


// =========================
// 메인 게임 루프
// =========================

function gameLoop(currentTime) {

    if (!gameRunning) {
        return;
    }


    const deltaTime =
        (currentTime - lastTime) / 1000;

    lastTime = currentTime;


    update(
        Math.min(deltaTime, 0.05)
    );

    draw();


    if (gameRunning) {

        requestAnimationFrame(gameLoop);
    }
}


// =========================
// 버튼
// =========================

startButton.addEventListener(
    "click",
    startGame
);

restartButton.addEventListener(
    "click",
    startGame
);
