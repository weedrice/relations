/**
 * useAutoLayout - ELKjs 자동 배치 훅
 * 
 * 노드들을 자동으로 배치합니다.
 */

import { useCallback } from 'react';
import ELK from 'elkjs/lib/elk.bundled.js';
import type { CharacterNode, RelationshipEdge } from '../stores/types';
import { useMapStore } from '../stores/useMapStore';

// ELK 인스턴스
const elk = new ELK();

// 레이아웃 옵션
export type LayoutDirection = 'RIGHT' | 'DOWN' | 'LEFT' | 'UP';
export type LayoutAlgorithm = 'layered' | 'force' | 'stress' | 'radial';

interface LayoutOptions {
    direction?: LayoutDirection;
    algorithm?: LayoutAlgorithm;
    nodeSpacing?: number;
    layerSpacing?: number;
}

const defaultOptions: LayoutOptions = {
    direction: 'RIGHT',
    algorithm: 'layered',
    nodeSpacing: 50,
    layerSpacing: 150,
};

/**
 * ELK 그래프 형식으로 변환
 */
function toElkGraph(nodes: CharacterNode[], edges: RelationshipEdge[]) {
    return {
        id: 'root',
        layoutOptions: {},
        children: nodes.map((node) => ({
            id: node.id,
            width: 100,
            height: 100,
        })),
        edges: edges.map((edge) => ({
            id: edge.id,
            sources: [edge.sourceId],
            targets: [edge.targetId],
        })),
    };
}

/**
 * 자동 배치 훅
 */
export function useAutoLayout() {
    const { getCurrentYearData, updateNode } = useMapStore();

    const applyLayout = useCallback(
        async (options: LayoutOptions = {}) => {
            const yearData = getCurrentYearData();
            if (!yearData || yearData.nodes.length === 0) return;

            const { nodes, edges } = yearData;
            const opts = { ...defaultOptions, ...options };

            // ELK 그래프 생성
            const elkGraph = toElkGraph(nodes, edges);

            // 레이아웃 옵션 설정
            elkGraph.layoutOptions = {
                'elk.algorithm': opts.algorithm === 'layered' ? 'layered' :
                    opts.algorithm === 'force' ? 'force' :
                        opts.algorithm === 'stress' ? 'stress' : 'radial',
                'elk.direction': opts.direction,
                'elk.spacing.nodeNode': String(opts.nodeSpacing),
                'elk.layered.spacing.nodeNodeBetweenLayers': String(opts.layerSpacing),
                'elk.force.temperature': '0.001',
                'elk.stress.epsilon': '10e-4',
            };

            try {
                // 레이아웃 계산
                const layoutedGraph = await elk.layout(elkGraph);

                // 캔버스 중앙으로 오프셋 계산
                const offsetX = window.innerWidth / 2 - 200;
                const offsetY = window.innerHeight / 2 - 100;

                // 노드 위치 업데이트
                layoutedGraph.children?.forEach((elkNode) => {
                    if (elkNode.x !== undefined && elkNode.y !== undefined) {
                        updateNode(elkNode.id, {
                            x: elkNode.x + offsetX,
                            y: elkNode.y + offsetY,
                        });
                    }
                });
            } catch (error) {
                console.error('Auto layout failed:', error);
                throw error;
            }
        },
        [getCurrentYearData, updateNode]
    );

    return { applyLayout };
}
