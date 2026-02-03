/**
 * SearchPanel - 검색/필터 패널
 * 
 * 노드와 관계를 검색하고 필터링합니다.
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../stores/useMapStore';
import { useDraggable } from '../../hooks/useDraggable';
import { PANEL_Z_BASE, PANEL_Z_FOCUSED } from '../../constants/panelZIndex';
import type { NodeStatus, RelationshipType } from '../../stores/types';

const PANEL_ID = 'panel-search';

interface SearchPanelProps {
    isOpen: boolean;
    initialPosition: { x: number; y: number };
    onClose: (position?: { x: number; y: number }) => void;
}

export default function SearchPanel({ isOpen, initialPosition, onClose }: SearchPanelProps) {
    const { getCurrentYearData, selectNode, setStagePosition, setStageScale, focusedPanelId, setFocusedPanel } = useMapStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<NodeStatus | 'all'>('all');
    const [relationshipFilter, setRelationshipFilter] = useState<RelationshipType | 'all'>('all');

    const yearData = getCurrentYearData();
    const nodes = yearData?.nodes || [];
    const edges = yearData?.edges || [];

    // 필터링된 노드
    const filteredNodes = useMemo(() => {
        return nodes.filter((node) => {
            // 이름 검색
            if (searchQuery && !node.attributes.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            // 상태 필터
            if (statusFilter !== 'all' && node.status !== statusFilter) {
                return false;
            }
            return true;
        });
    }, [nodes, searchQuery, statusFilter]);

    // 필터링된 관계
    const filteredEdges = useMemo(() => {
        return edges.filter((edge) => {
            // 관계 타입 필터
            if (relationshipFilter !== 'all' && edge.type !== relationshipFilter) {
                return false;
            }
            // 라벨 검색
            if (searchQuery && !edge.label?.toLowerCase().includes(searchQuery.toLowerCase())) {
                // 연결된 노드 이름으로도 검색
                const sourceNode = nodes.find((n) => n.id === edge.sourceId);
                const targetNode = nodes.find((n) => n.id === edge.targetId);
                const sourceName = sourceNode?.attributes.name?.toLowerCase() || '';
                const targetName = targetNode?.attributes.name?.toLowerCase() || '';

                if (!sourceName.includes(searchQuery.toLowerCase()) &&
                    !targetName.includes(searchQuery.toLowerCase())) {
                    return false;
                }
            }
            return true;
        });
    }, [edges, nodes, searchQuery, relationshipFilter]);

    // 노드 선택 및 뷰 이동
    const handleSelectNode = useCallback((nodeId: string, x: number, y: number) => {
        selectNode(nodeId, false);
        // 노드 위치로 뷰 이동
        setStagePosition({
            x: window.innerWidth / 2 - x,
            y: window.innerHeight / 2 - y,
        });
        setStageScale(1);
    }, [selectNode, setStagePosition, setStageScale]);

    // 관계 타입 레이블
    const relationshipLabels: Record<RelationshipType, string> = {
        friendly: '친함',
        distant: '소원',
        hostile: '적대',
        romantic: '연인',
        family: '가족',
        business: '업무',
        custom: '커스텀',
    };

    // 상태 레이블
    const statusLabels: Record<NodeStatus, string> = {
        alive: '생존',
        dead: '사망',
        missing: '실종',
    };

    const { position, handleMouseDown } = useDraggable({ initialPosition });

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: 80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 80, opacity: 0 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 200 }}
                    className="fixed w-[440px] max-w-[90vw] panel-base cursor-grab active:cursor-grabbing select-none overflow-hidden"
                    style={{ left: position.x, top: position.y, zIndex: focusedPanelId === PANEL_ID ? PANEL_Z_FOCUSED : PANEL_Z_BASE }}
                    onMouseDown={() => setFocusedPanel(PANEL_ID)}
                >
                    <div
                        className="flex justify-between items-center border-b border-slate-700/60 bg-slate-800/40 rounded-t-xl shrink-0"
                        onMouseDown={handleMouseDown}
                    >
                        <h3 className="text-base font-bold text-white panel-element-margin-all">검색 / 필터</h3>
                        <button
                            onClick={() => onClose(position)}
                            className="rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors shrink-0 panel-element-margin-all"
                            aria-label="닫기"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-14 overflow-hidden panel-body">
                    <div className="relative panel-element-margin">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="이름 또는 라벨 검색..."
                            className="input-base w-full pr-12 text-sm"
                        />
                        <svg
                            className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                        </div>

                    <div className="flex gap-8 flex-nowrap panel-element-margin">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as NodeStatus | 'all')}
                            className="input-base flex-1 min-w-0 text-sm"
                        >
                            <option value="all">모든 상태</option>
                            {Object.entries(statusLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <select
                            value={relationshipFilter}
                            onChange={(e) => setRelationshipFilter(e.target.value as RelationshipType | 'all')}
                            className="input-base flex-1 min-w-0 text-sm"
                        >
                            <option value="all">모든 관계</option>
                            {Object.entries(relationshipLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="text-xs font-medium text-slate-500 panel-element-margin">
                        캐릭터 {filteredNodes.length}명 · 관계 {filteredEdges.length}개
                    </div>

                    <div className="max-h-60 overflow-y-auto overflow-x-hidden space-y-5 panel-element-margin mt-6 min-w-0">
                        {filteredNodes.length === 0 && filteredEdges.length === 0 ? (
                            <div className="text-sm text-slate-500 text-center panel-element-margin">
                                검색 결과가 없습니다
                            </div>
                        ) : (
                            <>
                                {filteredNodes.map((node) => (
                                    <button
                                        key={node.id}
                                        onClick={() => handleSelectNode(node.id, node.x, node.y)}
                                        className="w-full flex items-center gap-4 rounded-xl bg-slate-700/40 hover:bg-slate-600/50 border border-transparent hover:border-slate-600/50 transition-all text-left panel-element-margin"
                                    >
                                        {node.img ? (
                                            <img
                                                src={node.img}
                                                alt={node.attributes.name}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm font-bold text-slate-400">
                                                {node.attributes.name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white text-sm truncate">{node.attributes.name}</div>
                                            <div className="text-xs text-slate-400">{statusLabels[node.status]}</div>
                                        </div>
                                    </button>
                                ))}

                                {/* 관계 결과 */}
                                {filteredEdges.map((edge) => {
                                    const sourceNode = nodes.find((n) => n.id === edge.sourceId);
                                    const targetNode = nodes.find((n) => n.id === edge.targetId);

                                    return (
                                        <div
                                            key={edge.id}
                                            className="flex items-center gap-4 rounded-xl bg-slate-700/30 border border-slate-600/30 panel-element-margin"
                                        >
                                            <span className="text-white text-sm truncate">
                                                {sourceNode?.attributes.name}
                                            </span>
                                            <span className="text-slate-400 text-xs bg-slate-600 rounded">
                                                {edge.label || relationshipLabels[edge.type]}
                                            </span>
                                            <span className="text-white text-sm truncate">
                                                {targetNode?.attributes.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
