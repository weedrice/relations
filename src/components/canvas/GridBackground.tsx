/**
 * GridBackground - 그리드 배경 컴포넌트
 * 
 * 캔버스에 그리드 패턴을 렌더링합니다.
 */

import { useMemo } from 'react';
import { Line, Group } from 'react-konva';

// ========================
// Props
// ========================
interface GridBackgroundProps {
    width: number;
    height: number;
    gridSize: number;
    scale: number;
    position: { x: number; y: number };
}

// ========================
// Component
// ========================
export default function GridBackground({
    width,
    height,
    gridSize,
    scale,
    position,
}: GridBackgroundProps) {
    const lines = useMemo(() => {
        const result: React.ReactElement[] = [];

        // 스케일을 고려한 그리드 사이즈
        const scaledGridSize = gridSize;

        // 뷰포트 범위 계산
        const startX = Math.floor(-position.x / scale / scaledGridSize) * scaledGridSize;
        const startY = Math.floor(-position.y / scale / scaledGridSize) * scaledGridSize;
        const endX = startX + (width / scale) + scaledGridSize * 2;
        const endY = startY + (height / scale) + scaledGridSize * 2;

        // 수직선
        for (let x = startX; x < endX; x += scaledGridSize) {
            const isMajor = x % (scaledGridSize * 5) === 0;
            result.push(
                <Line
                    key={`v-${x}`}
                    points={[x, startY, x, endY]}
                    stroke={isMajor ? '#334155' : '#1e293b'}
                    strokeWidth={isMajor ? 1 : 0.5}
                />
            );
        }

        // 수평선
        for (let y = startY; y < endY; y += scaledGridSize) {
            const isMajor = y % (scaledGridSize * 5) === 0;
            result.push(
                <Line
                    key={`h-${y}`}
                    points={[startX, y, endX, y]}
                    stroke={isMajor ? '#334155' : '#1e293b'}
                    strokeWidth={isMajor ? 1 : 0.5}
                />
            );
        }

        return result;
    }, [width, height, gridSize, scale, position]);

    return <Group>{lines}</Group>;
}
