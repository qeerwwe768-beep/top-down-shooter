// ==================получаем canvas и контекст===================

const canvas = document.getElementById("gameCanvas");

const ctx = canvas.getContext("2d");

// загрузка спрайта игрока
const playerImage = new Image();
playerImage.src = "Игрок1.png";

const bullets = []; // массив пуль

const enemies = []; // массив врагов

let score = 0; // счет очков

let gameOver = false;// конец игры

let gameStarted = false; //состояние игры

const explosions = []; // массив взрыва врага при попадании

let level = 1; // переменная уровня


//====================таймер спавна врагов=================
let enemySpawnTimer = 0;
let enemySpawnDelay = 60;; // примерно 1 секунда

//=====================функция очистки экрана===================
function clearScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ================тестовый объект — игрок===========================
const player = {
    x: 400,
    y: 300,
    width: 56,
    height: 56,
    color: "lime",
    speed: 4, // скорость передвижения
    lives: 3 ,// жизни игрока
    invincible: false,// неуязвимость после урона
invincibleTimer: 0,
invincibleDuration: 60 // ~1 секунда
};
//================Отслеживаем нажатия клавиш================

const keys = {};// нажате кнопки

// нажали клавишу
document.addEventListener("keydown", (e) => {
    keys[e.key] = true;

    // старт игры
    if (!gameStarted && e.key === "Enter") {
        gameStarted = true;
        gameLoop();
    }

    // стрельба ТОЛЬКО после старта
    if (gameStarted && e.code === "Space") {
        shoot();
    }
     
    if (gameOver && e.key === "r") {
        resetGame();
    }
});

// отпустили клавишу
window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});
//==================функция стрельбы======================
function shoot() {
    bullets.push({
        x: player.x + player.width / 2 - 4,
        y: player.y,
        width: 8,
        height: 16,
        speed: 7
    });
}
//==================функция движения и отрисовки пуль=============
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;

        // удаляем пулю, если она улетела
        if (bullets[i].y + bullets[i].height < 0) {
            bullets.splice(i, 1);
        }
    }
}

function drawBullets() {
    ctx.fillStyle = "yellow";
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

//===================Функция движения игрока================
function movePlayer() {
    if (keys["w"]) {
        player.y -= player.speed;
    }
    if (keys["s"]) {
        player.y += player.speed;
    }
    if (keys["a"]) {
        player.x -= player.speed;
    }
    if (keys["d"]) {
        player.x += player.speed;
    }

    // ограничения по краям
    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
    }
}

// ==================функция рисования игрока и мгания при получении урона====================
function drawPlayer() {
    // эффект мигания при неуязвимости
    if (player.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        return;
    }
// отрисовка изображения
    ctx.drawImage(
        playerImage,
        player.x,
        player.y,
        player.width,
        player.height
    );
}
//=====================функция спавна врагов======================
function spawnEnemy() {
    const size = 40;
    enemies.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: 2
    });
}
//=====================функция обновления врагов===================
function updateEnemies() {
    enemySpawnTimer++;

    if (enemySpawnTimer >= enemySpawnDelay) {
        spawnEnemy();
        enemySpawnTimer = 0;
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemies[i].speed;

        // удаляем если вышел за экран
        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
        }
    }
}
//====================функция отрисовки врагов====================
function drawEnemies() {
    ctx.fillStyle = "red";
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}
//========================функция столкновения=================
function isColliding(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}
//======================функция проверки попадания==================
function checkBulletEnemyCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (isColliding(bullets[i], enemies[j])) {
                // удаляем пулю и врага
                createExplosion(
    enemies[j].x + enemies[j].width / 2,
    enemies[j].y + enemies[j].height / 2
);

bullets.splice(i, 1);
enemies.splice(j, 1);
score++;
                break;
            }
        }
    }
}
//=====================функция отрисовки счета===============
function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Очки: " + score, 10, 25);
}

