(() => {
    const output = document.querySelector(".output");
    const messageOut = document.querySelectorAll(".message span");
    const scoreOut = document.querySelector(".s");
    const welcome = document.querySelector(".welcome");
    const startButton = document.querySelector(".start-button");

    let box;
    let score = 0;
    let x = 0;
    let y = 0;
    let velocityX = 0;
    let velocityY = 0;
    let nextTurnAt = 0;
    let caughtUntil = 0;
    let animationFrame = 0;

    function randomDirection() {
        const angle = Math.random() * Math.PI * 2;
        const speed = 145 + Math.random() * 125;
        velocityX = Math.cos(angle) * speed;
        velocityY = Math.sin(angle) * speed;
        nextTurnAt = performance.now() + 420 + Math.random() * 760;
    }

    function clampPosition() {
        if (!box) return;
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

    function move(now) {
        if (!box || welcome.classList.contains("is-open")) return;

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

    function startGame() {
        welcome.classList.remove("is-open");
        welcome.setAttribute("aria-hidden", "true");

        if (!box) {
            box = document.createElement("button");
            box.type = "button";
            box.className = "box";
            box.setAttribute("aria-label", "Поймать Саню");
            output.appendChild(box);

            box.addEventListener("pointerdown", (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (performance.now() < caughtUntil) return;

                score += 1;
                scoreOut.textContent = String(score);
                box.classList.remove("is-caught");
                void box.offsetWidth;
                box.classList.add("is-caught");
                caughtUntil = performance.now() + 260;

                window.setTimeout(() => {
                    if (!box) return;
                    box.classList.remove("is-caught");
                    placeAtRandom();
                }, 260);
            });
        }

        placeAtRandom();
        move.lastTime = performance.now();
        window.cancelAnimationFrame(animationFrame);
        animationFrame = window.requestAnimationFrame(move);
    }

    output.addEventListener("pointermove", (event) => {
        const bounds = output.getBoundingClientRect();
        messageOut[0].textContent = String(Math.round(event.clientX - bounds.left));
        messageOut[1].textContent = String(Math.round(event.clientY - bounds.top));
    });

    startButton.addEventListener("click", startGame);

    window.addEventListener("resize", () => {
        clampPosition();
        if (box && !welcome.classList.contains("is-open")) {
            // Keep the target visible when the browser changes between portrait and landscape.
            x = Math.min(x, Math.max(0, output.clientWidth - box.offsetWidth));
            y = Math.min(y, Math.max(0, output.clientHeight - box.offsetHeight));
            clampPosition();
        }
    });

    welcome.addEventListener("keydown", (event) => {
        if (event.key === "Escape") startButton.focus();
    });

    startButton.focus({ preventScroll: true });
})();
