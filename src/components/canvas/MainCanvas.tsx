/**
 * MainCanvas - 메인 캔버스 컴포넌트
 * 
 * Konva.js를 사용한 무한 캔버스를 제공합니다.
 * 줌/팬, 노드/엣지 렌더링을 담당합니다.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import type { Stage as StageType } from 'konva/lib/Stage';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useMapStore } from '../../stores/useMapStore';
import { useAnimatedYearData } from '../../hooks/useTimelineAnimation';
import CharacterNode from './CharacterNode';
import RelationshipEdge from './RelationshipEdge';
import GroupContainer from './GroupContainer';
import GridBackground from './GridBackground';
import GroupFormFields from '../panels/GroupFormFields';
import { GROUP_COLORS } from '../../constants/groupColors';
import { MAX_CANVAS_WIDTH, MAX_CANVAS_HEIGHT } from '../../constants/canvasSize';

// ========================
// Constants
// ========================
const MIN_SCALE = 0.1;
const MAX_SCALE = 3.0;
const SCALE_STEP = 1.1;
const MIN_GROUP_SIZE = 30;
const BOUNCE_OVERSHOOT = 0.25;  // 경계 충돌 시 튕김 방향으로 이동 비율
const BOUNCE_OUT_DURATION = 0.08;
const BOUNCE_BACK_DURATION = 0.22;

/** 스테이지 위치를 최대 캔버스 범위 안으로 클램프 (뷰포트가 0~MAX_CANVAS 밖으로 나가지 않도록) */
function clampStagePosition(
    x: number,
    y: number,
    stageW: number,
    stageH: number,
    scale: number
): { x: number; y: number } {
    const minX = stageW - MAX_CANVAS_WIDTH * scale;
    const minY = stageH - MAX_CANVAS_HEIGHT * scale;
    return {
        x: Math.max(minX, Math.min(0, x)),
        y: Math.max(minY, Math.min(0, y)),
    };
}

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
        setStageDimensions,
        clearSelection,
        data,
        currentYear,
        editorMode,
        setEditorMode,
        addGroup,
    } = useMapStore();

    // 경계 튕김 애니메이션 중에는 Stage 위치를 React에서 덮어쓰지 않음
    const [isBouncing, setIsBouncing] = useState(false);

    // 그룹 생성 모드: 드래그로 영역 지정
    const [groupDrawStart, setGroupDrawStart] = useState<{ x: number; y: number } | null>(null);
    const [groupDrawCurrent, setGroupDrawCurrent] = useState<{ x: number; y: number } | null>(null);
    const [groupCreateModal, setGroupCreateModal] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupColor, setNewGroupColor] = useState('#ef4444');

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
    const showCanvasBoundary = data.globalSettings.showCanvasBoundary ?? true;
    const gridSize = data.globalSettings.gridSize;

    // ========================
    // Resize Handler
    // ========================
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const w = Math.min(containerRef.current.offsetWidth, MAX_CANVAS_WIDTH);
                const h = Math.min(containerRef.current.offsetHeight, MAX_CANVAS_HEIGHT);
                setDimensions({ width: w, height: h });
                setStageDimensions(w, h);
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        return () => window.removeEventListener('resize', updateDimensions);
    }, [setStageDimensions]);

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

            // 새 위치 계산 (마우스 포인터 중심으로 줌) 후 경계 안으로 클램프
            const rawPos = {
                x: pointer.x - mousePointTo.x * clampedScale,
                y: pointer.y - mousePointTo.y * clampedScale,
            };
            const stageW = stage.width();
            const stageH = stage.height();
            const newPos = clampStagePosition(rawPos.x, rawPos.y, stageW, stageH, clampedScale);

            setStageScale(clampedScale);
            setStagePosition(newPos);
        },
        [setStageScale, setStagePosition]
    );

    // 드래그 시 경계 밖으로 나가지 않도록 제한하고, 경계에 닿으면 튕김용 overshoot 저장
    const dragBoundFunc = useCallback(
        (pos: { x: number; y: number }) => {
            const stageW = dimensions.width;
            const stageH = dimensions.height;
            const scale = stageScale;
            const clamped = clampStagePosition(pos.x, pos.y, stageW, stageH, scale);
            if (clamped.x !== pos.x || clamped.y !== pos.y) {
                boundaryOvershootRef.current = {
                    dx: pos.x - clamped.x,
                    dy: pos.y - clamped.y,
                };
            } else {
                boundaryOvershootRef.current = null;
            }
            return clamped;
        },
        [dimensions.width, dimensions.height, stageScale]
    );

    // ========================
    // Drag Handler (Pan)
    // ========================
    const handleDragEnd = useCallback(
        (e: KonvaEventObject<DragEvent>) => {
            if (e.target !== stageRef.current) return;

            const x = e.target.x();
            const y = e.target.y();
            const stageW = dimensions.width;
            const stageH = dimensions.height;
            const scale = stageScale;
            const clamped = clampStagePosition(x, y, stageW, stageH, scale);
            const overshoot = boundaryOvershootRef.current;
            boundaryOvershootRef.current = null;

            if (overshoot && (overshoot.dx !== 0 || overshoot.dy !== 0)) {
                const stage = stageRef.current;
                if (stage) {
                    setIsBouncing(true);
                    const overshootX = clamped.x + overshoot.dx * BOUNCE_OVERSHOOT;
                    const overshootY = clamped.y + overshoot.dy * BOUNCE_OVERSHOOT;
                    stage.to({
                        x: overshootX,
                        y: overshootY,
                        duration: BOUNCE_OUT_DURATION,
                        easing: Konva.Easings.Linear,
                        onFinish: () => {
                            stage.to({
                                x: clamped.x,
                                y: clamped.y,
                                duration: BOUNCE_BACK_DURATION,
                                easing: Konva.Easings.EaseOutBounce,
                                onFinish: () => {
                                    setStagePosition(clamped);
                                    setIsBouncing(false);
                                },
                            });
                        },
                    });
                    return;
                }
            }
            setStagePosition(clamped);
        },
        [dimensions.width, dimensions.height, stageScale, setStagePosition]
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

    // 그룹 모드: 포인터 위치를 스테이지(데이터) 좌표로 변환
    const getPointerDataPosition = useCallback(() => {
        const stage = stageRef.current;
        if (!stage) return null;
        const pos = stage.getPointerPosition();
        if (!pos) return null;
        return {
            x: (pos.x - stagePosition.x) / stageScale,
            y: (pos.y - stagePosition.y) / stageScale,
        };
    }, [stagePosition, stageScale]);

    // 최신 stagePosition / stageScale을 리스너에서 참조하기 위한 ref
    const stagePositionRef = useRef(stagePosition);
    const stageScaleRef = useRef(stageScale);
    stagePositionRef.current = stagePosition;
    stageScaleRef.current = stageScale;

    // 드래그가 경계에서 막혔을 때 튕김 애니메이션용 (요청 위치 - 클램프된 위치)
    const boundaryOvershootRef = useRef<{ dx: number; dy: number } | null>(null);

    // 그룹 모드: 드래그 시작 시 즉시 window 리스너 등록 (useEffect는 mouseup 이후에 실행되므로 동기 등록 필요)
    const handleGroupOverlayMouseDown = useCallback(
        (e: KonvaEventObject<MouseEvent>) => {
            e.cancelBubble = true;
            const pos = getPointerDataPosition();
            if (!pos) return;

            setGroupDrawStart(pos);
            setGroupDrawCurrent(pos);

            const startPos = { ...pos };
            const currentPosRef = { current: { ...pos } };

            const handleMove = (ev: MouseEvent) => {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                const cx = ev.clientX - rect.left;
                const cy = ev.clientY - rect.top;
                const sp = stagePositionRef.current;
                const sc = stageScaleRef.current;
                const dataX = (cx - sp.x) / sc;
                const dataY = (cy - sp.y) / sc;
                currentPosRef.current = { x: dataX, y: dataY };
                setGroupDrawCurrent({ x: dataX, y: dataY });
            };

            const handleUp = () => {
                window.removeEventListener('mousemove', handleMove);
                window.removeEventListener('mouseup', handleUp);

                const cur = currentPosRef.current;
                const minX = Math.min(startPos.x, cur.x);
                const minY = Math.min(startPos.y, cur.y);
                const maxX = Math.max(startPos.x, cur.x);
                const maxY = Math.max(startPos.y, cur.y);
                const width = maxX - minX;
                const height = maxY - minY;

                setGroupDrawStart(null);
                setGroupDrawCurrent(null);

                if (width >= MIN_GROUP_SIZE && height >= MIN_GROUP_SIZE) {
                    setGroupCreateModal({ x: minX, y: minY, width, height });
                    setNewGroupName('');
                    setNewGroupColor(GROUP_COLORS[0]);
                }
            };

            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
        },
        [getPointerDataPosition]
    );

    // 그룹 생성 모달: 생성 후 그룹 모드 해제
    const handleConfirmGroupCreate = useCallback(() => {
        if (!groupCreateModal || !newGroupName.trim()) return;
        addGroup({
            name: newGroupName.trim(),
            color: newGroupColor,
            x: groupCreateModal.x,
            y: groupCreateModal.y,
            width: groupCreateModal.width,
            height: groupCreateModal.height,
        });
        setGroupCreateModal(null);
        setEditorMode('select');
    }, [groupCreateModal, newGroupName, newGroupColor, addGroup, setEditorMode]);

    // 그룹 생성 모달: 취소
    const handleCancelGroupCreate = useCallback(() => {
        setGroupCreateModal(null);
    }, []);

    // 그룹 드래그 미리보기 사각형
    const groupPreviewRect = groupDrawStart && groupDrawCurrent
        ? {
            x: Math.min(groupDrawStart.x, groupDrawCurrent.x),
            y: Math.min(groupDrawStart.y, groupDrawCurrent.y),
            width: Math.abs(groupDrawCurrent.x - groupDrawStart.x),
            height: Math.abs(groupDrawCurrent.y - groupDrawStart.y),
        }
        : null;

    // ========================
    // Render
    // ========================
    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-slate-950 overflow-hidden relative"
            style={{ maxWidth: MAX_CANVAS_WIDTH, maxHeight: MAX_CANVAS_HEIGHT }}
        >
            <Stage
                ref={stageRef}
                width={dimensions.width}
                height={dimensions.height}
                {...(isBouncing ? {} : { x: stagePosition.x, y: stagePosition.y })}
                scaleX={stageScale}
                scaleY={stageScale}
                draggable={editorMode !== 'group'}
                dragBoundFunc={dragBoundFunc}
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

                {/* Canvas boundary (0,0 ~ MAX_CANVAS) */}
                {showCanvasBoundary && (
                    <Layer listening={false}>
                        <Rect
                            x={0}
                            y={0}
                            width={MAX_CANVAS_WIDTH}
                            height={MAX_CANVAS_HEIGHT}
                            fill="transparent"
                            stroke="rgba(34, 211, 238, 0.9)"
                            strokeWidth={2 / stageScale}
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

                {/* 그룹 모드: 미리보기 + 드래그 캡처 (레이어 1개로 통합) */}
                {editorMode === 'group' && (
                    <Layer>
                        {groupPreviewRect && (
                            <Rect
                                x={groupPreviewRect.x}
                                y={groupPreviewRect.y}
                                width={groupPreviewRect.width}
                                height={groupPreviewRect.height}
                                fill="rgba(59, 130, 246, 0.2)"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                listening={false}
                            />
                        )}
                        <Rect
                            x={-stagePosition.x / stageScale}
                            y={-stagePosition.y / stageScale}
                            width={dimensions.width / stageScale + 1}
                            height={dimensions.height / stageScale + 1}
                            fill="transparent"
                            listening={true}
                            onMouseDown={handleGroupOverlayMouseDown}
                        />
                    </Layer>
                )}
            </Stage>

            {/* 그룹 생성 모달 (이름·색상 입력) */}
            {groupCreateModal && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/50 z-[60]"
                    onClick={(e) => e.target === e.currentTarget && handleCancelGroupCreate()}
                >
                    <div
                        className="panel-base w-[330px] rounded-xl"
                    style={{ padding: '12px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-bold text-white" style={{ marginBottom: '24px' }}>새 그룹</h3>
                        <GroupFormFields
                            nameLabel="이름"
                            nameValue={newGroupName}
                            onNameChange={setNewGroupName}
                            namePlaceholder="그룹 이름"
                            color={newGroupColor}
                            onColorChange={setNewGroupColor}
                            onCancel={handleCancelGroupCreate}
                            onConfirm={handleConfirmGroupCreate}
                            confirmLabel="생성"
                            confirmDisabled={!newGroupName.trim()}
                            nameInputClassName="input-base w-full text-sm"
                            autoFocus
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
