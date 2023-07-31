const height = 20;
const hiddenHeight = 2;
const boradHeight = height + hiddenHeight;
const boardWidth = 10;
const holdWidth = 6;
const holdHeight = 6;
const nextWidth = 6;

const nextLen = 5;

const arr = 1;
const sdr = 1;
const das = 7;
const lockDelay = 300;
const maxResets = 15;

const totalWidth = boardWidth + holdWidth + nextWidth;

var squares = [];

var bag = [];

let scoreCounterLabel = document.getElementById("scoreCounter");


let clearNameLabel = document.getElementById("clearName");


stackerDiv = document.getElementById("stacker")

for (let i = 0; i < height; i++) {
    squaresRow = [];
    for (let j = 0; j < totalWidth; j++) {
        let square = document.createElement("label");
        square.textContent = "09 ";
        square.style.color = "white";
        square.style.backgroundcolor = "white";
        square.style.display = "inline-block";
        stackerDiv.appendChild(square)
        squaresRow.push(square);
    }
    stackerDiv.appendChild(document.createElement("br"));
    squares.push(squaresRow);
}

for (let i = 0; i < 7; i++) {
    bag.push(true);
}

class Board {
    constructor(drawingFunc) {
        this.drawingFunc = drawingFunc;
        this.matrix = [];
        for (let i = 0; i < boardWidth; i++) {
            let boardRow = [];
            for (let j = 0; j < boradHeight; j++) {
                boardRow.push("empty");
            }
            this.matrix.push(boardRow);
        }
    }
    draw() {
        this.drawingFunc(this.matrix)
    }
    //returns an object of the form
    //{lines, score, clearName}
    clearLines() {
        let linesCleared = 0;
        for (let i = 0; i < boradHeight; i++) {
            if (!this.isLineFull(i)) {
                continue;
            }
            linesCleared++;
            for (let j = i; j > 0; j--) {
                for (let k = 0; k < boardWidth; k++) {
                    this.matrix[k][j] = this.matrix[k][j - 1];
                }
            }
            i--;
        }
        let clearName = "";
        switch (linesCleared) {
            case 1: {
                clearName = "Single";
                break;
            }
            case 2: {
                clearName = "Double";
                break;
            }
            case 3: {
                clearName = "Triple";
                break;
            }
            case 4: {
                clearName = "MATRIX CLEAR";
                break;
            }
        }
        if (linesCleared > 0) {
            return { lines: linesCleared, score: (linesCleared ** 2) * 100, clearName: clearName }
        }
        return { lines: 0, score: 0, clearName: clearName };
    }
    isLineFull(i) {
        for (let j = 0; j < boardWidth; j++) {
            if (this.matrix[j][i] == "empty") {
                return false;
            }
        }
        return true;
    }
}


class Piece {
    constructor(minos, color, board) {
        this.board = board;
        this.minos = []
        this.minos = minos;
        this.initialMinos = JSON.parse(JSON.stringify(minos));
        this.center = { x: 0, y: 0 };
        this.calcCenter();
        this.color = color;
        this.movements = maxResets;
        this.placedEvents = [];
        this.active = true;
        this.lockTimer = -1;
    }

    returnToInitial() {
        this.minos = JSON.parse(JSON.stringify(this.initialMinos));
        this.calcCenter();
    }

    calcCenter() {
        let sum = { x: 0, y: 0 };
        for (const mino of this.minos) {
            sum.x += mino.x;
            sum.y += mino.y;
        }
        this.center.x = Math.round(sum.x / this.minos.length);
        this.center.y = Math.round(sum.y / this.minos.length);
    }

    //returns true if intersecting with board.
    isIntersecting() {
        return !this.moveOffset(0, 0)
    }

    //returns true if moved false if didn't
    moveRight() {
        return this.moveOffset(1, 0);
    }

    //returns true if moved false if didn't
    moveLeft() {
        return this.moveOffset(-1, 0)
    }

    //returns true if moved false if didn't
    moveDown() {
        return this.moveOffset(0, 1);
    }

    //returns true if moved false if didn't
    moveOffset(offsetX, offsetY) {
        return this.applyFunction(({ x: a, y: b }) => { return { x: a + offsetX, y: b + offsetY } });
    }



    //applies a function {x,y} -> {z,w} to transform this piece.
    //returns if it succeeds, which it does whenever
    //the transformation dosent land on anything blocked.
    applyFunction(func) {

        for (const mino of this.minos) {
            const newMino = func(mino)
            if (newMino.y >= boradHeight ||
                newMino.y < 0 ||
                newMino.x >= boardWidth ||
                newMino.x < 0 ||
                this.board.matrix[newMino.x][newMino.y] != "empty") {
                return false;
            }
        }
        for (const mino of this.minos) {
            const newMino = func(mino)
            mino.x = newMino.x;
            mino.y = newMino.y;
        }
        if (this.movements > 0 && this.isGrounded()) {
            this.movements--;
        }
        if (this.movements > 0) {
            clearTimeout(this.lockTimer);
            this.lockTimer = setTimeout(() => {
                this.trySet();
            }, lockDelay);
        }
        this.calcCenter();
        return true;
    }

