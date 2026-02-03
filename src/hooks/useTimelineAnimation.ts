/**
 * useTimelineAnimation - 타임라인 애니메이션 훅
 * 
 * 연도 전환 시 노드 위치와 상태를 부드럽게 보간합니다.
 */

import { useEffect, useState, useMemo } from 'react';
import type { CharacterNode, TimelineYear } from '../stores/types';

// 애니메이션 지속 시간 (ms)
const ANIMATION_DURATION = 500;

// 이징 함수 (ease-out-cubic)
function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

// 두 값 사이의 보간
function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

// 노드 보간
function interpolateNode(from: CharacterNode, to: CharacterNode, t: number): CharacterNode {
    return {
        ...to,
        x: lerp(from.x, to.x, t),
        y: lerp(from.y, to.y, t),
    };
}

export interface AnimatedYearData {
    year: number;
    nodes: CharacterNode[];
    edges: TimelineYear['edges'];
    groups: TimelineYear['groups'];
    isAnimating: boolean;
}

export function useTimelineAnimation(
    currentYearData: TimelineYear | undefined,
    previousYearData: TimelineYear | undefined,
    isTransitioning: boolean
): AnimatedYearData | null {
    const [animationProgress, setAnimationProgress] = useState(1);
    const [animationStartTime, setAnimationStartTime] = useState<number | null>(null);

    // 연도 전환 감지
    useEffect(() => {
        if (isTransitioning && previousYearData && currentYearData) {
            setAnimationProgress(0);
            setAnimationStartTime(performance.now());
        }
    }, [isTransitioning, previousYearData?.year, currentYearData?.year]);

    // 애니메이션 프레임 업데이트
    useEffect(() => {
        if (animationStartTime === null || animationProgress >= 1) return;

        const animate = () => {
            const elapsed = performance.now() - animationStartTime;
            const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
            const easedProgress = easeOutCubic(progress);

            setAnimationProgress(easedProgress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimationStartTime(null);
            }
        };

        const frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [animationStartTime, animationProgress]);

    // 보간된 노드 계산
    const animatedData = useMemo(() => {
        if (!currentYearData) return null;

        // 애니메이션 완료 또는 이전 데이터 없음
        if (animationProgress >= 1 || !previousYearData) {
            return {
                year: currentYearData.year,
                nodes: currentYearData.nodes,
                edges: currentYearData.edges,
                groups: currentYearData.groups,
                isAnimating: false,
            };
        }

        // 노드 보간
        const interpolatedNodes = currentYearData.nodes.map((targetNode) => {
            const sourceNode = previousYearData.nodes.find((n) => n.id === targetNode.id);

            if (!sourceNode) {
                // 새로운 노드 - 페이드 인 효과 (현재 위치에서 시작)
                return targetNode;
            }

            return interpolateNode(sourceNode, targetNode, animationProgress);
        });

        return {
            year: currentYearData.year,
            nodes: interpolatedNodes,
            edges: currentYearData.edges,
            groups: currentYearData.groups,
            isAnimating: true,
        };
    }, [currentYearData, previousYearData, animationProgress]);

    return animatedData;
}

/**
 * 간단한 버전 - 스토어에서 직접 사용
 */
export function useAnimatedYearData(
    timeline: TimelineYear[],
    currentYear: number
): AnimatedYearData | null {
    const [prevYear, setPrevYear] = useState<number | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const currentYearData = useMemo(
        () => timeline.find((t) => t.year === currentYear),
        [timeline, currentYear]
    );

    const previousYearData = useMemo(
        () => (prevYear ? timeline.find((t) => t.year === prevYear) : undefined),
        [timeline, prevYear]
    );

    // 연도 변경 감지
    useEffect(() => {
        if (prevYear !== null && prevYear !== currentYear) {
            setIsTransitioning(true);
            const timeout = setTimeout(() => setIsTransitioning(false), ANIMATION_DURATION);
            return () => clearTimeout(timeout);
        }
        setPrevYear(currentYear);
    }, [currentYear, prevYear]);

    return useTimelineAnimation(currentYearData, previousYearData, isTransitioning);
}
