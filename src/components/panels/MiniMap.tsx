/**
 * MiniMap - 미니맵 컴포넌트
 * 
 * 캔버스 전체 뷰를 축소하여 보여주는 미니맵을 제공합니다.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMapStore } from '../../stores/useMapStore';

// ========================
// Constants
// ========================
const MINIMAP_WIDTH = 160;
const MINIMAP_HEIGHT = 120;
const MINIMAP_PADDING = 10;

// ========================
// Component
// ========================
export default function MiniMap() {
    // Store
    const { data, currentYear, stagePosition, stageScale } = useMapStore();

    const yearData = data.timeline.find((t) => t.year === currentYear);
    const nodes = yearData?.nodes || [];

    // ========================
    // Calculate Bounds
    // ========================
    const { bounds, scale } = useMemo(() => {
        if (nodes.length === 0) {
            return {
                bounds: { minX: 0, minY: 0, maxX: 800, maxY: 600 },
                scale: 1,
            };
        }

        const minX = Math.min(...nodes.map((n) => n.x)) - 100;
        const minY = Math.min(...nodes.map((n) => n.y)) - 100;
        const maxX = Math.max(...nodes.map((n) => n.x)) + 100;
        const maxY = Math.max(...nodes.map((n) => n.y)) + 100;

        const width = maxX - minX;
        const height = maxY - minY;

        const scaleX = (MINIMAP_WIDTH - MINIMAP_PADDING * 2) / width;
        const scaleY = (MINIMAP_HEIGHT - MINIMAP_PADDING * 2) / height;
        const mapScale = Math.min(scaleX, scaleY, 0.1);

        return {
            bounds: { minX, minY, maxX, maxY },
            scale: mapScale,
        };
    }, [nodes]);

    // ========================
    // Transform Node Position to Minimap
    // ========================
    const transformX = (x: number) =>
        (x - bounds.minX) * scale + MINIMAP_PADDING;
    const transformY = (y: number) =>
        (y - bounds.minY) * scale + MINIMAP_PADDING;

    // ========================
    // Viewport Rectangle
    // ========================
    const viewportRect = useMemo(() => {
        // 현재 뷰포트의 월드 좌표 계산
        const viewportWidth = window.innerWidth / stageScale;
        const viewportHeight = window.innerHeight / stageScale;
        const viewportX = -stagePosition.x / stageScale;
        const viewportY = -stagePosition.y / stageScale;

        return {
            x: transformX(viewportX),
            y: transformY(viewportY),
            width: viewportWidth * scale,
            height: viewportHeight * scale,
        };
    }, [stagePosition, stageScale, scale, bounds]);

    // ========================
    // Render
    // ========================
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-4 right-4 bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-slate-700/50 overflow-hidden"
        >
            <svg width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT}>
                {/* Background */}
                <rect
                    width={MINIMAP_WIDTH}
                    height={MINIMAP_HEIGHT}
                    fill="#0f172a"
                />

                {/* Nodes */}
                {nodes.map((node) => (
                    <circle
                        key={node.id}
                        cx={transformX(node.x)}
                        cy={transformY(node.y)}
                        r={4}
                        fill={
                            node.status === 'alive'
                                ? '#60a5fa'
                                : node.status === 'dead'
                                    ? '#6b7280'
                                    : '#f59e0b'
                        }
                    />
                ))}

                {/* Viewport Indicator */}
                <rect
                    x={viewportRect.x}
                    y={viewportRect.y}
                    width={Math.max(viewportRect.width, 20)}
                    height={Math.max(viewportRect.height, 15)}
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth={1}
                    opacity={0.8}
                />
            </svg>
        </motion.div>
    );
}
