(function () {
    /**
     * Banter Tic-Tac-Toe Embed Script
     * A fully synced multiplayer Tic-Tac-Toe game for Banter.
     */

    // --- Configuration ---
    const config = {
        boardPosition: new BS.Vector3(0, 1.2, 0),
        boardRotation: new BS.Vector3(0, 0, 0),
        boardScale: new BS.Vector3(1, 1, 1),
        resetPosition: new BS.Vector3(0, -0.4, 0),
        resetRotation: new BS.Vector3(0, 0, 0),
        resetScale: new BS.Vector3(1, 1, 1),
        instance: window.location.href.split('?')[0],
        hideUI: false
    };

    const COLORS = {
        board: '#333333',    // Dark Grey Board
        player1: '#D50000',  // Red ('X')
        player2: '#FFEA00',  // Yellow ('O')
        empty: '#FFFFFF',    // Empty slot
        winHighlight: '#00FF00', // Green highlight for winning pieces
    };

    // Helper to parse Vector3
    const parseVector3 = (str, defaultVal) => {
        if (!str) return defaultVal;
        const s = str.trim();
        if (s.includes(' ')) {
            const parts = s.split(' ').map(Number);
            if (parts.length >= 3) return new BS.Vector3(parts[0], parts[1], parts[2]);
        }
        return defaultVal;
    };

    // Parse URL params
    const currentScript = document.currentScript;
    if (currentScript) {
        const url = new URL(currentScript.src);
        const params = new URLSearchParams(url.search);

        if (params.has('hideUI')) config.hideUI = params.get('hideUI') === 'true';
        if (params.has('instance')) config.instance = params.get('instance');

        config.boardScale = parseVector3(params.get('boardScale'), config.boardScale);
        config.boardPosition = parseVector3(params.get('boardPosition'), config.boardPosition);
        config.boardRotation = parseVector3(params.get('boardRotation'), config.boardRotation);

        config.resetScale = parseVector3(params.get('resetScale'), config.resetScale);
        config.resetPosition = parseVector3(params.get('resetPosition'), config.resetPosition);
        config.resetRotation = parseVector3(params.get('resetRotation'), config.resetRotation);
    }

    // --- Game Logic ---
    class TicTacToeGame {
        constructor() {
            this.rows = 3;
            this.cols = 3;
            this.board = this.createEmptyBoard();
            this.currentPlayer = 1; // 1 = X, 2 = O
            this.winner = null;
            this.winningCells = [];
            this.gameOver = false;
        }

        createEmptyBoard() {
            return Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        }

        reset() {
            this.board = this.createEmptyBoard();
            this.currentPlayer = 1;
            this.winner = null;
            this.winningCells = [];
            this.gameOver = false;
        }

        loadState(state) {
            this.board = state.board;
            this.currentPlayer = state.currentPlayer;
            this.winner = state.winner;
            if (this.winner) {
                this.checkWin(); // Recalculate winningCells for display
                this.gameOver = true;
            } else {
                this.winningCells = [];
                this.gameOver = this.checkDraw();
            }
        }

        getState() {
            return {
                board: this.board,
                currentPlayer: this.currentPlayer,
                winner: this.winner,
                lastModified: this.lastModified
            };
        }

        simulatePlay(row, col) {
            if (this.gameOver || this.board[row][col] !== 0) return null;

            const boardCopy = this.board.map(r => [...r]);
            boardCopy[row][col] = this.currentPlayer;

            let nextPlayer = (this.currentPlayer === 1 ? 2 : 1);
            let nextWinner = null;
            let nextGameOver = false;

            const tempGame = new TicTacToeGame();
            tempGame.board = boardCopy;
            tempGame.currentPlayer = this.currentPlayer;

            if (tempGame.checkWin()) {
                nextWinner = this.currentPlayer;
                nextGameOver = true;
            } else if (tempGame.checkDraw()) {
                nextWinner = 'draw';
                nextGameOver = true;
            }

            return {
                board: boardCopy,
                currentPlayer: nextGameOver ? this.currentPlayer : nextPlayer,
                winner: nextWinner,
                lastModified: Date.now()
            };
        }

        checkDraw() {
            return this.board.every(row => row.every(cell => cell !== 0));
        }

        checkWin() {
            const lines = [
                // Rows
                [[0, 0], [0, 1], [0, 2]],
                [[1, 0], [1, 1], [1, 2]],
                [[2, 0], [2, 1], [2, 2]],
                // Cols
                [[0, 0], [1, 0], [2, 0]],
                [[0, 1], [1, 1], [2, 1]],
                [[0, 2], [1, 2], [2, 2]],
                // Diagonals
                [[0, 0], [1, 1], [2, 2]],
                [[0, 2], [1, 1], [2, 0]],
            ];

            for (const line of lines) {
                const [a, b, c] = line;
                const player = this.board[a[0]][a[1]];
                if (player !== 0 && player === this.board[b[0]][b[1]] && player === this.board[c[0]][c[1]]) {
                    this.winningCells = line;
                    return true;
                }
            }
            return false;
        }
    }

    // --- Banter Visuals ---
    const state = {
        root: null,
        piecesRoot: null,
        slots: [], // 2D array of GameObjects for pieces
        cells: [], // 2D array of clickable cell GameObjects
        isSyncing: false,
        game: new TicTacToeGame()
    };

    function hexToVector4(hex) {
        let c = hex.substring(1);
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        const num = parseInt(c, 16);
        return new BS.Vector4(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255, 1);
    }

    async function init() {
        if (!window.BS) {
            console.error("Banter SDK not found!");
            return;
        }
        BS.BanterScene.GetInstance().On("unity-loaded", setupScene);
    }

    async function setupScene() {
        console.log("TicTacToe: Setup Scene Started");
        state.root = await new BS.GameObject("TicTacToe_Root").Async();
        let t = await state.root.AddComponent(new BS.Transform());
        t.position = config.boardPosition;
        t.localEulerAngles = config.boardRotation;
        t.localScale = config.boardScale;

        // --- Construct Grid Frame ---
        const rows = 3;
        const cols = 3;
        const gap = 0.25;
        const barThickness = 0.02;
        const boardSize = gap * (cols - 1) + barThickness * 2;

        const frameRoot = await new BS.GameObject("Frame_Root").Async();
        await frameRoot.SetParent(state.root, false);
        await frameRoot.AddComponent(new BS.Transform());

        // Create 4 bars for the grid
        const barPositions = [-gap / 2, gap / 2];
        for(const pos of barPositions) {
            // Vertical bars
            await createBanterObject(frameRoot, BS.GeometryType.BoxGeometry,
                { width: barThickness, height: boardSize, depth: barThickness },
                COLORS.board, new BS.Vector3(pos, 0, 0));
            // Horizontal bars
            await createBanterObject(frameRoot, BS.GeometryType.BoxGeometry,
                { width: boardSize, height: barThickness, depth: barThickness },
                COLORS.board, new BS.Vector3(0, pos, 0));
        }

        // --- Create Cells and Piece Placeholders ---
        state.piecesRoot = await new BS.GameObject("Pieces_Root").Async();
        await state.piecesRoot.SetParent(state.root, false);
        await state.piecesRoot.AddComponent(new BS.Transform());

        const cellSize = gap * 0.9;

        for (let r = 0; r < rows; r++) {
            state.slots[r] = [];
            state.cells[r] = [];
            for (let c = 0; c < cols; c++) {
                const x = (c - 1) * gap;
                const y = (r - 1) * -gap; // Invert Y so top-left is 0,0

                // Invisible clickable cell
                const cellObj = await createBanterObject(state.root, BS.GeometryType.BoxGeometry,
                    { width: cellSize, height: cellSize, depth: 0.05 },
                    '#FFFFFF', new BS.Vector3(x, y, 0), true, 0.0);
                
                cellObj.name = `Cell_${r}_${c}`;
                cellObj.On('click', () => {
                    console.log(`TicTacToe: Cell ${r}, ${c} clicked`);
                    handleCellClick(r, c);
                });
                state.cells[r][c] = cellObj;

                // Visible piece placeholder (starts empty) - needs unique material for color changes
                const piece = await createBanterObject(state.piecesRoot, BS.GeometryType.BoxGeometry,
                     { width: cellSize * 0.8, height: cellSize * 0.8, depth: 0.05 },
                     COLORS.empty, new BS.Vector3(x, y, 0.03), false, 1.0, `piece_${r}_${c}`
                );
                state.slots[r][c] = piece;
            }
        }

        // Reset Button
        if (!config.hideUI) {
            const resetBtn = await createBanterObject(state.root, BS.GeometryType.BoxGeometry,
                { width: 0.2, height: 0.1, depth: 0.05 },
                '#333333', config.resetPosition, true
            );
            let rt = resetBtn.GetComponent(BS.ComponentType.Transform);
            rt.localEulerAngles = config.resetRotation;
            rt.localScale = config.resetScale;

            resetBtn.On('click', () => {
                console.log("TicTacToe: Reset clicked");
                state.game.reset();
                syncState();
            });
        }

        setupListeners();
        checkForExistingState();
        console.log("TicTacToe: Setup Scene Complete");
    }
    
    function getGeoArgs(type, dims) {
        return [
            type, null, dims.width || 1, dims.height || 1, dims.depth || 1, 1, 1, 1,
            dims.radius || 0.5, 24, 0, 6.283185, 0, 6.283185, 8, false,
            dims.radius || 0.5, dims.radius || 0.5,
            0, 1, 24, 8, 0.4, 16, 6.283185, 2, 3, 5, 5, 0, ""
        ];
    }

    async function createBanterObject(parent, type, dims, colorHex, pos, hasCollider = false, opacity = 1.0, cacheBust = null) {
        const obj = await new BS.GameObject("Geo").Async();
        await obj.SetParent(parent, false);

        let t = await obj.AddComponent(new BS.Transform());
        if (pos) t.localPosition = pos;

        const fullArgs = getGeoArgs(type, dims);
        await obj.AddComponent(new BS.BanterGeometry(...fullArgs));

        const color = hexToVector4(colorHex);
        color.w = opacity;

        const shader = opacity < 1.0 ? "Unlit/DiffuseTransparent" : "Unlit/Diffuse";
        // Use cacheBust to create unique material instance for objects that need dynamic colors
        await obj.AddComponent(new BS.BanterMaterial(shader, "", color, BS.MaterialSide.Front, false, cacheBust || ""));

        if (hasCollider) {
            let colSize = new BS.Vector3(dims.width || 1, dims.height || 1, dims.depth || 1);
            await obj.AddComponent(new BS.BoxCollider(true, new BS.Vector3(0, 0, 0), colSize));
            await obj.SetLayer(5);
        }

        return obj;
    }

    function handleCellClick(row, col) {
        if (state.game.winner) return;
        if (state.isSyncing) {
            console.log("TicTacToe: Input Locked (Syncing)");
            return;
        }

        const nextState = state.game.simulatePlay(row, col);
        if (nextState) {
            console.log("TicTacToe: Locking Input & Sending Move...");
            state.isSyncing = true;
            syncState(nextState);
        }
    }

    function syncState(newState) {
        const key = `tictactoe_game_${config.instance}`;
        const data = newState || state.game.getState();
        BS.BanterScene.GetInstance().SetPublicSpaceProps({ [key]: JSON.stringify(data) });
    }

    function updateVisuals() {
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const cell = state.game.board[r][c];
                const pieceObj = state.slots[r][c];
                const mat = pieceObj.GetComponent(BS.ComponentType.BanterMaterial);

                if (!mat) continue;

                let color = COLORS.empty;
                if (cell === 1) color = COLORS.player1;
                if (cell === 2) color = COLORS.player2;

                if (state.game.winningCells.some(([wr, wc]) => wr === r && wc === c)) {
                    color = COLORS.winHighlight;
                }
                
                mat.color = hexToVector4(color);
            }
        }
    }

    async function checkForExistingState() {
        const key = `tictactoe_game_${config.instance}`;
        const scene = BS.BanterScene.GetInstance();
        
        const getProp = () => {
            const s = scene.spaceState;
            return (s.public && s.public[key]) || (s.protected && s.protected[key]);
        };
        let val = getProp();

        if (val) {
            try {
                const data = JSON.parse(val);
                state.game.loadState(data);
                updateVisuals();
            } catch (e) {
                console.error("Failed to parse tictactoe state", e);
            }
        }
    }

    function setupListeners() {
        const key = `tictactoe_game_${config.instance}`;
        BS.BanterScene.GetInstance().On("space-state-changed", e => {
            const changes = e.detail.changes;
            if (changes && changes.find(c => c.property === key)) {
                const scene = BS.BanterScene.GetInstance();
                const s = scene.spaceState;
                const val = (s.public && s.public[key]) || (s.protected && s.protected[key]);

                if (val) {
                    try {
                        console.log("TicTacToe: Received State Change -> Loading & Unlocking");
                        const data = JSON.parse(val);
                        state.game.loadState(data);
                        updateVisuals();
                        state.isSyncing = false;
                    } catch (e) { console.error(e); }
                }
            }
        });
    }

    init();
})();