//======================функция столкновения игрока и врага=================
function checkEnemyPlayerCollisions() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (isColliding(player, enemies[i])) {

            if (!player.invincible) {
                player.lives--;
                player.invincible = true;
                player.invincibleTimer = player.invincibleDuration;
            }

            enemies.splice(i, 1);
        }
    }
}

//===================функция конец игры===============
function checkGameOver() {
    if (player.lives <= 0) {
        gameOver = true;
    }
}
//=============================отрисовка жизней===========================
function drawLives() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Жизни: " + player.lives, 10, 50);
}

//==========================экран конец игры============================
function drawGameOver() {
    clearScreen();
    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    ctx.font = "48px Arial";
    ctx.fillText("ИГРА ОКОНЧЕНА", canvas.width / 2, canvas.height / 2);

    ctx.font = "24px Arial";
    ctx.fillText("Очки: " + score, canvas.width / 2, canvas.height / 2 + 40);

    ctx.font = "18px Arial";
    ctx.fillText("Нажмите R чтобы начать заново", canvas.width / 2, canvas.height / 2 + 80);
}
// ========================обновление таймера неуязвимости===================
function updateInvincibility() {
    if (player.invincible) {
        player.invincibleTimer--;

        if (player.invincibleTimer <= 0) {
            player.invincible = false;
        }
    }
}

//======================создание взрыва при попадании во врага==============
function createExplosion(x, y) {
    explosions.push({
        x: x,
        y: y,
        radius: 5,
        maxRadius: 25,
        life: 15
    });
}
//=====================обновление взрыва =====================
function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].radius += 2;
        explosions[i].life--;

        if (explosions[i].life <= 0) {
            explosions.splice(i, 1);
        }
    }
}
//=======================отрисовка взрыва ===================
function drawExplosions() {
    ctx.strokeStyle = "orange";
    ctx.lineWidth = 2;

    explosions.forEach(explosion => {
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.stroke();
    });
}
//======================обновление сложности==============
function updateDifficulty() {
    level = Math.floor(score / 10) + 1;

    // ограничим, чтобы не стало адом 😄
    enemySpawnDelay = Math.max(20, 60 - level * 5);
}
//======================увеличение скорости врагов====================
function spawnEnemy() {
    const size = 40;
    enemies.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: 2 + level * 0.3
    });
}
//==========================отрисовак уровня=======================
function drawLevel() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Уровень: " + level, 10, 75);
}

//==========================функция сброса игры================
function resetGame() {
    score = 0;
    level = 1;
    gameOver = false;

    bullets.length = 0;
    enemies.length = 0;
    explosions.length = 0;

    player.x = 400;
    player.y = 300;
    player.lives = 3;
    player.invincible = false;
    player.invincibleTimer = 0;

    enemySpawnTimer = 0;

    gameLoop();
}
//======================= 
function drawStartScreen() {
    clearScreen();

    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    ctx.font = "48px Arial";
    ctx.fillText(
        "SPACE PUGNATOR",
        canvas.width / 2,
        canvas.height / 2 - 40
    );

    ctx.font = "24px Arial";
    ctx.fillText(
        "Нажмите ENTER чтобы начать",
        canvas.width / 2,
        canvas.height / 2 + 20
    );
}

// ====================игровой цикл=======================
function gameLoop() {

    if (!gameStarted) {
        drawStartScreen();
        return;
    }

    if (gameOver) {
        drawGameOver();
        return;
    }

    clearScreen();
    movePlayer();
    updateBullets();
    updateEnemies();
    updateInvincibility();
    updateExplosions();
    updateDifficulty();
    checkBulletEnemyCollisions();
    checkEnemyPlayerCollisions();
    checkGameOver();
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawExplosions();
    drawScore();
    drawLives();
    drawLevel();
    requestAnimationFrame(gameLoop);
}
// ===================запуск игры===========================
drawStartScreen();
