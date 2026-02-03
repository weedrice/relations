/**
 * 관계 유형별 프리셋 스타일
 */

import type { RelationshipType } from '../stores/types';

export interface RelationshipPreset {
    type: RelationshipType;
    label: string;
    color: string;
    strokeWidth: number;
    dashArray?: number[];
}

export const relationshipPresets: Record<RelationshipType, RelationshipPreset> = {
    friendly: {
        type: 'friendly',
        label: '친함',
        color: '#22c55e', // green-500
        strokeWidth: 3,
    },
    distant: {
        type: 'distant',
        label: '소원',
        color: '#94a3b8', // slate-400
        strokeWidth: 2,
        dashArray: [10, 5],
    },
    hostile: {
        type: 'hostile',
        label: '적대',
        color: '#ef4444', // red-500
        strokeWidth: 3,
    },
    romantic: {
        type: 'romantic',
        label: '연인',
        color: '#ec4899', // pink-500
        strokeWidth: 3,
    },
    family: {
        type: 'family',
        label: '가족',
        color: '#f59e0b', // amber-500
        strokeWidth: 3,
    },
    business: {
        type: 'business',
        label: '업무',
        color: '#3b82f6', // blue-500
        strokeWidth: 2,
    },
    custom: {
        type: 'custom',
        label: '커스텀',
        color: '#8b5cf6', // violet-500
        strokeWidth: 2,
    },
};

/**
 * 관계 유형에 따른 스타일 가져오기
 */
export function getRelationshipStyle(type: RelationshipType): RelationshipPreset {
    return relationshipPresets[type] || relationshipPresets.custom;
}
