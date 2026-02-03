/**
 * 캐릭터 상태별 스타일
 */

import type { NodeStatus } from '../stores/types';

export interface StatusStyle {
    status: NodeStatus;
    label: string;
    opacity: number;
    grayscale: boolean;
    borderStyle: 'solid' | 'dashed' | 'dotted';
    borderWidth: number;
    borderColor?: string;
}

export const statusStyles: Record<NodeStatus, StatusStyle> = {
    alive: {
        status: 'alive',
        label: '생존',
        opacity: 1,
        grayscale: false,
        borderStyle: 'solid',
        borderWidth: 3,
    },
    dead: {
        status: 'dead',
        label: '사망',
        opacity: 0.8,
        grayscale: true,
        borderStyle: 'solid',
        borderWidth: 4,
        borderColor: '#1f2937', // gray-800
    },
    missing: {
        status: 'missing',
        label: '실종',
        opacity: 0.5,
        grayscale: false,
        borderStyle: 'dashed',
        borderWidth: 3,
        borderColor: '#6b7280', // gray-500
    },
};

/**
 * 상태에 따른 스타일 가져오기
 */
export function getStatusStyle(status: NodeStatus): StatusStyle {
    return statusStyles[status] || statusStyles.alive;
}

