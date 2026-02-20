/**
 * Flappy Barber - Minijuego para Barbería Cristian
 */
class FlappyBarber {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Game state
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;
        this.highScore = localStorage.getItem('flappyBarberHighScore') || 0;

        // Physics - Accelerated x2 with larger bird and thinner pipes
        this.bird = {
            x: 70,
            y: this.height / 2,
            radius: 25,    // Larger bird
            velocity: 0,
            gravity: 0.08, // Slightly lower gravity
            jump: -3.5,    // Softer jump for slower pace
            rotation: 0
        };

        // Professionals' Avatars
        this.proImages = ['/cristian.png', '/daniel.png', '/nasir.png'];
        this.currentProIndex = 0;
        this.birdImg = new Image();
        this.loadNextPro();

        // Pipes - Slightly Slower
        this.pipes = [];
        this.pipeWidth = 45;
        this.pipeGap = 160;
        this.pipeSpeed = 1.0;  // More relaxed speed
        this.frameCounter = 0;

        // Input
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handleInput();
        });
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            }
        });

        // Colors
        this.colors = {
            accent: '#D4AF37',
            bg: '#0B0B0C',
            pipe: '#1C1C1C',
            pipeBorder: '#D4AF37'
        };
    }

    loadNextPro() {
        this.birdImg.src = this.proImages[this.currentProIndex];
        this.currentProIndex = (this.currentProIndex + 1) % this.proImages.length;
    }

    handleInput() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.reset();
        } else if (this.gameOver) {
            this.loadNextPro(); // Change barber on restart
            this.reset();
            this.gameStarted = true;
        } else {
            this.bird.velocity = this.bird.jump;
        }
    }

    reset() {
        this.bird.y = this.height / 2;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.pipes = [];
        this.score = 0;
        this.gameOver = false;
        this.frameCounter = 0;
    }

    update() {
        if (!this.gameStarted || this.gameOver) return;

        // Physics
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;

        // Rotation
        if (this.bird.velocity < 0) {
            this.bird.rotation = -0.3;
        } else {
            this.bird.rotation = Math.min(Math.PI / 2, this.bird.rotation + 0.05);
        }

        // Collision
        if (this.bird.y + this.bird.radius > this.height || this.bird.y - this.bird.radius < 0) {
            this.endGame();
        }

        if (this.frameCounter % 300 === 0) {
            const topHeight = Math.floor(Math.random() * (this.height - this.pipeGap - 100)) + 50;
            this.pipes.push({ x: this.width, top: topHeight, passed: false });
        }

        this.pipes.forEach((pipe, index) => {
            pipe.x -= this.pipeSpeed;
            if (this.bird.x + this.bird.radius > pipe.x && this.bird.x - this.bird.radius < pipe.x + this.pipeWidth) {
                if (this.bird.y - this.bird.radius < pipe.top || this.bird.y + this.bird.radius > pipe.top + this.pipeGap) {
                    this.endGame();
                }
            }
            if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.passed = true;
                this.score++;
            }
            if (pipe.x + this.pipeWidth < 0) this.pipes.splice(index, 1);
        });
        this.frameCounter++;
    }

    endGame() {
        this.gameOver = true;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappyBarberHighScore', this.highScore);
        }
    }

    draw() {
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.pipes.forEach(pipe => {
            this.ctx.fillStyle = this.colors.pipe;
            this.ctx.strokeStyle = this.colors.pipeBorder;
            this.ctx.lineWidth = 2;
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.top);
            this.ctx.strokeRect(pipe.x, -2, this.pipeWidth, pipe.top + 2);
            this.ctx.fillRect(pipe.x, pipe.top + this.pipeGap, this.pipeWidth, this.height);
            this.ctx.strokeRect(pipe.x, pipe.top + this.pipeGap, this.pipeWidth, this.height - pipe.top - this.pipeGap + 2);
        });

        this.ctx.save();
        this.ctx.translate(this.bird.x, this.bird.y);
        this.ctx.rotate(this.bird.rotation);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.bird.radius, 0, Math.PI * 2);
        this.ctx.clip();
        if (this.birdImg.complete) {
            this.ctx.drawImage(this.birdImg, -this.bird.radius, -this.bird.radius, this.bird.radius * 2, this.bird.radius * 2);
        } else {
            this.ctx.fillStyle = this.colors.accent;
            this.ctx.fill();
        }
        this.ctx.restore();
        this.ctx.strokeStyle = this.colors.accent;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.bird.x, this.bird.y, this.bird.radius, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 32px Montserrat';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.score, this.width / 2, 60);

        if (!this.gameStarted) {
            this.drawOverlay('PULSA PARA EMPEZAR', 'Control: ESPACIO o CLIC');
        } else if (this.gameOver) {
            this.drawOverlay('¡SIGUIENTE BARBERO!', `Puntuación: ${this.score}\nMáximo: ${this.highScore}`);
        }
    }

    drawOverlay(title, subtitle) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = this.colors.accent;
        this.ctx.font = 'bold 22px Montserrat';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(title, this.width / 2, this.height / 2 - 10);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px Montserrat';
        const lines = subtitle.split('\n');
        lines.forEach((line, i) => { this.ctx.fillText(line, this.width / 2, this.height / 2 + 25 + (i * 20)); });
    }
}

window.initGame = function () {
    if (window.gameInstance) return;
    window.gameInstance = new FlappyBarber('flappyCanvas');
    function loop() {
        window.gameInstance.update();
        window.gameInstance.draw();
        requestAnimationFrame(loop);
    }
    loop();
};
