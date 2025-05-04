const config = {
    maxFish: 10,
    spawnInterval: 1500,
    gameDuration: 60,
    fishSizes: {
        small: { class: 'small', points: 30, speed: 0.8 },
        medium: { class: 'medium', points: 20, speed: 0.5 },
        large: { class: 'large', points: 10, speed: 0.3 }
    }
};

// Game state
let score = 0;
let activeFish = 0;
let gameTimer;
let timeLeft = config.gameDuration;
let isPaused = false;
let gameInterval;
let playerName = '';
const fishElements = new Set();

// DOM elements
const startScreen = document.getElementById('start-screen');
const nameInput = document.getElementById('name-input');
const startButton = document.getElementById('start-button');
const gameContainer = document.getElementById('game-container');
const playerNameDisplay = document.getElementById('player-name');
const pauseButton = document.getElementById('pause-button');

// Инициализация игры
nameInput.addEventListener('input', () => {
    const name = nameInput.value.trim();
    startButton.disabled = name.length === 0;
});

startButton.addEventListener('click', startGame);
nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !startButton.disabled) startGame();
});

pauseButton.addEventListener('click', togglePause);
document.getElementById('restart-button').addEventListener('click', restartGame);

function startGame() {
    playerName = nameInput.value.trim();
    setupPlayerName();

    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';

    resetGameState();
    gameInterval = setInterval(createFish, config.spawnInterval);
    gameTimer = setInterval(updateTimer, 1000);
}

function setupPlayerName() {
    if (playerName.toLowerCase() === 'tester') {
        playerNameDisplay.classList.add('tester');
        playerNameDisplay.innerHTML = `👑 ${playerName} <small>(Тестовый режим)</small>`;
    } else {
        playerNameDisplay.textContent = `Игрок: ${playerName}`;
    }
}

function resetGameState() {
    score = 0;
    timeLeft = config.gameDuration;
    activeFish = 0;
    isPaused = false;
    document.getElementById('score').textContent = 'Очки: 0';
    document.getElementById('timer').textContent = '03:00';
    pauseButton.textContent = 'Пауза';
    fishElements.forEach(fish => removeFish(fish));
}

// Логика рыбок
function createFish() {
    if (isPaused || activeFish >= config.maxFish) return;

    const sizeKeys = Object.keys(config.fishSizes);
    const size = config.fishSizes[sizeKeys[Math.floor(Math.random() * sizeKeys.length)]];

    const fish = document.createElement('img');
    fish.className = `fish ${size.class}`;
    fish.src = getFishImage(size.class);

    const startSide = Math.random() > 0.5 ? 'left' : 'right';
    const startY = Math.random() * window.innerHeight * 0.8;

    Object.assign(fish.style, {
        [startSide]: '-100px',
        top: `${startY}px`,
        transform: `scaleX(${startSide === 'right' ? -1 : 1})`
    });

    gameContainer.appendChild(fish);
    fishElements.add(fish);
    activeFish++;

    animateFish(fish, size.speed, startSide);
    setupFishTimeout(fish);
    setupClickHandler(fish, size.points);
}

function getFishImage(size) {
    const images = {
        small: 'https://cdn-icons-png.flaticon.com/512/3085/3085833.png',
        medium: 'https://cdn-icons-png.flaticon.com/512/3085/3085823.png',
        large: 'https://cdn-icons-png.flaticon.com/512/3085/3085805.png'
    };
    return images[size];
}

function animateFish(fish, speed, startSide) {
    let x = startSide === 'left' ? -100 : window.innerWidth + 100;
    const y = parseFloat(fish.style.top);
    const angle = (Math.random() * 60 - 30) * Math.PI / 180;

    function animate() {
        if (isPaused) return;

        x += Math.cos(angle) * speed * (startSide === 'left' ? 1 : -1);
        const yPos = y + Math.sin(angle) * x * 0.1;

        fish.style.left = `${x}px`;
        fish.style.top = `${yPos}px`;

        if (x < -200 || x > window.innerWidth + 200) {
            removeFish(fish);
        } else {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

function setupFishTimeout(fish) {
    setTimeout(() => {
        if (fish.parentElement) removeFish(fish);
    }, 8000 + Math.random() * 4000);
}

function setupClickHandler(fish, points) {
    fish.addEventListener('click', () => {
        if (isPaused) return;

        score += points;
        document.getElementById('score').textContent = `Очки: ${score}`;
        fish.style.transform += ' scale(1.5)';
        fish.style.opacity = '0';
        setTimeout(() => removeFish(fish), 300);
    });
}

function removeFish(fish) {
    if (fish.parentElement) {
        fish.parentElement.removeChild(fish);
        fishElements.delete(fish);
        activeFish--;
    }
}

// Таймер и управление игрой
function updateTimer() {
    if (!isPaused) {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) endGame();
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('timer').textContent = `${minutes}:${seconds}`;
}

function togglePause() {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? 'Продолжить' : 'Пауза';
    if (isPaused) clearInterval(gameInterval);
    else gameInterval = setInterval(createFish, config.spawnInterval);
}

async function endGame() {
    clearInterval(gameTimer);
    clearInterval(gameInterval);
    fishElements.forEach(fish => removeFish(fish));

    document.getElementById('end-screen').style.display = 'flex';
    document.getElementById('final-score').textContent = `Ваш результат: ${score} очков`;
    document.getElementById('final-name').innerHTML = playerNameDisplay.innerHTML;
    gameContainer.style.display = 'none';
    await sendScoreToServer();
    await fetchLeaderboard();
}

function restartGame() {
    document.getElementById('end-screen').style.display = 'none';
    startScreen.style.display = 'flex';
    gameContainer.style.display = 'none';
    nameInput.value = '';
    startButton.disabled = true;
}

function sendScoreToServer() {
    const data = {
        username: playerName,
        score: score
    };

    fetch('http://localhost:8081/api/save-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => {
            if (!response.ok) throw new Error('Ошибка сохранения');
            console.log('Результат сохранен');
        })
        .catch(error => {
            console.error('Ошибка:', error);
        });
}

// Новые функции
async function fetchLeaderboard() {
    try {
        const response = await fetch('http://localhost:8081/api/leaderboard');
        const data = await response.json();
        updateLeaderboard(data);
    } catch (error) {
        console.error('Ошибка загрузки списка лидеров:', error);
    }
}

function updateLeaderboard(players) {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';

    players.forEach((player, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${index + 1}. ${player.username} - ${player.score}`;
        list.appendChild(li);
    });
}

// Адаптация к изменению размера окна
window.addEventListener('resize', () => {
    fishElements.forEach(fish => {
        if (parseFloat(fish.style.left) > window.innerWidth) {
            removeFish(fish);
        }
    });
});