/**
 * CharacterNode - 캐릭터 노드 컴포넌트
 * 
 * 100px 원형 캐릭터 노드를 렌더링합니다.
 * 드래그 앤 드롭, 선택, 상태별 스타일을 지원합니다.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Circle, Image as KonvaImage, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { CharacterNode as CharacterNodeType } from '../../stores/types';
import { useMapStore } from '../../stores/useMapStore';
import { getStatusStyle } from '../../constants/statusStyles';

// ========================
// Constants
// ========================
const NODE_SIZE = 100;
const NODE_RADIUS = NODE_SIZE / 2;

// ========================
// Props
// ========================
interface CharacterNodeProps {
    node: CharacterNodeType;
}

// ========================
// Component
// ========================
export default function CharacterNode({ node }: CharacterNodeProps) {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const groupRef = useRef<import('konva/lib/Group').Group>(null);

    // Store
    const {
        selectedNodeIds,
        selectNode,
        updateNode,
        data,
        editorMode,
        connectingFromNodeId,
        startConnecting,
        completeConnecting,
    } = useMapStore();

    const isSelected = selectedNodeIds.includes(node.id);
    const isConnectingSource = connectingFromNodeId === node.id;
    const statusStyle = getStatusStyle(node.status);
    const snapToGrid = data.globalSettings.snapToGrid;
    const gridSize = data.globalSettings.gridSize;

    // ========================
    // Load Image
    // ========================
    useEffect(() => {
        if (!node.img) {
            setImage(null);
            return;
        }

        const img = new window.Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            setImage(img);
        };

        img.onerror = () => {
            console.error('Failed to load node image');
            setImage(null);
        };

        img.src = node.img;
    }, [node.img]);

    // ========================
    // Drag Handler
    // ========================
    const handleDragEnd = useCallback(
        (e: KonvaEventObject<DragEvent>) => {
            let x = e.target.x();
            let y = e.target.y();

            // 그리드 스냅
            if (snapToGrid) {
                x = Math.round(x / gridSize) * gridSize;
                y = Math.round(y / gridSize) * gridSize;
            }

            updateNode(node.id, { x, y });
        },
        [node.id, updateNode, snapToGrid, gridSize]
    );

    // ========================
    // Click Handler
    // ========================
    const handleClick = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e: KonvaEventObject<any>) => {
            e.cancelBubble = true; // 이벤트 버블링 방지

            // 연결 모드인 경우
            if (editorMode === 'connect') {
                if (connectingFromNodeId === null) {
                    // 시작 노드 선택
                    startConnecting(node.id);
                } else {
                    // 대상 노드 선택 - 관계선 생성
                    completeConnecting(node.id);
                }
                return;
            }

            // 일반 선택 모드
            const isMultiSelect = e.evt?.shiftKey || e.evt?.ctrlKey || e.evt?.metaKey;
            selectNode(node.id, isMultiSelect);
        },
        [node.id, selectNode, editorMode, connectingFromNodeId, startConnecting, completeConnecting]
    );

    // ========================
    // Hover Handlers
    // ========================
    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
        if (groupRef.current) {
            groupRef.current.getStage()?.container().style.setProperty('cursor', 'pointer');
        }
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        if (groupRef.current) {
            groupRef.current.getStage()?.container().style.setProperty('cursor', 'default');
        }
    }, []);

    // ========================
    // Styles
    // ========================
    const borderColor = isConnectingSource
        ? '#22c55e' // green-500 - 연결 시작 노드
        : isSelected
            ? '#60a5fa' // blue-400
            : isHovered
                ? '#93c5fd' // blue-300
                : statusStyle.borderColor || node.borderColor || '#374151'; // gray-700

    const borderWidth = isConnectingSource
        ? statusStyle.borderWidth + 3
        : isSelected
            ? statusStyle.borderWidth + 2
            : statusStyle.borderWidth;

    // 점선 스타일
    const dash = statusStyle.borderStyle === 'dashed' ? [10, 5] : undefined;

    // ========================
    // Render
    // ========================
    return (
        <Group
            ref={groupRef}
            x={node.x}
            y={node.y}
            draggable
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            onTap={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            opacity={statusStyle.opacity}
        >
            {/* Background Circle */}
            <Circle
                radius={NODE_RADIUS}
                fill="#1e293b"
                stroke={borderColor}
                strokeWidth={borderWidth}
                dash={dash}
            />

            {/* Profile Image (Clipped to Circle) */}
            {image && (
                <Group
                    clipFunc={(ctx) => {
                        ctx.arc(0, 0, NODE_RADIUS - 2, 0, Math.PI * 2);
                    }}
                >
                    <KonvaImage
                        image={image}
                        x={-NODE_RADIUS + 2}
                        y={-NODE_RADIUS + 2}
                        width={NODE_SIZE - 4}
                        height={NODE_SIZE - 4}
                        // Grayscale 효과는 CSS 필터로 처리
                        filters={statusStyle.grayscale ? [] : undefined}
                    />
                    {/* Grayscale Overlay for dead status */}
                    {statusStyle.grayscale && (
                        <Circle
                            radius={NODE_RADIUS - 2}
                            fill="rgba(0, 0, 0, 0.3)"
                        />
                    )}
                </Group>
            )}

            {/* Default Avatar (No Image) */}
            {!image && (
                <Text
                    text={node.attributes.name?.charAt(0) || '?'}
                    fontSize={36}
                    fontFamily="Inter, sans-serif"
                    fontStyle="bold"
                    fill="#64748b"
                    align="center"
                    verticalAlign="middle"
                    width={NODE_SIZE}
                    height={NODE_SIZE}
                    x={-NODE_RADIUS}
                    y={-NODE_RADIUS}
                />
            )}

            {/* Name Label */}
            <Text
                text={node.attributes.name || 'Unknown'}
                fontSize={14}
                fontFamily="Inter, sans-serif"
                fontStyle="600"
                fill="#f1f5f9"
                align="center"
                y={NODE_RADIUS + 8}
                width={NODE_SIZE + 40}
                x={-(NODE_SIZE + 40) / 2}
                shadowColor="#000"
                shadowBlur={4}
                shadowOpacity={0.5}
            />

            {/* Selection Indicator */}
            {isSelected && (
                <Circle
                    radius={NODE_RADIUS + 6}
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dash={[5, 5]}
                    listening={false}
                />
            )}
        </Group>
    );
}
