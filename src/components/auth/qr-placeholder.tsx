const GRID_SIZE = 21;
const CELL_PX = 8;

function isInFinder(r: number, c: number): boolean {
  return (r >= 0 && r < 7 && c >= 0 && c < 7) || false;
}

function finderCellFilled(r: number, c: number): boolean {
  if (r === 0 || r === 6 || c === 0 || c === 6) return true;
  return r >= 2 && r <= 4 && c >= 2 && c <= 4;
}

function pseudoRandomFilled(seed: number, row: number, col: number): boolean {
  const x = Math.sin(seed + row * 928371 + col * 12197) * 10000;
  return x - Math.floor(x) > 0.5;
}

/**
 * A deterministic, non-scannable placeholder that visually resembles a QR
 * code. It is generated from `seed` so the same secret always renders the
 * same pattern — it is not a real, decodable QR code.
 */
export function QrPlaceholder({ seed }: { seed: string }) {
  const seedNumber = seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  const dimension = GRID_SIZE * CELL_PX;

  const cells: React.ReactNode[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const inTopLeft = isInFinder(row, col);
      const inTopRight = isInFinder(row, col - (GRID_SIZE - 7));
      const inBottomLeft = isInFinder(row - (GRID_SIZE - 7), col);

      let filled: boolean;
      if (inTopLeft) filled = finderCellFilled(row, col);
      else if (inTopRight) filled = finderCellFilled(row, col - (GRID_SIZE - 7));
      else if (inBottomLeft) filled = finderCellFilled(row - (GRID_SIZE - 7), col);
      else filled = pseudoRandomFilled(seedNumber, row, col);

      if (filled) {
        cells.push(
          <rect key={`${row}-${col}`} x={col * CELL_PX} y={row * CELL_PX} width={CELL_PX} height={CELL_PX} fill="#0F1117" />
        );
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${dimension} ${dimension}`}
      width={dimension}
      height={dimension}
      role="img"
      aria-label="Placeholder QR code for authenticator app setup"
      className="rounded-md border border-border"
    >
      <rect x={0} y={0} width={dimension} height={dimension} fill="#FFFFFF" />
      {cells}
    </svg>
  );
}
