# Banter Tic-Tac-Toe

A simple, fully synchronized multiplayer Tic-Tac-Toe game designed for the Banter platform.

## Description

This script creates a complete Tic-Tac-Toe game within a Banter space. The game state is synchronized across all players using Banter's public space properties, ensuring that everyone sees the same game board and turns are handled correctly.

The game board and pieces are created using Banter's primitive geometry, and the script includes a simple UI for resetting the game.

## How to Use

1.  **Place the Script:** Make sure the `TicTacToe.js` script is hosted in a location accessible to your Banter space.
2.  **Add to Your Space:** In your Banter space, add an "Embed" with the URL pointing to your hosted `TicTacToe.js` script.

The script will automatically initialize, draw the game board, and handle all game logic and synchronization.

## Configuration

You can customize the game's appearance and behavior by adding URL parameters to the script's URL in the Banter Embed settings.

**Example:**
`https://your-domain.com/TicTacToe.js?instance=game1&boardScale=1.5 1.5 1.5`

### Available Parameters

| Parameter         | Type          | Default                               | Description                                                                                             |
| ----------------- | ------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `instance`        | `string`      | (Current URL)                         | An ID to distinguish between multiple game instances. Players in spaces with the same instance ID will be synced. |
| `boardPosition`   | `Vector3 (string)` | `"0 1.2 0"`                           | The `X Y Z` position of the game board in world space. Values are space-separated.                      |
| `boardRotation`   | `Vector3 (string)` | `"0 0 0"`                             | The `X Y Z` euler rotation of the game board.                                                           |
| `boardScale`      | `Vector3 (string)` | `"1 1 1"`                             | The `X Y Z` scale of the entire game object.                                                            |
| `resetPosition`   | `Vector3 (string)` | `"0 -0.4 0"`                          | The `X Y Z` position of the reset button, relative to the board.                                        |
| `resetRotation`   | `Vector3 (string)` | `"0 0 0"`                             | The `X Y Z` euler rotation of the reset button.                                                         |
| `resetScale`      | `Vector3 (string)` | `"1 1 1"`                             | The `X Y Z` scale of the reset button.                                                                  |
| `hideUI`          | `boolean`     | `false`                               | Set to `true` to hide the reset button.                                                                 |

---