    rotateCounterClockwise() {
        let thisPiece = this;
        let originalCenter = JSON.parse(JSON.stringify(this.center));
        function rotate(mino) {
            let relativeCoords = {};
            relativeCoords.x = mino.x - thisPiece.center.x;
            relativeCoords.y = mino.y - thisPiece.center.y;
            let newRelativeCoords = {};
            newRelativeCoords.x = relativeCoords.y;
            newRelativeCoords.y = -relativeCoords.x;
            let newCoords = {};
            newCoords.x = newRelativeCoords.x + thisPiece.center.x;
            newCoords.y = newRelativeCoords.y + thisPiece.center.y;
            return newCoords;
        }
        let rotated = this.applyFunction(rotate);
        let centerOffset = { x: originalCenter.x - this.center.x, y: originalCenter.y - this.center.y };
        this.moveOffset(centerOffset.x, centerOffset.y);
        return rotated;
    }

    rotateClockwise() {
        let thisPiece = this;
        let originalCenter = JSON.parse(JSON.stringify(this.center));
        function rotate(mino) {
            let relativeCoords = {};
            relativeCoords.x = mino.x - thisPiece.center.x;
            relativeCoords.y = mino.y - thisPiece.center.y;
            let newRelativeCoords = {};
            newRelativeCoords.x = -relativeCoords.y;
            newRelativeCoords.y = relativeCoords.x;
            let newCoords = {};
            newCoords.x = newRelativeCoords.x + thisPiece.center.x;
            newCoords.y = newRelativeCoords.y + thisPiece.center.y;
            return newCoords;
        }
        let rotated = this.applyFunction(rotate);
        let centerOffset = { x: originalCenter.x - this.center.x, y: originalCenter.y - this.center.y };
        this.moveOffset(centerOffset.x, centerOffset.y);
        return rotated;
    }

    isGrounded() {
        for (const mino of this.minos) {
            if (mino.y + 1 >= boradHeight
                || this.board.matrix[mino.x][mino.y + 1] != "empty") {
                return true;
            }
        }
    }

    trySet() {
        if (!this.active) {
            return false;
        }
        if (this.isGrounded()) {
            this.forceSet();
            return true;
        }
        return false;
    }

    forceSet() {
        this.active = false;
        for (const mino of this.minos) {
            this.board.matrix[mino.x][mino.y] = this.color;
        }
        for (const func of this.placedEvents) {
            func();
        }
    }
}

class Game {
    constructor(pieceGenerator, boardDrawer, pieceDrawer, holdDrawer,
        gravityInterval, nextDrawer, scoreDrawer, gameOverDrawer) {
        this.score = 0;
        this.pieceGenerator = pieceGenerator;
        this.pieceDrawer = pieceDrawer;
        this.scoreDrawer = scoreDrawer;
        this.gameOverDrawer = gameOverDrawer;
        this.lastClearName = "";
        this.holdBoard = new Board(() => { })
        this.holdPiece = "empty"
        this.board = new Board(boardDrawer)
        this.drawHold = holdDrawer;
        this.gravityInterval = gravityInterval;
        this.nextDrawer = nextDrawer;
        this.next = []
        for (let i = 0; i < nextLen; i++) {
            this.next.push(pieceGenerator(this.holdBoard));
        }
        this.regeneratePiece()
        this.doGravity()
        this.canHold = true;
        this.dead = false;
    }
    doGravity() {
        setInterval(() => {
            this.moveDown()
        }, (this.gravityInterval));
    }

