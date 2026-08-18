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


// ========================================
// 화면
// ========================================

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);


// ========================================
// 게임 상태
// ========================================

let gameRunning = false;

let survivalTime = 0;

let arrows = [];

let spawnTimer = 0;

let lastTime = 0;


// ========================================
// 키보드
// ========================================

const keys = {};

window.addEventListener("keydown", (event) => {

    if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
    ) {
        event.preventDefault();
    }

    keys[event.key] = true;
});


window.addEventListener("keyup", (event) => {
    keys[event.key] = false;
});


// ========================================
// 플레이어
// ========================================

const player = {

    x: 0,
    y: 0,

    radius: 18,

    speed: 330
};


function resetPlayer() {

    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
}


// ========================================
// 게임 시작
// ========================================

function startGame() {

    gameRunning = true;

    survivalTime = 0;

    arrows = [];

    spawnTimer = 0;

    resetPlayer();

    startScreen.style.display = "none";
    gameOverScreen.style.display = "none";

    lastTime = performance.now();

    requestAnimationFrame(gameLoop);
}


// ========================================
// 게임 오버
// ========================================

function gameOver() {

    gameRunning = false;

    const score =
        survivalTime.toFixed(2);

    finalTime.textContent =
        "생존 시간 : " + score + "초";

    gameOverScreen.style.display = "flex";
}


// ========================================
// 플레이어 이동
// ========================================

function updatePlayer(deltaTime) {

    let dx = 0;
    let dy = 0;


    if (keys["ArrowUp"]) {
        dy -= 1;
    }

    if (keys["ArrowDown"]) {
        dy += 1;
    }

    if (keys["ArrowLeft"]) {
        dx -= 1;
    }

    if (keys["ArrowRight"]) {
        dx += 1;
    }


    // 대각선 이동 속도 보정

    if (dx !== 0 || dy !== 0) {

        const length =
            Math.sqrt(dx * dx + dy * dy);

        dx /= length;
        dy /= length;

        player.x +=
            dx * player.speed * deltaTime;

        player.y +=
            dy * player.speed * deltaTime;
    }


    // 화면 밖으로 나가지 않게

    player.x = Math.max(
        player.radius,
        Math.min(
            canvas.width - player.radius,
            player.x
        )
    );


    player.y = Math.max(
        player.radius,
        Math.min(
            canvas.height - player.radius,
            player.y
        )
    );
}


// ========================================
// 화살 생성
// ========================================

function spawnArrow() {

    /*
        화면 밖에서 화살을 생성한다.

        8방향에서 들어오는 느낌을 만들기 위해
        랜덤한 각도를 사용한다.
    */

    const angle =
        Math.random() * Math.PI * 2;


    // 화면 중심에서 충분히 멀리 생성

    const distance =
        Math.max(
            canvas.width,
            canvas.height
        ) * 0.75;


    const startX =
        player.x +
        Math.cos(angle) * distance;


    const startY =
        player.y +
        Math.sin(angle) * distance;


    /*
        기본적으로 플레이어 방향을 향한다.

        약간의 오차를 넣어서
        모든 화살이 정확히 같은 위치를
        향하지 않도록 한다.
    */

    const targetAngle =
        Math.atan2(
            player.y - startY,
            player.x - startX
        );


    const spread =
        (Math.random() - 0.5) * 0.25;


    const finalAngle =
        targetAngle + spread;


    // 시간이 지나면 빨라진다.

    const speed =
        260 +
        Math.min(
            survivalTime * 8,
            500
        );


    arrows.push({

        x: startX,
        y: startY,

        angle: finalAngle,

        speed: speed,

        length: 65,

        headLength: 18,

        headWidth: 10
    });
}


// ========================================
// 화살 업데이트
// ========================================

