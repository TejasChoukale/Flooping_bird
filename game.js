//game.js
// Flappy Bird Game
class FlappyBirdGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 600;

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
            }
        });

        this.gameState = {
            started: false,
            over: false
        };

        this.score = 0;
        // Retrieve high score and high score name from localStorage
        this.highScore = localStorage.getItem('flappyHighScore') || 0;
        this.highScoreName = localStorage.getItem('flappyHighScoreName') || '';
        this.playerName = localStorage.getItem('flappyPlayerName') || '';

        this.bird = {
            x: 50,
            y: this.canvas.height / 2,
            width: 40,
            height: 30,
            velocity: 0,
            gravity: 0.5,
            jump: -7,
            rotation: 0
        };

        this.pipes = [];
        this.pipeWidth = 50;
        this.pipeGap = 200;
        this.pipeFrequency = 1500;
        this.lastPipeTime = 0;
        this.difficulty = 1;

        this.animationFrameId = null;

        this.bindEvents();
        this.setupPlayerNameFeature();
        this.updateHighScoreDisplay();
        this.drawInitialScene();
    }

    setupPlayerNameFeature() {
        const editPlayerNameBtn = document.getElementById('editPlayerName');
        const playerNameModal = document.getElementById('playerNameModal');
        const closePlayerModal = document.getElementById('closePlayerModal');
        const playerNameInput = document.getElementById('playerNameInput');
        const savePlayerNameBtn = document.getElementById('savePlayerName');
        const displayPlayerName = document.getElementById('displayPlayerName');

        // Display existing player name
        if (this.playerName) {
            displayPlayerName.textContent = this.playerName;
        }

        // Open modal
        editPlayerNameBtn.addEventListener('click', () => {
            playerNameInput.value = this.playerName;
            playerNameModal.style.display = 'flex';
        });

        // Close modal
        closePlayerModal.addEventListener('click', () => {
            playerNameModal.style.display = 'none';
        });

        // Save player name
        savePlayerNameBtn.addEventListener('click', () => {
            const newPlayerName = playerNameInput.value.trim();
            if (newPlayerName) {
                this.playerName = newPlayerName;
                localStorage.setItem('flappyPlayerName', this.playerName);
                displayPlayerName.textContent = this.playerName;
                playerNameModal.style.display = 'none';
            } else {
                alert('Please enter a valid name');
            }
        });

        // Allow enter key to save name
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                savePlayerNameBtn.click();
            }
        });
    }

    bindEvents() {
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());

        document.addEventListener('keydown', (e) => {
            // Start game on Enter when game is not started
            if (e.code === 'Enter' && !this.gameState.started && !this.gameState.over) {
                this.startGame();
            }

            // Restart game on Enter when game is over or not started
            if ((e.code === 'Enter' && (!this.gameState.started || this.gameState.over))) {
                this.restartGame();
            }

            // Jump when Space is pressed
            if (e.code === 'Space') {
                if (this.gameState.started && !this.gameState.over) {
                    this.jump();
                }
            }
        });

        this.canvas.addEventListener('click', () => {
            if (this.gameState.started && !this.gameState.over) {
                this.jump();
            }
        });
    }

    drawInitialScene() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawSoftClouds();
        this.drawSparrow(this.bird.x, this.bird.y);

        this.ctx.fillStyle = 'black';
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press ENTER to Start', this.canvas.width / 2, this.canvas.height / 2 + 100);
    }

    drawSoftClouds() {
        const cloudColor = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fillStyle = cloudColor;

        this.ctx.beginPath();
        this.ctx.ellipse(100, 100, 60, 30, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.ellipse(300, 200, 80, 40, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }

    startGame() {
        if (!this.gameState.started && !this.gameState.over) {
            this.gameState.started = true;
            this.gameLoop();
        }
    }

    restartGame() {
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.pipes = [];
        this.score = 0;
        this.difficulty = 1;

        this.gameState.over = false;
        this.gameState.started = false;

        document.getElementById('score').textContent = this.score;
        document.getElementById('bustedOverlay').style.display = 'none';
        document.body.style.backgroundColor = '#87CEEB';
        document.body.style.backgroundImage = 'none';

        this.drawInitialScene();

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    jump() {
        if (this.gameState.started && !this.gameState.over) {
            this.bird.velocity = this.bird.jump;
            this.bird.rotation = -0.5;
        }
    }

    createPipe() {
        const randomHeight = Math.random() * (this.canvas.height - this.pipeGap);
        this.pipes.push({
            x: this.canvas.width,
            topHeight: randomHeight,
            bottomHeight: this.canvas.height - randomHeight - this.pipeGap,
            passed: false
        });
    }

    drawSparrow(x, y) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(this.bird.rotation);

        this.ctx.fillStyle = 'green';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(0, 10, 15, Math.PI, 0);
        this.ctx.fill();

        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(-8, -5, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'orange';
        this.ctx.beginPath();
        this.ctx.moveTo(20, 0);
        this.ctx.lineTo(30, -5);
        this.ctx.lineTo(30, 5);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.rect(-20, -30, 40, 10);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawPipes() {
        this.ctx.fillStyle = 'green';
        this.pipes.forEach(pipe => {
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            this.ctx.fillRect(pipe.x, this.canvas.height - pipe.bottomHeight, this.pipeWidth, pipe.bottomHeight);
        });
    }

    updateBird() {
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;

        if (this.bird.velocity > 0) {
            this.bird.rotation = Math.min(this.bird.rotation + 0.1, 1.5);
        }
    }

    checkCollision() {
        this.pipes.forEach(pipe => {
            if (
                this.bird.x + 20 > pipe.x &&
                this.bird.x - 20 < pipe.x + this.pipeWidth
            ) {
                if (this.bird.y - 10 < pipe.topHeight) {
                    this.gameOver();
                }
                if (this.bird.y + 10 > this.canvas.height - pipe.bottomHeight) {
                    this.gameOver();
                }
            }
        });

        if (this.bird.y + 10 > this.canvas.height || this.bird.y - 10 < 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.gameState.over = true;
        this.gameState.started = false;
        cancelAnimationFrame(this.animationFrameId);

        // Update final score message
        document.getElementById('finalScoreMessage').textContent = `Your Score: ${this.score}`;
        
        // Display player name in game over screen if exists
        const playerNameDisplay = document.getElementById('playerNameDisplay');
        playerNameDisplay.textContent = this.playerName ? 
            `${this.playerName}'s Performance` : '';

        document.getElementById('bustedOverlay').style.display = 'flex';

        this.updateHighScore();
    }

    updateScore() {
        this.pipes.forEach(pipe => {
            if (pipe.x + this.pipeWidth < this.bird.x - 20 && !pipe.passed) {
                this.score++;
                pipe.passed = true;
                document.getElementById('score').textContent = this.score;

                if (this.score % 10 === 0) {
                    this.difficulty += 0.2;
                }
            }
        });
    }

    updateHighScoreDisplay() {
        const highScoreElement = document.getElementById('high-score');
        if (this.highScoreName) {
            highScoreElement.textContent = `${this.highScore} (${this.highScoreName})`;
        } else {
            highScoreElement.textContent = this.highScore;
        }
    }

    updateHighScore() {
        // Check if current score is higher than the existing high score
        if (this.score > this.highScore) {
            // Update high score
            this.highScore = this.score;
            
            // Use player name if available, otherwise use 'Anonymous'
            this.highScoreName = this.playerName || 'Anonymous';
            
            // Store high score and high score name in localStorage
            localStorage.setItem('flappyHighScore', this.highScore);
            localStorage.setItem('flappyHighScoreName', this.highScoreName);
            
            // Update the high score display
            this.updateHighScoreDisplay();
        }
    }

    gameLoop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const currentTime = Date.now();
        if (currentTime - this.lastPipeTime > (this.pipeFrequency / this.difficulty)) {
            this.createPipe();
            this.lastPipeTime = currentTime;
        }

        this.pipes = this.pipes.filter(pipe => pipe.x > -this.pipeWidth);
        this.pipes.forEach(pipe => {
            pipe.x -= 2 * this.difficulty;
        });
        this.drawPipes();

        this.updateBird();
        this.drawSparrow(this.bird.x, this.bird.y);

        this.checkCollision();
        this.updateScore();

        if (!this.gameState.over) {
            this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
        }
    }
}

let gameInstance;
window.addEventListener('load', () => {
    gameInstance = new FlappyBirdGame();
});