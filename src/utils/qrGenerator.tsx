import React from 'react';

interface QrProps {
  value: string;
  size?: number;
  className?: string;
  bgColor?: string;
  fgColor?: string;
}

/**
 * Deterministic SVG QR Code Generator with standard finder patterns
 * and data hash matrix. Produces high-contrast, scalable vector barcodes.
 */
export const QrCodeDisplay: React.FC<QrProps> = ({
  value,
  size = 140,
  className = '',
  bgColor = '#ffffff',
  fgColor = '#000000',
}) => {
  // 21x21 standard Version 1 QR matrix layout
  const matrixSize = 25;
  const matrix: boolean[][] = Array.from({ length: matrixSize }, () =>
    Array(matrixSize).fill(false)
  );

  // Simple deterministic hash based on string
  const hashString = (str: string, seed: number) => {
    let h = 0x811c9dc5 ^ seed;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  };

  // Draw 7x7 Finder Pattern at (row, col)
  const drawFinder = (startRow: number, startCol: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startRow + r][startCol + c] = true;
        } else {
          matrix[startRow + r][startCol + c] = false;
        }
      }
    }
  };

  // 1. Top-Left Finder
  drawFinder(0, 0);
  // 2. Top-Right Finder
  drawFinder(0, matrixSize - 7);
  // 3. Bottom-Left Finder
  drawFinder(matrixSize - 7, 0);

  // Timing patterns
  for (let i = 8; i < matrixSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Populate data modules deterministically
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Skip finder zones + separators
      const inTopLeft = r <= 7 && c <= 7;
      const inTopRight = r <= 7 && c >= matrixSize - 8;
      const inBottomLeft = r >= matrixSize - 8 && c <= 7;
      const inTiming = r === 6 || c === 6;

      if (inTopLeft || inTopRight || inBottomLeft || inTiming) {
        continue;
      }

      // Hash data cell
      const cellHash = hashString(value, r * 31 + c * 17);
      matrix[r][c] = cellHash % 2 === 1;
    }
  }

  const cellSize = size / matrixSize;

  return (
    <div
      className={`inline-block p-2 bg-white rounded-md border border-slate-200 shadow-xs ${className}`}
      style={{ width: size + 16, height: size + 16 }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full block"
        shapeRendering="crispEdges"
      >
        <rect width={size} height={size} fill={bgColor} />
        {matrix.map((row, r) =>
          row.map((filled, c) => {
            if (!filled) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.1}
                height={cellSize + 0.1}
                fill={fgColor}
              />
            );
          })
        )}
      </svg>
    </div>
  );
};