function updateArrows(deltaTime) {

    for (
        let i = arrows.length - 1;
        i >= 0;
        i--
    ) {

        const arrow = arrows[i];


        arrow.x +=
            Math.cos(arrow.angle) *
            arrow.speed *
            deltaTime;


        arrow.y +=
            Math.sin(arrow.angle) *
            arrow.speed *
            deltaTime;


        /*
            화면에서 충분히 멀어지면 제거
        */

        const margin = 150;


        if (
            arrow.x < -margin ||
            arrow.x > canvas.width + margin ||
            arrow.y < -margin ||
            arrow.y > canvas.height + margin
        ) {

            arrows.splice(i, 1);
        }
    }
}


// ========================================
// 화살촉 충돌 판정
// ========================================

function checkArrowCollision() {

    for (const arrow of arrows) {

        /*
            화살촉 위치 계산

            화살의 중심이 아니라
            실제 앞부분을 위험 판정으로 사용한다.
        */

        const tipX =
            arrow.x +
            Math.cos(arrow.angle) *
            (arrow.length / 2);


        const tipY =
            arrow.y +
            Math.sin(arrow.angle) *
            (arrow.length / 2);


        const dx =
            tipX - player.x;


        const dy =
            tipY - player.y;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        /*
            화살촉만 캐릭터에 닿으면 사망.

            화살대는 최대한 판정에서 제외한다.
        */

        if (
            distance <
            player.radius + 7
        ) {

            gameOver();

            return true;
        }
    }


    return false;
}


// ========================================
// 난이도 / 화살 생성
// ========================================

function updateArrowSpawn(deltaTime) {

    spawnTimer += deltaTime;


    /*
        초반에는 여유롭게

        시간이 지날수록
        화살 생성 간격을 줄인다.
    */

    let spawnInterval;


    if (survivalTime < 5) {

        spawnInterval = 0.55;

    } else if (survivalTime < 10) {

        spawnInterval = 0.30;

    } else if (survivalTime < 20) {

        spawnInterval = 0.16;

    } else {

        spawnInterval = 0.10;
    }


    if (spawnTimer >= spawnInterval) {

        spawnTimer = 0;

        spawnArrow();


        /*
            후반에는 한 번에
            여러 개가 들어오기도 한다.
        */

        if (survivalTime >= 10) {

            if (Math.random() < 0.35) {
                spawnArrow();
            }
        }


        if (survivalTime >= 20) {

            if (Math.random() < 0.45) {
                spawnArrow();
            }
        }
    }
}


// ========================================
// 배경
// ========================================

function drawBackground() {

    ctx.fillStyle = "#17331c";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    /*
        대나무 숲
    */

    for (
        let x = -20;
        x < canvas.width + 50;
        x += 70
    ) {

        const bend =
            Math.sin(x * 0.08) * 12;


        // 대나무 줄기

        ctx.strokeStyle = "#294d2c";

        ctx.lineWidth = 14;

        ctx.beginPath();

        ctx.moveTo(
            x + bend,
            -30
        );

        ctx.lineTo(
            x - bend,
            canvas.height + 30
        );

        ctx.stroke();


        // 대나무 마디

        ctx.strokeStyle = "#1d3b21";

        ctx.lineWidth = 4;


        for (
            let y = 50;
            y < canvas.height;
            y += 80
        ) {

            ctx.beginPath();

            ctx.moveTo(
                x - 9 + bend,
                y
            );

            ctx.lineTo(
                x + 9 + bend,
                y
            );

            ctx.stroke();
        }
    }


    /*
        바닥 느낌
    */

    ctx.fillStyle =
        "rgba(80, 110, 65, 0.15)";

    ctx.fillRect(
        0,
        canvas.height * 0.72,
        canvas.width,
        canvas.height * 0.28
    );
}


// ========================================
// 플레이어 그리기
// ========================================

