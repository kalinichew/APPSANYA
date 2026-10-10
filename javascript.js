(() => {
    const output = document.querySelector(".output");
    const scoreOut = document.querySelector(".s");
    const welcome = document.querySelector(".welcome");
    const startButton = document.querySelector(".start-button");
    const levelName = document.querySelector(".level-name");
    const levelCaught = document.querySelector(".level-caught");
    const levelTarget = document.querySelector(".level-target");
    const progressTrack = document.querySelector(".progress-track");
    const progressFill = document.querySelector(".progress-fill");
    const encouragement = document.querySelector(".encouragement");
    const finishScreen = document.querySelector(".finish-screen");
    const restartButton = document.querySelector(".restart-button");

    const levels = [10, 20, 150];
    const levelMessages = [
        { minimum: 0.95, text: "Остался всего один! Ты уже почти поймал Саню." },
        { minimum: 0.8, text: "Финиш рядом! Ещё немного — и уровень твой." },
        { minimum: 0.6, text: "Ещё чуть-чуть! Отличный темп, продолжай." },
        { minimum: 0.35, text: "Здорово получается! Саня уже не уйдёт." },
        { minimum: 0, text: "Вперёд! Лови Саню и приближайся к цели." }
    ];

    let box;
    let score = 0;
    let levelIndex = 0;
    let levelScore = 0;
    let x = 0;
    let y = 0;
    let velocityX = 0;
    let velocityY = 0;
    let nextTurnAt = 0;
    let caughtUntil = 0;
    let animationFrame = 0;
    let gameFinished = false;
    let messageTimeout = 0;

    function randomDirection() {
        const angle = Math.random() * Math.PI * 2;
        const speed = 145 + Math.random() * 125;
        velocityX = Math.cos(angle) * speed;
        velocityY = Math.sin(angle) * speed;
        nextTurnAt = performance.now() + 420 + Math.random() * 760;
    }

    function clampPosition() {
        if (!box) return;
        box.style.maxWidth = output.clientWidth + "px";
        box.style.maxHeight = output.clientHeight + "px";
        const maxX = Math.max(0, output.clientWidth - box.offsetWidth);
        const maxY = Math.max(0, output.clientHeight - box.offsetHeight);
        x = Math.max(0, Math.min(x, maxX));
        y = Math.max(0, Math.min(y, maxY));
        box.style.left = x + "px";
        box.style.top = y + "px";
    }

    function placeAtRandom() {
        if (!box) return;
        const maxX = Math.max(0, output.clientWidth - box.offsetWidth);
        const maxY = Math.max(0, output.clientHeight - box.offsetHeight);
        x = Math.random() * maxX;
        y = Math.random() * maxY;
        clampPosition();
        randomDirection();
    }

    function setEncouragement(text, isClose) {
        window.clearTimeout(messageTimeout);
        encouragement.textContent = text;
        encouragement.classList.toggle("is-close", Boolean(isClose));
    }

    function updateProgress() {
        const target = levels[levelIndex];
        const ratio = levelScore / target;
        levelName.textContent = "Уровень " + (levelIndex + 1) + " из " + levels.length;
        levelCaught.textContent = String(levelScore);
        levelTarget.textContent = String(target);
        progressTrack.setAttribute("aria-valuemax", String(target));
        progressTrack.setAttribute("aria-valuenow", String(levelScore));
        progressFill.style.width = Math.min(100, ratio * 100) + "%";

        const message = levelMessages.find((item) => ratio >= item.minimum);
        setEncouragement(message.text, ratio >= 0.6);
    }

    function finishLevel() {
        if (levelIndex === levels.length - 1) {
            gameFinished = true;
            box.hidden = true;
            window.cancelAnimationFrame(animationFrame);
            finishScreen.hidden = false;
            restartButton.focus({ preventScroll: true });
            return;
        }

        levelIndex += 1;
        levelScore = 0;
        updateProgress();
        setEncouragement(
            "Уровень пройден! Впереди цель — " + levels[levelIndex] + " захватов. Ты справишься!",
            true
        );
        messageTimeout = window.setTimeout(updateProgress, 2400);
        box.classList.remove("is-caught");
        placeAtRandom();
    }

    function catchSanya(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (gameFinished || performance.now() < caughtUntil) return;

        score += 1;
        levelScore += 1;
        scoreOut.textContent = String(score);
        updateProgress();

        box.classList.remove("is-caught");
        void box.offsetWidth;
        box.classList.add("is-caught");
        caughtUntil = performance.now() + 260;

        if (levelScore >= levels[levelIndex]) {
            finishLevel();
        } else {
            const target = levels[levelIndex];
            const ratio = levelScore / target;
            const message = levelMessages.find((item) => ratio >= item.minimum);
            setEncouragement(message.text, ratio >= 0.6);
            window.setTimeout(() => {
                if (!box || gameFinished) return;
                box.classList.remove("is-caught");
                placeAtRandom();
            }, 260);
        }
    }

    function move(now) {
        if (!box || welcome.classList.contains("is-open") || gameFinished) return;

        if (now >= caughtUntil) {
            if (now >= nextTurnAt) randomDirection();

            const delta = Math.min((now - (move.lastTime || now)) / 1000, 0.04);
            move.lastTime = now;
            x += velocityX * delta;
            y += velocityY * delta;

            const maxX = Math.max(0, output.clientWidth - box.offsetWidth);
            const maxY = Math.max(0, output.clientHeight - box.offsetHeight);
            if (x <= 0 || x >= maxX) {
                x = Math.max(0, Math.min(x, maxX));
                velocityX *= -1;
            }
            if (y <= 0 || y >= maxY) {
                y = Math.max(0, Math.min(y, maxY));
                velocityY *= -1;
            }
            clampPosition();
        }

        animationFrame = window.requestAnimationFrame(move);
    }

    function ensureBox() {
        if (box) return;

        box = document.createElement("button");
        box.type = "button";
        box.className = "box";
        box.setAttribute("aria-label", "Поймать Саню");
        output.appendChild(box);
        box.addEventListener("pointerdown", catchSanya);
        box.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") catchSanya(event);
        });
    }

    function startGame() {
        welcome.classList.remove("is-open");
        welcome.setAttribute("aria-hidden", "true");
        finishScreen.hidden = true;
        gameFinished = false;
        ensureBox();
        box.hidden = false;
        placeAtRandom();
        move.lastTime = performance.now();
        window.cancelAnimationFrame(animationFrame);
        animationFrame = window.requestAnimationFrame(move);
    }

    function restartGame() {
        score = 0;
        levelIndex = 0;
        levelScore = 0;
        gameFinished = false;
        scoreOut.textContent = "0";
        updateProgress();
        startGame();
    }

    startButton.addEventListener("click", startGame);
    restartButton.addEventListener("click", restartGame);

    window.addEventListener("resize", () => {
        clampPosition();
        if (box && !welcome.classList.contains("is-open")) {
            x = Math.min(x, Math.max(0, output.clientWidth - box.offsetWidth));
            y = Math.min(y, Math.max(0, output.clientHeight - box.offsetHeight));
            clampPosition();
        }
    });

    updateProgress();
    startButton.focus({ preventScroll: true });
})();
