/**
 * MiniMap - 미니맵 컴포넌트
 *
 * 전체 캔버스 크기를 축소해 보여주고, 현재 표시 중인 영역(뷰포트)을
 * 사각형으로 표시합니다. (게임 미니맵 방식)
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMapStore } from '../../stores/useMapStore';
import { PANEL_Z_BASE, PANEL_Z_FOCUSED } from '../../constants/panelZIndex';
import { MAX_CANVAS_WIDTH, MAX_CANVAS_HEIGHT } from '../../constants/canvasSize';

const PANEL_ID = 'panel-minimap';

// ========================
// Constants
// ========================
const MINIMAP_WIDTH = 380;
const MINIMAP_HEIGHT = 285;
const MINIMAP_PADDING = 10;
const DRAW_WIDTH = MINIMAP_WIDTH - MINIMAP_PADDING * 2;
const DRAW_HEIGHT = MINIMAP_HEIGHT - MINIMAP_PADDING * 2;

// ========================
// Component
// ========================
export default function MiniMap() {
    const {
        data,
        currentYear,
        stagePosition,
        stageScale,
        stageDimensions,
        setStagePosition,
        focusedPanelId,
        setFocusedPanel,
    } = useMapStore();

    const yearData = data.timeline.find((t) => t.year === currentYear);
    const nodes = yearData?.nodes || [];

    // 현재 뷰(화면) 크기 = stageDimensions (실제 캔버스 픽셀)
    const viewW = stageDimensions?.width ?? typeof window !== 'undefined' ? window.innerWidth : 800;
    const viewH = stageDimensions?.height ?? typeof window !== 'undefined' ? window.innerHeight : 600;

    // 전체 맵 범위 = 고정 최대 캔버스 크기 (10240×5760). 미니맵은 이 전체를 표시.
    const fullBounds = useMemo(
        () => ({
            minX: 0,
            minY: 0,
            maxX: MAX_CANVAS_WIDTH,
            maxY: MAX_CANVAS_HEIGHT,
            width: MAX_CANVAS_WIDTH,
            height: MAX_CANVAS_HEIGHT,
        }),
        []
    );

    // 전체 맵을 미니맵 그리기 영역에 맞추는 스케일 (비율 유지)
    const scale = useMemo(() => {
        const scaleX = DRAW_WIDTH / fullBounds.width;
        const scaleY = DRAW_HEIGHT / fullBounds.height;
        return Math.min(scaleX, scaleY);
    }, [fullBounds.width, fullBounds.height]);

    // 스테이지 좌표 → 미니맵 픽셀 (전체 맵 기준)
    const transformX = (x: number) => (x - fullBounds.minX) * scale + MINIMAP_PADDING;
    const transformY = (y: number) => (y - fullBounds.minY) * scale + MINIMAP_PADDING;

    // 현재 화면에 보이는 범위(뷰포트, 스테이지 좌표)
    const viewport = useMemo(() => {
        const viewportWidth = viewW / stageScale;
        const viewportHeight = viewH / stageScale;
        const viewportX = -stagePosition.x / stageScale;
        const viewportY = -stagePosition.y / stageScale;
        return {
            x: viewportX,
            y: viewportY,
            width: viewportWidth,
            height: viewportHeight,
        };
    }, [viewW, viewH, stagePosition, stageScale]);

    // 뷰포트 사각형을 미니맵 위에 그리기 위한 좌표/크기
    const viewportRect = useMemo(() => {
        const x = transformX(viewport.x);
        const y = transformY(viewport.y);
        const w = viewport.width * scale;
        const h = viewport.height * scale;
        return { x, y, width: Math.max(w, 4), height: Math.max(h, 4) };
    }, [viewport, scale]);

    // 전체 맵(0~MAX_CANVAS) 안에 있는 노드만 표시
    const nodesInBounds = useMemo(() => {
        const { minX, maxX, minY, maxY } = fullBounds;
        return nodes.filter(
            (n) => n.x >= minX && n.x <= maxX && n.y >= minY && n.y <= maxY
        );
    }, [nodes, fullBounds]);

    // 미니맵 드래그로 뷰 이동
    const isDraggingRef = useRef(false);
    const lastClientRef = useRef({ x: 0, y: 0 });
    const didDragRef = useRef(false);

    const handleMinimapMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            isDraggingRef.current = true;
            didDragRef.current = false;
            lastClientRef.current = { x: e.clientX, y: e.clientY };

            // 드래그 시작 시, 마우스 위치를 뷰 중앙으로 맞춘 뒤 움직임 시작
            const rect = e.currentTarget.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const contentX = mx - MINIMAP_PADDING;
            const contentY = my - MINIMAP_PADDING;
            const mapScale = Math.min(DRAW_WIDTH / MAX_CANVAS_WIDTH, DRAW_HEIGHT / MAX_CANVAS_HEIGHT);
            const stageX = contentX / mapScale;
            const stageY = contentY / mapScale;
            const clampedX = Math.max(0, Math.min(MAX_CANVAS_WIDTH, stageX));
            const clampedY = Math.max(0, Math.min(MAX_CANVAS_HEIGHT, stageY));

            const { stageScale: sc, setStagePosition: setPos, stageDimensions: dims } = useMapStore.getState();
            const vw = dims?.width ?? 800;
            const vh = dims?.height ?? 600;
            setPos({
                x: vw / 2 - clampedX * sc,
                y: vh / 2 - clampedY * sc,
            });
        },
        []
    );

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return;
            e.preventDefault();
            const last = lastClientRef.current;
            const deltaX = e.clientX - last.x;
            const deltaY = e.clientY - last.y;
            if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) didDragRef.current = true;

            const { stagePosition: pos, stageScale: sc, setStagePosition: setPos } = useMapStore.getState();
            const mapScale = Math.min(DRAW_WIDTH / MAX_CANVAS_WIDTH, DRAW_HEIGHT / MAX_CANVAS_HEIGHT);
            setPos({
                x: pos.x - (deltaX * sc) / mapScale,
                y: pos.y - (deltaY * sc) / mapScale,
            });
            lastClientRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: false });
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // 미니맵 클릭(드래그 아님) → 해당 스테이지 좌표를 캔버스 중앙으로 이동
    const handleMinimapClick = useCallback(
        (e: React.MouseEvent<SVGSVGElement>) => {
            if (didDragRef.current) return;
            const svg = e.currentTarget;
            const rect = svg.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const contentX = mx - MINIMAP_PADDING;
            const contentY = my - MINIMAP_PADDING;
            const stageX = fullBounds.minX + contentX / scale;
            const stageY = fullBounds.minY + contentY / scale;
            const clampedX = Math.max(0, Math.min(MAX_CANVAS_WIDTH, stageX));
            const clampedY = Math.max(0, Math.min(MAX_CANVAS_HEIGHT, stageY));
            setStagePosition({
                x: viewW / 2 - clampedX * stageScale,
                y: viewH / 2 - clampedY * stageScale,
            });
        },
        [fullBounds, scale, stageScale, viewW, viewH, setStagePosition]
    );

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-6 right-6 panel-base overflow-hidden ring-1 ring-black/20 panel-element-margin"
            style={{ zIndex: focusedPanelId === PANEL_ID ? PANEL_Z_FOCUSED : PANEL_Z_BASE }}
            onMouseDown={(e) => { setFocusedPanel(PANEL_ID); handleMinimapMouseDown(e); }}
        >
            <svg
                width={MINIMAP_WIDTH}
                height={MINIMAP_HEIGHT}
                className="block cursor-grab active:cursor-grabbing"
                onClick={handleMinimapClick}
                role="button"
                aria-label="미니맵 클릭 시 해당 위치로 이동"
            >
                {/* 배경 (전체 맵 영역) */}
                <rect
                    width={MINIMAP_WIDTH}
                    height={MINIMAP_HEIGHT}
                    fill="#0f172a"
                />
                {/* 전체 맵 영역 테두리 */}
                <rect
                    x={MINIMAP_PADDING}
                    y={MINIMAP_PADDING}
                    width={fullBounds.width * scale}
                    height={fullBounds.height * scale}
                    fill="rgba(30, 41, 59, 0.6)"
                    stroke="rgba(71, 85, 105, 0.6)"
                    strokeWidth={1}
                />

                {/* 노드 (전체 맵 안에 있는 것만) */}
                {nodesInBounds.map((node) => (
                    <circle
                        key={node.id}
                        cx={transformX(node.x)}
                        cy={transformY(node.y)}
                        r={3}
                        fill={
                            node.status === 'alive'
                                ? '#60a5fa'
                                : node.status === 'dead'
                                    ? '#6b7280'
                                    : '#f59e0b'
                        }
                    />
                ))}

                {/* 현재 표시 중인 영역 (뷰포트) */}
                <rect
                    x={viewportRect.x}
                    y={viewportRect.y}
                    width={viewportRect.width}
                    height={viewportRect.height}
                    fill="rgba(96, 165, 250, 0.15)"
                    stroke="#60a5fa"
                    strokeWidth={1.5}
                    opacity={0.95}
                />
            </svg>
        </motion.div>
    );
}