    draw() {
        if (this.dead) {
            return;
        }
        this.board.draw();
        this.pieceDrawer(this.currPiece);
        if (this.holdPiece != "empty") {
            this.drawHold(this.holdPiece);
        }
        this.nextDrawer(this.next)
        this.scoreDrawer(this.score, this.lastClearName);
    }
    regeneratePiece() {
        this.currPiece = this.next[0];
        this.currPiece.board = this.board;

        if (this.currPiece.isIntersecting()) {
            this.dead = true;
            this.gameOverDrawer();
            return;
        }

        this.canHold = true;

        for (let i = 0; i < nextLen - 1; i++) {
            this.next[i] = this.next[i + 1]
        }

        this.next[nextLen - 1] = this.pieceGenerator(this.holdBoard);

        this.currPiece.placedEvents.push(() => {
            this.regeneratePiece()
        })
        this.currPiece.placedEvents.push(() => {
            let lineClear = this.board.clearLines();
            this.score += lineClear.score
            this.lastClearName = lineClear.clearName
        })
        this.currPiece.placedEvents.push(() => {
            this.draw()
        })
    }
    moveRight() {
        this.currPiece.moveRight();
        this.draw()
    }
    moveLeft() {
        this.currPiece.moveLeft();
        this.draw()
    }
    moveDown() {
        this.currPiece.moveDown();
        this.draw()
    }
    softDrop() {
        if (this.currPiece.moveDown()) {
            this.score += 1;
        }
        this.draw()
    }
    rotateCW() {
        this.currPiece.rotateClockwise();
        this.draw()
    }
    rotateCCW() {
        this.currPiece.rotateCounterClockwise();
        this.draw()
    }
    rotate180() {
        this.currPiece.rotateClockwise();
        this.currPiece.rotateClockwise();
        this.draw()
    }
    hold() {
        if (!this.canHold) {
            return false;
        }
        this.currPiece.active = false;
        let temp = this.holdPiece;
        this.holdPiece = this.currPiece;
        this.holdPiece.returnToInitial();
        this.holdPiece.board = this.holdBoard
        this.holdPiece.moveOffset(3 - this.holdPiece.center.x, 2 - this.holdPiece.center.y)
        if (temp != "empty") {
            this.currPiece = temp;
            this.currPiece.active = true;
            this.currPiece.board = this.board;
            while (this.currPiece.center.x < 5 && this.currPiece.moveRight()) { }
            while (this.currPiece.moveOffset(0, -1));
            this.currPiece.moveOffset(0, hiddenHeight);
        }
        else {
            this.regeneratePiece();
        }
        this.canHold = false;
        this.draw()
    }
    hardDrop() {
        while (this.currPiece.moveDown()) {
            this.score += 2;
        }
        this.currPiece.trySet()
    }
}


game = new Game(generateSevenBagPiece, drawBoard,
    drawPiece, drawHold, 300, drawNext, drawScore, drawGameOver);

game.draw();


function generateSevenBagPiece(board) {
    let a = 12;
    let bagNotEmpty = false;
    for (let i = 0; i < bag.length; i++) {
        bagNotEmpty |= bag[i];
        if (bagNotEmpty == true) {
            break;
        }
    }
    if (!bagNotEmpty) {
        for (let i = 0; i < bag.length; i++) {
            bag[i] = true;
        }
    }
    let chosenPiece = -1;
    while (!(chosenPiece >= 0 && (bag[chosenPiece]))) {
        chosenPiece = Math.floor(Math.random() * 7);
    }
    bag[chosenPiece] = false;
    switch (chosenPiece) {
        //I piece
        case 0: {
            return new Piece([{ x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 6, y: 2 }, { x: 7, y: 2 }], "cyan", board);
            break;
        }
        //T
        case 1: {
            return new Piece([{ x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 6, y: 3 }, { x: 5, y: 2 }], "magenta", board);
            break;
        }
        //L
        case 2: {
            return new Piece([{ x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 6, y: 3 }, { x: 6, y: 2 }], "orange", board);
            break;
        }
        //J
        case 3: {
            return new Piece([{ x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 6, y: 3 }, { x: 4, y: 2 }], "blue", board);
            break;
        }
        //Z
        case 4: {
            return new Piece([{ x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 5, y: 3 }, { x: 6, y: 3 }], "red", board);
            break;
        }
        //S
        case 5: {
            return new Piece([{ x: 6, y: 2 }, { x: 5, y: 2 },
            { x: 5, y: 3 }, { x: 4, y: 3 }], "lightgreen", board);
            break;
        }
        //O
        case 6: {
            return new Piece([{ x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 5, y: 3 }, { x: 4, y: 3 }], "yellow", board);
            break;
        }
    }
}


var goingRight
var goingLeft
var goingDown

var rightTicksLeft
var leftTicksLeft
var downTicksLeft

document.onkeydown = function (e) {

    if (e.repeat) {
        return;
    }

    if (e.code == "ArrowRight") {
        game.moveRight()
        goingRight = true;
        rightTicksLeft = das;
    }
    else if (e.code == "ArrowLeft") {
        game.moveLeft()
        goingLeft = true;
        leftTicksLeft = das;
    }
    else if (e.code == "ArrowDown") {
        game.softDrop()
        goingDown = true;
    }
    else if (e.code == "ArrowUp") {
        game.rotateCW()
    }
    else if (e.code == "KeyZ") {
        game.rotateCCW()
    }
    else if (e.code == "KeyA") {
        game.rotate180()
    }
    else if (e.code == "KeyC") {
        game.hold()
    }
    else if (e.code == "Space") {
        game.hardDrop()
    }
    game.draw()
}

