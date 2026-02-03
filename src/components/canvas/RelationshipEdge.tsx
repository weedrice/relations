/**
 * RelationshipEdge - 관계선 컴포넌트
 * 
 * 두 노드 사이의 관계를 베지어 커브로 연결합니다.
 * 관계 유형별 색상과 스타일을 적용합니다.
 */

import { useCallback, useState, useMemo } from 'react';
import { Group, Line, Arrow, Text, Rect } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { RelationshipEdge as RelationshipEdgeType, CharacterNode } from '../../stores/types';
import { useMapStore } from '../../stores/useMapStore';
import { getRelationshipStyle } from '../../constants/relationshipPresets';

// ========================
// Constants
// ========================
const NODE_RADIUS = 50; // 노드 반지름

// ========================
// Props
// ========================
interface RelationshipEdgeProps {
    edge: RelationshipEdgeType;
    sourceNode: CharacterNode;
    targetNode: CharacterNode;
}

// ========================
// Helper Functions
// ========================

/**
 * 두 점 사이의 베지어 커브 제어점 계산
 */
function calculateControlPoints(
    x1: number,
    y1: number,
    x2: number,
    y2: number
): { cx1: number; cy1: number; cx2: number; cy2: number } {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 커브 강도 (거리에 비례)
    const curvature = Math.min(distance * 0.3, 100);

    // 수직 방향으로 제어점 오프셋
    const perpX = -dy / distance;
    const perpY = dx / distance;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    return {
        cx1: midX + perpX * curvature * 0.3,
        cy1: midY + perpY * curvature * 0.3,
        cx2: midX + perpX * curvature * 0.3,
        cy2: midY + perpY * curvature * 0.3,
    };
}

/**
 * 원의 가장자리 점 계산
 */
function getCircleEdgePoint(
    cx: number,
    cy: number,
    targetX: number,
    targetY: number,
    radius: number
): { x: number; y: number } {
    const dx = targetX - cx;
    const dy = targetY - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return { x: cx, y: cy };

    return {
        x: cx + (dx / distance) * radius,
        y: cy + (dy / distance) * radius,
    };
}

// ========================
// Component
// ========================
export default function RelationshipEdge({
    edge,
    sourceNode,
    targetNode,
}: RelationshipEdgeProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Store
    const { selectedEdgeIds, selectEdge } = useMapStore();
    const isSelected = selectedEdgeIds.includes(edge.id);

    // 스타일 가져오기
    const preset = getRelationshipStyle(edge.type);
    const color = edge.color || preset.color;
    const strokeWidth = edge.strokeWidth || preset.strokeWidth;
    const dash = edge.customStyle?.dashArray || preset.dashArray;

    // ========================
    // Calculate Points
    // ========================
    const points = useMemo(() => {
        // 소스와 타겟의 원 가장자리 점 계산
        const sourceEdge = getCircleEdgePoint(
            sourceNode.x,
            sourceNode.y,
            targetNode.x,
            targetNode.y,
            NODE_RADIUS
        );

        const targetEdge = getCircleEdgePoint(
            targetNode.x,
            targetNode.y,
            sourceNode.x,
            sourceNode.y,
            NODE_RADIUS
        );

        // 제어점 계산
        const control = calculateControlPoints(
            sourceEdge.x,
            sourceEdge.y,
            targetEdge.x,
            targetEdge.y
        );

        // 라벨 위치 계산 (곡선의 중간점)
        const t = 0.5;
        const labelX =
            Math.pow(1 - t, 3) * sourceEdge.x +
            3 * Math.pow(1 - t, 2) * t * control.cx1 +
            3 * (1 - t) * Math.pow(t, 2) * control.cx2 +
            Math.pow(t, 3) * targetEdge.x;
        const labelY =
            Math.pow(1 - t, 3) * sourceEdge.y +
            3 * Math.pow(1 - t, 2) * t * control.cy1 +
            3 * (1 - t) * Math.pow(t, 2) * control.cy2 +
            Math.pow(t, 3) * targetEdge.y;

        return {
            source: sourceEdge,
            target: targetEdge,
            control,
            label: { x: labelX, y: labelY },
        };
    }, [sourceNode.x, sourceNode.y, targetNode.x, targetNode.y]);

    // ========================
    // Event Handlers
    // ========================
    const handleClick = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e: KonvaEventObject<any>) => {
            e.cancelBubble = true;
            const isMultiSelect = e.evt?.shiftKey || e.evt?.ctrlKey || e.evt?.metaKey;
            selectEdge(edge.id, isMultiSelect);
        },
        [edge.id, selectEdge]
    );

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    // ========================
    // Render
    // ========================
    const displayColor = isSelected ? '#60a5fa' : isHovered ? '#93c5fd' : color;
    const displayWidth = isSelected ? strokeWidth + 2 : isHovered ? strokeWidth + 1 : strokeWidth;
    const label = edge.label || preset.label;

    // Quadratic curve points for Line
    const linePoints = [
        points.source.x,
        points.source.y,
        points.control.cx1,
        points.control.cy1,
        points.target.x,
        points.target.y,
    ];

    return (
        <Group
            onClick={handleClick}
            onTap={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Hit Area (Invisible, for easier selection) */}
            <Line
                points={linePoints}
                stroke="transparent"
                strokeWidth={20}
                tension={0.5}
                bezier
            />

            {/* Main Line */}
            {edge.bidirectional ? (
                // 양방향: 일반 선
                <Line
                    points={linePoints}
                    stroke={displayColor}
                    strokeWidth={displayWidth}
                    dash={dash}
                    tension={0.5}
                    bezier
                    lineCap="round"
                    lineJoin="round"
                    opacity={edge.customStyle?.opacity ?? 1}
                />
            ) : (
                // 단방향: 화살표
                <Arrow
                    points={linePoints}
                    stroke={displayColor}
                    strokeWidth={displayWidth}
                    fill={displayColor}
                    dash={dash}
                    tension={0.5}
                    bezier
                    pointerLength={12}
                    pointerWidth={10}
                    lineCap="round"
                    lineJoin="round"
                    opacity={edge.customStyle?.opacity ?? 1}
                />
            )}

            {/* Label */}
            {label && (
                <Group x={points.label.x} y={points.label.y}>
                    {/* Label Background */}
                    <Rect
                        x={-40}
                        y={-12}
                        width={80}
                        height={24}
                        fill="#1e293b"
                        cornerRadius={4}
                        opacity={0.9}
                    />
                    {/* Label Text */}
                    <Text
                        text={label}
                        fontSize={12}
                        fontFamily="Inter, sans-serif"
                        fill="#e2e8f0"
                        align="center"
                        verticalAlign="middle"
                        width={80}
                        height={24}
                        x={-40}
                        y={-12}
                    />
                </Group>
            )}
        </Group>
    );
}