function drawPlayer() {

    /*
        그림자
    */

    ctx.fillStyle =
        "rgba(0, 0, 0, 0.35)";

    ctx.beginPath();

    ctx.ellipse(
        player.x,
        player.y + 15,
        22,
        9,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
        몸
    */

    ctx.fillStyle = "#d6a85c";

    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y + 3,
        16,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
        얼굴
    */

    ctx.fillStyle = "#f0c28a";

    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y - 4,
        10,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
        삿갓
    */

    ctx.fillStyle = "#40352b";

    ctx.beginPath();

    ctx.ellipse(
        player.x,
        player.y - 12,
        23,
        8,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
        삿갓 중심
    */

    ctx.beginPath();

    ctx.moveTo(
        player.x - 9,
        player.y - 13
    );

    ctx.lineTo(
        player.x,
        player.y - 26
    );

    ctx.lineTo(
        player.x + 9,
        player.y - 13
    );

    ctx.closePath();

    ctx.fill();


    /*
        얼굴 가리개
    */

    ctx.strokeStyle = "#2b251f";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        player.x - 12,
        player.y - 9
    );

    ctx.lineTo(
        player.x + 12,
        player.y - 9
    );

    ctx.stroke();
}


// ========================================
// 화살 그리기
// ========================================

function drawArrow(arrow) {

    ctx.save();

    ctx.translate(
        arrow.x,
        arrow.y
    );

    ctx.rotate(
        arrow.angle
    );


    /*
        화살대
    */

    ctx.strokeStyle = "#8a5c32";

    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.moveTo(
        -arrow.length / 2,
        0
    );

    ctx.lineTo(
        arrow.length / 2,
        0
    );

    ctx.stroke();


    /*
        화살 깃털
    */

    ctx.strokeStyle = "#d6d6c2";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.moveTo(
        -arrow.length / 2,
        0
    );

    ctx.lineTo(
        -arrow.length / 2 - 12,
        -7
    );

    ctx.moveTo(
        -arrow.length / 2,
        0
    );

    ctx.lineTo(
        -arrow.length / 2 - 12,
        7
    );

    ctx.stroke();


    /*
        화살촉

        ★ 실제 위험 부분
    */

    ctx.fillStyle = "#bfc4c8";

    ctx.beginPath();

    ctx.moveTo(
        arrow.length / 2 + 12,
        0
    );

    ctx.lineTo(
        arrow.length / 2 - 5,
        -arrow.headWidth / 2
    );

    ctx.lineTo(
        arrow.length / 2 - 5,
        arrow.headWidth / 2
    );

    ctx.closePath();

    ctx.fill();


    /*
        화살촉 테두리
    */

    ctx.strokeStyle = "#70757a";

    ctx.lineWidth = 2;

    ctx.stroke();


    ctx.restore();
}


// ========================================
// 모든 화살 그리기
// ========================================

function drawArrows() {

    for (const arrow of arrows) {
        drawArrow(arrow);
    }
}


// ========================================
// UI
// ========================================

function updateUI() {

    /*
        기존 UI와 호환시키기 위해
        HP/LEVEL 자리를 숨김 처리하지 않고
        각각 기록/난이도로 사용한다.
    */

    hpText.textContent =
        "SURVIVE";


    levelText.textContent =
        "ARROWS: " + arrows.length;


    timeText.textContent =
        survivalTime.toFixed(2);
}


// ========================================
// 게임 업데이트
// ========================================

function update(deltaTime) {

    survivalTime += deltaTime;


    updatePlayer(deltaTime);

    updateArrowSpawn(deltaTime);

    updateArrows(deltaTime);


    if (
        checkArrowCollision()
    ) {
        return;
    }


    updateUI();
}


// ========================================
// 그리기
// ========================================

function draw() {

    drawBackground();

    drawArrows();

    drawPlayer();
}


// ========================================
// 게임 루프
// ========================================

function gameLoop(currentTime) {

    if (!gameRunning) {
        return;
    }


    const deltaTime =
        (currentTime - lastTime) / 1000;


    lastTime = currentTime;


    update(
        Math.min(
            deltaTime,
            0.05
        )
    );


    draw();


    if (gameRunning) {

        requestAnimationFrame(
            gameLoop
        );
    }
}


// ========================================
// 버튼
// ========================================

startButton.addEventListener(
    "click",
    startGame
);


restartButton.addEventListener(
    "click",
    startGame
);
