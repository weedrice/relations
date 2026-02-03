/**
 * MainCanvas - 메인 캔버스 컴포넌트
 * 
 * Konva.js를 사용한 무한 캔버스를 제공합니다.
 * 줌/팬, 노드/엣지 렌더링을 담당합니다.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import type { Stage as StageType } from 'konva/lib/Stage';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useMapStore } from '../../stores/useMapStore';
import { useAnimatedYearData } from '../../hooks/useTimelineAnimation';
import CharacterNode from './CharacterNode';
import RelationshipEdge from './RelationshipEdge';
import GroupContainer from './GroupContainer';
import GridBackground from './GridBackground';

// ========================
// Constants
// ========================
const MIN_SCALE = 0.1;
const MAX_SCALE = 3.0;
const SCALE_STEP = 1.1;

// ========================
// Component
// ========================
export default function MainCanvas() {
    const stageRef = useRef<StageType>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // Store
    const {
        stagePosition,
        stageScale,
        setStagePosition,
        setStageScale,
        clearSelection,
        data,
        currentYear,
    } = useMapStore();

    // 전역 Stage Ref 동기화
    useEffect(() => {
        (window as unknown as { __stageRef: StageType | null }).__stageRef = stageRef.current;
    });

    // 애니메이션이 적용된 연도 데이터
    const animatedData = useAnimatedYearData(data.timeline, currentYear);
    const nodes = animatedData?.nodes || [];
    const edges = animatedData?.edges || [];
    const groups = animatedData?.groups || [];
    const showGrid = data.globalSettings.showGrid;
    const gridSize = data.globalSettings.gridSize;

    // ========================
    // Resize Handler
    // ========================
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // ========================
    // Wheel Handler (Zoom)
    // ========================
    const handleWheel = useCallback(
        (e: KonvaEventObject<WheelEvent>) => {
            e.evt.preventDefault();

            const stage = stageRef.current;
            if (!stage) return;

            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };

            // 새 스케일 계산
            const direction = e.evt.deltaY > 0 ? -1 : 1;
            const newScale = direction > 0 ? oldScale * SCALE_STEP : oldScale / SCALE_STEP;
            const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

            // 새 위치 계산 (마우스 포인터 중심으로 줌)
            const newPos = {
                x: pointer.x - mousePointTo.x * clampedScale,
                y: pointer.y - mousePointTo.y * clampedScale,
            };

            setStageScale(clampedScale);
            setStagePosition(newPos);
        },
        [setStageScale, setStagePosition]
    );

    // ========================
    // Drag Handler (Pan)
    // ========================
    const handleDragEnd = useCallback(
        (e: KonvaEventObject<DragEvent>) => {
            // Stage 자체의 드래그만 처리
            if (e.target === stageRef.current) {
                setStagePosition({
                    x: e.target.x(),
                    y: e.target.y(),
                });
            }
        },
        [setStagePosition]
    );

    // ========================
    // Click Handler (Selection Clear)
    // ========================
    const handleStageClick = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e: KonvaEventObject<any>) => {
            // Stage 배경 클릭 시 선택 해제
            if (e.target === stageRef.current) {
                clearSelection();
            }
        },
        [clearSelection]
    );

    // ========================
    // Render
    // ========================
    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-slate-900 overflow-hidden"
        >
            <Stage
                ref={stageRef}
                width={dimensions.width}
                height={dimensions.height}
                x={stagePosition.x}
                y={stagePosition.y}
                scaleX={stageScale}
                scaleY={stageScale}
                draggable
                onWheel={handleWheel}
                onDragEnd={handleDragEnd}
                onClick={handleStageClick}
                onTap={handleStageClick}
            >
                {/* Grid Layer */}
                {showGrid && (
                    <Layer listening={false}>
                        <GridBackground
                            width={dimensions.width}
                            height={dimensions.height}
                            gridSize={gridSize}
                            scale={stageScale}
                            position={stagePosition}
                        />
                    </Layer>
                )}

                {/* Groups Layer */}
                <Layer>
                    {groups.map((group) => (
                        <GroupContainer key={group.id} group={group} />
                    ))}
                </Layer>

                {/* Edges Layer */}
                <Layer>
                    {edges.map((edge) => {
                        const sourceNode = nodes.find((n) => n.id === edge.sourceId);
                        const targetNode = nodes.find((n) => n.id === edge.targetId);
                        if (!sourceNode || !targetNode) return null;

                        return (
                            <RelationshipEdge
                                key={edge.id}
                                edge={edge}
                                sourceNode={sourceNode}
                                targetNode={targetNode}
                            />
                        );
                    })}
                </Layer>

                {/* Nodes Layer */}
                <Layer>
                    {nodes.map((node) => (
                        <CharacterNode key={node.id} node={node} />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
}