document.onkeyup = function (e) {


    if (e.repeat) {
        return;
    }

    if (e.code == "ArrowRight") {
        goingRight = false;;
    }
    else if (e.code == "ArrowLeft") {
        goingLeft = false;
    }
    else if (e.code == "ArrowDown") {
        goingDown = false;
    }
}



setInterval(() => {


    if (goingRight && rightTicksLeft > 0) {
        rightTicksLeft--;
    } else if (goingRight) {
        rightTicksLeft = arr;
    } else {
        rightTicksLeft = das;
    }
    if (goingLeft && leftTicksLeft > 0) {
        leftTicksLeft--;
    } else if (goingLeft) {
        leftTicksLeft = arr;
    } else {
        leftTicksLeft = das;
    }
    if (goingDown && downTicksLeft > 0) {
        downTicksLeft--;
    } else {
        downTicksLeft = sdr;
    }

    if (rightTicksLeft <= 0) {
        game.moveRight();
    }
    if (leftTicksLeft <= 0) {
        game.moveLeft();
    }
    if (downTicksLeft <= 0) {
        game.softDrop()
    }
}, 16);

function drawPiece(piece) {
    let ghostOffset = 0;
    noIntersect = true;
    while (noIntersect) {
        for (mino of piece.minos) {
            if (mino.y + ghostOffset >= boradHeight ||
                piece.board.matrix[mino.x][mino.y + ghostOffset] != "empty") {
                noIntersect = false;
                break;
            }
        }
        ghostOffset++;
    }
    ghostOffset -= 2;
    if (ghostOffset < 0) {
        ghostOffset = 0;
    }
    for (const mino of piece.minos) {
        if (mino.y + ghostOffset - hiddenHeight >= 0) {
            squares[mino.y + ghostOffset - hiddenHeight][mino.x + holdWidth].style.backgroundColor = "lightgrey";
            squares[mino.y + ghostOffset - hiddenHeight][mino.x + holdWidth].style.color = "lightgrey";
        }

    }

    for (const mino of piece.minos) {
        if (mino.y - hiddenHeight >= 0) {
            squares[mino.y - hiddenHeight][mino.x + holdWidth].style.backgroundColor = piece.color
            squares[mino.y - hiddenHeight][mino.x + holdWidth].style.color = piece.color;
        }
    }
}

function drawScore(score, name) {
    if (name == "MATRIX CLEAR") {
        scoreCounterLabel.style.color = "rgb(140, 3, 232)";
        clearNameLabel.style.color = "rgb(140, 3, 232)";
    } else {
        scoreCounterLabel.style.color = "black"
        clearNameLabel.style.color = "rgb(140, 3, 232)";
    }
    scoreCounterLabel.textContent = "Score: " + JSON.stringify(score);
    clearNameLabel.textContent = name;
}

function drawHold(piece) {
    if (piece == "empty") {
        return
    }
    for (const mino of piece.minos) {
        squares[mino.y + 1][mino.x].style.backgroundColor = piece.color;
        squares[mino.y + 1][mino.x].style.color = piece.color;

    }

}

function drawGameOver() {
    let i = 0
    let j = 0
    document.body.style.backgroundColor = "black"
    scoreCounterLabel.style.color = "white";
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < totalWidth; j++) {
            setTimeout(() => {
                stackerDiv.style.fontFamily = "sans-serif"
                if (i % 2 == 0) {
                    squares[i][j].textContent = "HA"
                }
                else {
                    squares[i][j].textContent = "AH"
                }
                squares[i][j].style.color = "red";
                squares[i][j].style.backgroundColor = "black";

            }, (j + i * height) * 5);
        }
    }
}

function drawNext(next) {

    for (let i = 0; i < next.length; i++) {
        piece = next[i]
        for (const mino of piece.minos) {
            squares[mino.y + 4 * i - 1][mino.x + holdWidth + boardWidth - 3].style.backgroundColor = piece.color;
            squares[mino.y + 4 * i - 1][mino.x + holdWidth + boardWidth - 3].style.color = piece.color;

        }

    }

}

function drawBoard(matrix) {
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < boardWidth; j++) {
            if (matrix[j][i + hiddenHeight] == "empty") {
                squares[i][j + holdWidth].style.backgroundColor = "grey";
            } else {
                squares[i][j + holdWidth].style.backgroundColor = matrix[j][i + hiddenHeight];
            }
        }
    }

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < holdWidth; j++) {
            if (i < holdHeight) {
                squares[i][j].style.backgroundColor = "black";
            }
            else {
                squares[i][j].style.backgroundColor = "white";
            }
        }
    }

    for (let i = 0; i < height; i++) {
        for (let j = holdWidth + boardWidth; j < totalWidth; j++) {
            squares[i][j].style.backgroundColor = "black";
        }
    }

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < totalWidth; j++) {
            squares[i][j].style.color = squares[i][j].style.backgroundColor;
        }
    }
}

