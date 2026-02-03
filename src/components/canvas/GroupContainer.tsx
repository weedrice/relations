/**
 * GroupContainer - 그룹 컨테이너 컴포넌트
 *
 * 캐릭터들을 그룹화하는 배경 영역을 렌더링합니다.
 * 좌상단 고정, 우하단 핸들 드래그로 크기 조절(실시간 반영).
 */

import { useCallback, useRef, useState } from 'react';
import { Group as KonvaGroup, Rect, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Group } from '../../stores/types';
import { useMapStore } from '../../stores/useMapStore';

const RESIZE_HANDLE_SIZE = 20;
const MIN_GROUP_WIDTH = 120;
const MIN_GROUP_HEIGHT = 80;

interface GroupContainerProps {
    group: Group;
}

export default function GroupContainer({ group }: GroupContainerProps) {
    const groupRef = useRef<import('konva/lib/Group').Group>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeWidth, setResizeWidth] = useState(group.width);
    const [resizeHeight, setResizeHeight] = useState(group.height);
    const { updateGroup, data } = useMapStore();
    const snapToGrid = data.globalSettings.snapToGrid;
    const gridSize = data.globalSettings.gridSize;

    const handleDragEnd = useCallback(
        (e: KonvaEventObject<DragEvent>) => {
            if (e.target !== groupRef.current) return;
            let x = e.target.x();
            let y = e.target.y();
            if (snapToGrid) {
                x = Math.round(x / gridSize) * gridSize;
                y = Math.round(y / gridSize) * gridSize;
            }
            updateGroup(group.id, { x, y });
        },
        [group.id, updateGroup, snapToGrid, gridSize]
    );

    const handleResizeStart = useCallback(
        (e: KonvaEventObject<DragEvent>) => {
            e.cancelBubble = true;
            setIsResizing(true);
            setResizeWidth(group.width);
            setResizeHeight(group.height);
        },
        [group.width, group.height]
    );

    const handleResizeMove = useCallback(
        (e: KonvaEventObject<DragEvent>) => {
            e.cancelBubble = true;
            const handle = e.target;
            const newWidth = Math.max(MIN_GROUP_WIDTH, handle.x() + RESIZE_HANDLE_SIZE);
            const newHeight = Math.max(MIN_GROUP_HEIGHT, handle.y() + RESIZE_HANDLE_SIZE);
            setResizeWidth(newWidth);
            setResizeHeight(newHeight);
        },
        []
    );

    const handleResizeEnd = useCallback(
        (e: KonvaEventObject<DragEvent>) => {
            e.cancelBubble = true;
            const handle = e.target;
            const w = Math.max(MIN_GROUP_WIDTH, handle.x() + RESIZE_HANDLE_SIZE);
            const h = Math.max(MIN_GROUP_HEIGHT, handle.y() + RESIZE_HANDLE_SIZE);
            updateGroup(group.id, { width: w, height: h });
            setIsResizing(false);
        },
        [group.id, updateGroup]
    );

    // 리사이즈 핸들: 좌상단 고정이므로 우하단으로만 확장 가능 (최소 크기 이상으로 제한)
    const resizeDragBound = useCallback((pos: { x: number; y: number }) => ({
        x: Math.max(pos.x, MIN_GROUP_WIDTH - RESIZE_HANDLE_SIZE),
        y: Math.max(pos.y, MIN_GROUP_HEIGHT - RESIZE_HANDLE_SIZE),
    }), []);

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    const handleDblClick = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e: KonvaEventObject<any>) => {
            e.cancelBubble = true;
            window.dispatchEvent(new CustomEvent('open-group-panel', { detail: { groupId: group.id } }));
        },
        [group.id]
    );

    const borderColor = isHovered ? '#64748b' : '#334155';
    const displayWidth = isResizing ? resizeWidth : group.width;
    const displayHeight = isResizing ? resizeHeight : group.height;

    return (
        <KonvaGroup
            ref={groupRef}
            x={group.x}
            y={group.y}
            draggable={!isResizing}
            onDragEnd={handleDragEnd}
            onDblClick={handleDblClick}
            onDblTap={handleDblClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Rect
                width={displayWidth}
                height={displayHeight}
                fill={group.color}
                opacity={0.15}
                cornerRadius={12}
            />
            <Rect
                width={displayWidth}
                height={displayHeight}
                stroke={borderColor}
                strokeWidth={2}
                cornerRadius={12}
                dash={[8, 4]}
            />
            <Text
                text={group.name}
                fontSize={16}
                fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
                fontStyle="600"
                fill={group.color}
                x={16}
                y={12}
                opacity={0.8}
            />
            {/* 우하단 리사이즈 핸들 - 좌상단 고정, 그룹 드래그와 분리 */}
            <Rect
                x={displayWidth - RESIZE_HANDLE_SIZE}
                y={displayHeight - RESIZE_HANDLE_SIZE}
                width={RESIZE_HANDLE_SIZE}
                height={RESIZE_HANDLE_SIZE}
                fill={group.color}
                opacity={0.5}
                cornerRadius={4}
                draggable
                dragBoundFunc={resizeDragBound}
                onDragStart={handleResizeStart}
                onDragMove={handleResizeMove}
                onDragEnd={handleResizeEnd}
                onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'nwse-resize';
                }}
                onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = '';
                }}
                listening={true}
            />
        </KonvaGroup>
    );
}
