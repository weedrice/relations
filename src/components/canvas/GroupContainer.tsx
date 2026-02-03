/**
 * GroupContainer - 그룹 컨테이너 컴포넌트
 * 
 * 캐릭터들을 그룹화하는 배경 영역을 렌더링합니다.
 */

import { useCallback, useState } from 'react';
import { Group as KonvaGroup, Rect, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Group } from '../../stores/types';
import { useMapStore } from '../../stores/useMapStore';

// ========================
// Props
// ========================
interface GroupContainerProps {
    group: Group;
}

// ========================
// Component
// ========================
export default function GroupContainer({ group }: GroupContainerProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Store
    const { updateGroup, data } = useMapStore();
    const snapToGrid = data.globalSettings.snapToGrid;
    const gridSize = data.globalSettings.gridSize;

    // ========================
    // Drag Handler
    // ========================
    const handleDragEnd = useCallback(
        (e: KonvaEventObject<DragEvent>) => {
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

    // ========================
    // Hover Handlers
    // ========================
    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    // ========================
    // Render
    // ========================
    const borderColor = isHovered ? '#64748b' : '#334155';

    return (
        <KonvaGroup
            x={group.x}
            y={group.y}
            draggable
            onDragEnd={handleDragEnd}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Background */}
            <Rect
                width={group.width}
                height={group.height}
                fill={group.color}
                opacity={0.15}
                cornerRadius={12}
            />

            {/* Border */}
            <Rect
                width={group.width}
                height={group.height}
                stroke={borderColor}
                strokeWidth={2}
                cornerRadius={12}
                dash={[8, 4]}
            />

            {/* Title */}
            <Text
                text={group.name}
                fontSize={16}
                fontFamily="Inter, sans-serif"
                fontStyle="600"
                fill={group.color}
                x={16}
                y={12}
                opacity={0.8}
            />
        </KonvaGroup>
    );
}
