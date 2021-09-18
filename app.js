document.addEventListener('DOMContentLoaded', () => {
    let canvas = document.getElementById("gameScreen");
    let ctx = canvas.getContext("2d");
    let lastTime = 0;

    const level1 = [
        [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];

    const level2 = [
        [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 1, 2, 2, 1, 0, 0, 0],
        [0, 0, 1, 2, 3, 3, 2, 1, 0, 0],
        [0, 1, 2, 3, 1, 1, 3, 2, 1, 0],
        [1, 2, 3, 1, 2, 2, 1, 3, 2, 1],
        [0, 1, 2, 3, 1, 1, 3, 2, 1, 0],
        [0, 0, 1, 2, 3, 3, 2, 1, 0, 0],
        [0, 0, 0, 1, 2, 2, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 0, 0, 0, 0]
    ];

    const level3 = [
        [3, 0, 0, 2, 2, 2, 2, 0, 0, 3],
        [1, 3, 0, 0, 2, 2, 0, 0, 3, 1],
        [1, 1, 3, 0, 0, 0, 0, 3, 1, 1],
        [1, 1, 1, 3, 0, 0, 3, 1, 1, 1],
        [1, 1, 1, 3, 0, 0, 3, 1, 1, 1],
        [1, 1, 1, 3, 0, 0, 3, 1, 1, 1],
        [1, 1, 3, 0, 0, 0, 0, 3, 1, 1],
        [1, 3, 0, 0, 2, 2, 0, 0, 3, 1],
        [3, 0, 0, 2, 2, 2, 2, 0, 0, 3]
    ];

    const GAMESTATE = {
        PAUSED: 0,
        RUNNING: 1,
        MENU: 2,
        GAMEOVER: 3,
        NEWLEVEL: 4,
        YOUWIN: 5
    };
    const gameWidth = 800;
    const gameHeight = 600;
    gamestate = GAMESTATE.MENU;

    pinkBrick = document.getElementById("img_pink_brick");
    blueBrick = document.getElementById("img_blue_brick");
    orangeBrick = document.getElementById("img_orange_brick");

    imglives = document.getElementById("img_lives");
    ballImage = document.getElementById("img_ball");
    bg = document.getElementById("img_bg");
    bgMenu = document.getElementById("img_welcome");
    gameover = document.getElementById("img_gameover");
    youwin = document.getElementById("img_youwin");
    paddleImage = document.getElementById("img_paddle");

    bricks = [];
    lives = 4;
    levels = [level1, level2, level3];
    currentLevel = 0;

    paddleWidth = 150;
    paddleHeight = 20;
    paddleMaxSpeed = 10;
    paddleSpeed = 0;
    paddlePosition = {
        x: gameWidth / 2 - paddleWidth / 2,
        y: gameHeight - paddleHeight - 10
    };

    ballSize = 16;
    ballState = 0;
    ballSpeed = { x: 0, y: 0 };
    ballPosition = {
        x: gameWidth / 2 - ballSize / 2,
        y: gameHeight - ballSize - 10
    };

    function gameLoop(timestamp) {
        let deltaTime = timestamp - lastTime;
        window.requestAnimationFrame(gameLoop);
        if ((timestamp - lastTime) / 1000 < 0.01) {
            return;
        }
        lastTime = timestamp;

        ctx.clearRect(0, 0, gameWidth, gameHeight);
        updateGame();
        drawGame(ctx);
    }

    resetBall();
    paddleReset();

    function startGame() {
        if (
            gamestate !== GAMESTATE.MENU &&
            gamestate !== GAMESTATE.NEWLEVEL
        )
            return;

        bricks = buildLevel();
        resetBall();

        gamestate = GAMESTATE.RUNNING;
    }

    function updateGame() {
        if (lives === 0) gamestate = GAMESTATE.GAMEOVER;

        if (
            gamestate === GAMESTATE.PAUSED ||
            gamestate === GAMESTATE.MENU ||
            gamestate === GAMESTATE.GAMEOVER
        )
            return;

        if (bricks.length === 0) {
            currentLevel++;
            if (currentLevel >= levels.length) {
                gamestate = GAMESTATE.YOUWIN;
            } else {
                gamestate = GAMESTATE.NEWLEVEL;
                startGame();
            }
        }

        updateBall();
        paddleUpdate();

        bricks.forEach(brick => {
            updateBrick(brick);
        })

        bricks = bricks.filter(brick => !brick.markedForDeletion);
    }

    function drawGame(ctx) {
        ctx.drawImage(bg, 0, 0, gameWidth, gameHeight);
        ctx.drawImage(imglives, 0, 0, 100, 50);
        for (let i = 2; i <= lives; i++) {
            ctx.drawImage(ballImage, i * 20 + 60, 17, 16, 16);
        }

        drawBall(ctx);
        drawPaddle(ctx);
        bricks.forEach(brick => {
            drawBrick(ctx, brick);
        });

        if (gamestate === GAMESTATE.PAUSED) {
            ctx.rect(0, 0, gameWidth, gameHeight);
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fill();

            ctx.font = "30px Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("Game Paused", gameWidth / 2, gameHeight / 2);
        }

        if (gamestate === GAMESTATE.MENU) {
            ctx.drawImage(bgMenu, 0, 0, gameWidth, gameHeight);
        }

        if (gamestate === GAMESTATE.GAMEOVER) {
            ctx.drawImage(gameover, 0, 0, gameWidth, gameHeight);
        }
        if (gamestate === GAMESTATE.YOUWIN) {
            ctx.drawImage(youwin, 0, 0, gameWidth, gameHeight);
        }
    }

    function togglePause() {
        if (gamestate === GAMESTATE.MENU) return;
        if (gamestate === GAMESTATE.PAUSED) {
            gamestate = GAMESTATE.RUNNING;
        } else {
            gamestate = GAMESTATE.PAUSED;
        }
    }

    function paddleReset() {
        paddlePosition = {
            x: gameWidth / 2 - paddleWidth / 2,
            y: gameHeight - paddleHeight - 10
        };
    }

    function moveLeft() {
        paddleSpeed = -paddleMaxSpeed;
    }
    function moveRight() {
        paddleSpeed = paddleMaxSpeed;
    }
    function paddleStop() {
        paddleSpeed = 0;
    }

    function drawPaddle(ctx) {
        ctx.drawImage(
            paddleImage,
            paddlePosition.x,
            paddlePosition.y,
            paddleWidth,
            paddleHeight
        );
    }

    function paddleUpdate() {
        paddlePosition.x += paddleSpeed;
        if (paddlePosition.x < 0) paddlePosition.x = 0;
        if (paddlePosition.x + paddleWidth > gameWidth)
            paddlePosition.x = gameWidth - paddleWidth;
    }    

    

    function ballGo() {
        if (ballState === 1) return;
        ballSpeed = { x: 5, y: -7 };
        ballState = 1;
    }
    function resetBall() {
        ballPosition = {
            x: gameWidth / 2 - ballSize / 2,
            y: gameHeight - ballSize - 10
        };
        ballSpeed = { x: 0, y: 0 };
        ballState = 0;
    }

    function drawBall(ctx) {
        ctx.drawImage(
            ballImage,
            ballPosition.x,
            ballPosition.y,
            ballSize,
            ballSize
        );
    }
    function updateBall() {
        ballPosition.x += ballSpeed.x;
        ballPosition.y += ballSpeed.y;

        if (ballState === 0) {
            ballPosition.x = paddlePosition.x + 67;
            ballPosition.y = paddlePosition.y - 20;
        } else {
            // wall collision on left or right
            if (ballPosition.x > gameWidth - ballSize || ballPosition.x < 0) {
                ballSpeed.x = -ballSpeed.x;
            }
            // wall collision on top
            if (ballPosition.y < 0) {
                ballSpeed.y = -ballSpeed.y;
            }

            //bottom of game
            if (ballPosition.y + ballSize > gameHeight) {
                lives--;
                resetBall();
                paddleReset();
            }

            switch (detectCollisionPaddle()) {
                case 1:
                    ballSpeed.x = -9;
                    ballSpeed.y = -ballSpeed.y;
                    ballPosition.y = paddlePosition.y - ballSize;
                    break;
                case 2:
                    if (ballSpeed.x < 0) {
                        ballSpeed.x = -6;
                    } else {
                        ballSpeed.x += -6;
                    }
                    ballSpeed.y = -ballSpeed.y;
                    ballPosition.y = paddlePosition.y - ballSize;
                    break;
                case 3:
                    if (ballSpeed.x < 0) {
                        ballSpeed.x = ballSpeed.x;
                    } else {
                        ballSpeed.x = ballSpeed.x;
                    }
                    ballSpeed.y = -ballSpeed.y;
                    ballPosition.y = paddlePosition.y - ballSize;
                    break;
                case 4:
                    if (ballSpeed.x > 0) {
                        ballSpeed.x = ballSpeed.x;
                    } else {
                        ballSpeed.x = ballSpeed.x;
                    }
                    ballSpeed.y = -ballSpeed.y;
                    ballPosition.y = paddlePosition.y - ballSize;
                    break;
                case 5:
                    if (ballSpeed.x > 0) {
                        ballSpeed.x = 6;
                    } else {
                        ballSpeed.x += 6;
                    }
                    ballSpeed.y = -ballSpeed.y;
                    ballPosition.y = paddlePosition.y - ballSize;
                    break;
                case 6:
                    ballSpeed.x = 9;
                    ballSpeed.y = -ballSpeed.y;
                    ballPosition.y = paddlePosition.y - ballSize;
                    break;
            }
        }
    }

    function buildBrick(position, brickStr) {
        return {
            brickPosition: position,
            brickWidth: 80,
            brickHeight: 24,
            brickStr: brickStr,
            brickMarkedForDeletion: false
        }
    }

    function updateBrick(brick) {
        switch (detectCollision(brick)) {
            case 1:
                ballSpeed.y = -ballSpeed.y;
                if (brick.brickStr <= 1) {
                    brick.markedForDeletion = true;
                } else {
                    brick.brickStr--;
                }
                break;
            case 2:
                ballSpeed.x = -ballSpeed.x;
                if (brick.brickStr <= 1) {
                    brick.markedForDeletion = true;
                } else {
                    brick.brickStr--;
                }
                break;
        }
    }

    function drawBrick(ctx, brick) {
        switch (brick.brickStr) {
            case 1:
                ctx.drawImage(
                    orangeBrick,
                    brick.brickPosition.x,
                    brick.brickPosition.y,
                    brick.brickWidth,
                    brick.brickHeight
                );
                break;

            case 2:
                ctx.drawImage(
                    blueBrick,
                    brick.brickPosition.x,
                    brick.brickPosition.y,
                    brick.brickWidth,
                    brick.brickHeight
                );
                break;

            case 3:
                ctx.drawImage(
                    pinkBrick,
                    brick.brickPosition.x,
                    brick.brickPosition.y,
                    brick.brickWidth,
                    brick.brickHeight
                );
                break;
        }
    }

    function detectCollision(brick) {
        let bottomOfBall = ballPosition.y + ballSize;
        let topOfBall = ballPosition.y;
        let leftSideOfBall = ballPosition.x;
        let rightSideOfBall = ballPosition.x + ballSize;

        let topOfObject = brick.brickPosition.y;
        let leftSideOfObject = brick.brickPosition.x;
        let rightSideOfObject = brick.brickPosition.x + brick.brickWidth;
        let bottomOfObject = brick.brickPosition.y + brick.brickHeight;

        if (
            bottomOfBall >= topOfObject &&
            topOfBall <= bottomOfObject &&
            rightSideOfBall >= leftSideOfObject &&
            leftSideOfBall <= rightSideOfObject
        ) {
            if (
                (ballSpeed.x >= 0 &&
                    ballSpeed.y < 0 &&
                    bottomOfObject - topOfBall < rightSideOfBall - leftSideOfObject) ||
                (ballSpeed.x <= 0 &&
                    ballSpeed.y < 0 &&
                    bottomOfObject - topOfBall < rightSideOfObject - leftSideOfBall) ||
                (ballSpeed.x >= 0 &&
                    ballSpeed.y > 0 &&
                    bottomOfBall - topOfObject < rightSideOfBall - leftSideOfObject) ||
                (ballSpeed.x <= 0 &&
                    ballSpeed.y > 0 &&
                    bottomOfBall - topOfObject < rightSideOfObject - leftSideOfBall)
            ) {
                return 1;
            } else if (
                (ballSpeed.x > 0 &&
                    ballSpeed.y <= 0 &&
                    bottomOfObject - topOfBall > rightSideOfBall - leftSideOfObject) ||
                (ballSpeed.x < 0 &&
                    ballSpeed.y <= 0 &&
                    bottomOfObject - topOfBall > rightSideOfObject - leftSideOfBall) ||
                (ballSpeed.x > 0 &&
                    ballSpeed.y >= 0 &&
                    bottomOfBall - topOfObject > rightSideOfBall - leftSideOfObject) ||
                (ballSpeed.x < 0 &&
                    ballSpeed.y >= 0 &&
                    bottomOfBall - topOfObject > rightSideOfObject - leftSideOfBall)
            ) {
                return 2;
            }
        }
    }

    function detectCollisionPaddle() {
        let bottomOfBall = ballPosition.y + ballSize;
        let leftOfBall = ballPosition.x;
        let hitPosition = 0;

        let topOfObject = paddlePosition.y;
        let leftSideOfObject = paddlePosition.x;
        let rightSideOfObject = paddlePosition.x + paddleWidth;

        if (
            bottomOfBall >= topOfObject &&
            ballPosition.x + ballSize >= leftSideOfObject &&
            ballPosition.x <= rightSideOfObject
        ) {
            hitPosition = leftOfBall - leftSideOfObject;
            if (hitPosition <= 20) {
                return 1;
            } else if (hitPosition > 20 && hitPosition <= 50) {
                return 2;
            } else if (hitPosition > 50 && hitPosition <= 75) {
                return 3;
            } else if (hitPosition > 75 && hitPosition <= 100) {
                return 4;
            } else if (hitPosition > 100 && hitPosition <= 130) {
                return 5;
            } else if (hitPosition >= 130) {
                return 6;
            }
        }
    }

    document.addEventListener("keydown", event => {
        switch (event.keyCode) {
            case 37:
                moveLeft();
                break;

            case 39:
                moveRight();
                break;

            case 32:
                ballGo();
                break;
            case 13:
                togglePause();
                startGame();
                break;
        }
    });

    document.addEventListener("keyup", event => {
        switch (event.keyCode) {
            case 37:
                if (paddleSpeed < 0) paddleStop();
                break;

            case 39:
                if (paddleSpeed > 0) paddleStop();

                break;
        }
    });

    function buildLevel() {
        let bricks = [];
        let position = {
            x: 0,
            y: 0
        };
        let brickStr = 0;
        levels[currentLevel].forEach((row, rowIndex) => {
            row.forEach((brick, brickIndex) => {
                switch (brick) {
                    case 1:
                        position = {
                            x: 80 * brickIndex,
                            y: 75 + 24 * rowIndex
                        };
                        brickStr = 1;
                        bricks.push(buildBrick(position, brickStr));
                        break;

                    case 2:
                        position = {
                            x: 80 * brickIndex,
                            y: 75 + 24 * rowIndex
                        };
                        brickStr = 2;
                        bricks.push(buildBrick(position, brickStr));
                        break;

                    case 3:
                        position = {
                            x: 80 * brickIndex,
                            y: 75 + 24 * rowIndex
                        };
                        brickStr = 3;
                        bricks.push(buildBrick(position, brickStr));
                        break;
                }
            });
        });
        return bricks;
    }

    requestAnimationFrame(gameLoop);
});