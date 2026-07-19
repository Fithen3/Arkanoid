// Pure data: brick-type codes per row (0 = empty), 15 columns wide.
// Codes match BRICK_TYPES in constants.js:
// 1 red, 2 orange, 3 yellow, 4 green, 5 cyan, 6 magenta, 7 silver (2hp), 8 gold (indestructible)

function solidRow(code, cols = 15) {
  return new Array(cols).fill(code);
}

export const LEVELS = [
  // Round 1: classic full banded wall, no gaps.
  {
    rows: [
      solidRow(6),
      solidRow(6),
      solidRow(5),
      solidRow(5),
      solidRow(3),
      solidRow(3),
      solidRow(1),
      solidRow(1),
    ],
  },

  // Round 2: checkered gaps and a row of silver bricks.
  {
    rows: [
      [6, 6, 0, 6, 6, 0, 6, 6, 0, 6, 6, 0, 6, 6, 0],
      [0, 5, 5, 0, 5, 5, 0, 5, 5, 0, 5, 5, 0, 5, 5],
      solidRow(7),
      [4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4],
      solidRow(3),
      [0, 2, 2, 2, 0, 2, 2, 2, 0, 2, 2, 2, 0, 2, 2],
      solidRow(1),
    ],
  },

  // Round 3: gold pillars guard a silver core.
  {
    rows: [
      solidRow(6),
      [6, 8, 6, 6, 6, 8, 6, 6, 6, 8, 6, 6, 6, 8, 6],
      solidRow(5),
      [3, 3, 7, 7, 7, 3, 3, 3, 3, 3, 7, 7, 7, 3, 3],
      [2, 2, 7, 7, 7, 2, 2, 2, 2, 2, 7, 7, 7, 2, 2],
      solidRow(1),
      [1, 8, 1, 1, 1, 1, 8, 1, 1, 8, 1, 1, 1, 8, 1],
    ],
  },
];
