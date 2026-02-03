/**
 * GroupPanel - 그룹 관리 패널
 * 
 * 그룹 생성, 편집, 삭제 기능을 제공합니다.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../stores/useMapStore';
import type { Group } from '../../stores/types';

// 기본 그룹 색상 팔레트
const GROUP_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
];

interface GroupPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GroupPanel({ isOpen, onClose }: GroupPanelProps) {
    const { getCurrentYearData, addGroup, updateGroup, deleteGroup, selectedNodeIds, updateNode } = useMapStore();

    const [newGroupName, setNewGroupName] = useState('');
    const [selectedColor, setSelectedColor] = useState(GROUP_COLORS[0]);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);

    const yearData = getCurrentYearData();
    const groups = yearData?.groups || [];

    // 새 그룹 생성
    const handleCreateGroup = useCallback(() => {
        if (!newGroupName.trim()) return;

        const groupId = addGroup({
            name: newGroupName,
            color: selectedColor,
            x: window.innerWidth / 2 - 100,
            y: window.innerHeight / 2 - 50,
            width: 200,
            height: 150,
        });

        // 선택된 노드들을 그룹에 추가
        selectedNodeIds.forEach((nodeId) => {
            updateNode(nodeId, { groupId });
        });

        setNewGroupName('');
        setSelectedColor(GROUP_COLORS[0]);
    }, [newGroupName, selectedColor, addGroup, selectedNodeIds, updateNode]);

    // 그룹 삭제
    const handleDeleteGroup = useCallback((groupId: string) => {
        if (confirm('그룹을 삭제하시겠습니까? 그룹 내 캐릭터는 삭제되지 않습니다.')) {
            // 그룹에 속한 노드들의 groupId 제거
            yearData?.nodes
                .filter((node) => node.groupId === groupId)
                .forEach((node) => updateNode(node.id, { groupId: undefined }));

            deleteGroup(groupId);
        }
    }, [yearData, updateNode, deleteGroup]);

    // 그룹 편집 시작
    const handleStartEdit = useCallback((group: Group) => {
        setEditingGroup(group);
        setNewGroupName(group.name);
        setSelectedColor(group.color);
    }, []);

    // 그룹 편집 완료
    const handleSaveEdit = useCallback(() => {
        if (!editingGroup || !newGroupName.trim()) return;

        updateGroup(editingGroup.id, {
            name: newGroupName,
            color: selectedColor,
        });

        setEditingGroup(null);
        setNewGroupName('');
        setSelectedColor(GROUP_COLORS[0]);
    }, [editingGroup, newGroupName, selectedColor, updateGroup]);

    // 편집 취소
    const handleCancelEdit = useCallback(() => {
        setEditingGroup(null);
        setNewGroupName('');
        setSelectedColor(GROUP_COLORS[0]);
    }, []);

    // 선택된 노드들을 그룹에 이동
    const handleMoveToGroup = useCallback((groupId: string) => {
        selectedNodeIds.forEach((nodeId) => {
            updateNode(nodeId, { groupId });
        });
    }, [selectedNodeIds, updateNode]);

    // 선택된 노드들의 그룹 해제
    const handleRemoveFromGroup = useCallback(() => {
        selectedNodeIds.forEach((nodeId) => {
            updateNode(nodeId, { groupId: undefined });
        });
    }, [selectedNodeIds, updateNode]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    className="absolute right-4 top-4 w-72 bg-slate-800/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-slate-700/50"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">그룹 관리</h3>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* 새 그룹 생성 */}
                    <div className="mb-4">
                        <label className="text-sm text-slate-400 block mb-2">
                            {editingGroup ? '그룹 편집' : '새 그룹 생성'}
                        </label>
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="그룹 이름"
                            className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        {/* 색상 선택 */}
                        <div className="flex gap-2 mb-3 flex-wrap">
                            {GROUP_COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-6 h-6 rounded-full transition-transform ${selectedColor === color ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>

                        {editingGroup ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCancelEdit}
                                    className="flex-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
                                >
                                    저장
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleCreateGroup}
                                disabled={!newGroupName.trim()}
                                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                            >
                                그룹 생성
                            </button>
                        )}
                    </div>

                    {/* 선택된 노드 액션 */}
                    {selectedNodeIds.length > 0 && (
                        <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
                            <div className="text-sm text-slate-400 mb-2">
                                선택된 캐릭터: {selectedNodeIds.length}명
                            </div>
                            <button
                                onClick={handleRemoveFromGroup}
                                className="w-full px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-colors"
                            >
                                그룹에서 제외
                            </button>
                        </div>
                    )}

                    {/* 그룹 목록 */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {groups.length === 0 ? (
                            <div className="text-sm text-slate-500 text-center py-4">
                                아직 그룹이 없습니다
                            </div>
                        ) : (
                            groups.map((group) => {
                                const memberCount = yearData?.nodes.filter((n) => n.groupId === group.id).length || 0;

                                return (
                                    <div
                                        key={group.id}
                                        className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div
                                                className="w-4 h-4 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: group.color }}
                                            />
                                            <div className="truncate">
                                                <div className="text-white text-sm truncate">{group.name}</div>
                                                <div className="text-xs text-slate-400">{memberCount}명</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            {selectedNodeIds.length > 0 && (
                                                <button
                                                    onClick={() => handleMoveToGroup(group.id)}
                                                    className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-slate-600 rounded transition-colors"
                                                    title="선택한 캐릭터를 이 그룹으로 이동"
                                                >
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M5 12l5 5L20 7" />
                                                    </svg>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleStartEdit(group)}
                                                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-600 rounded transition-colors"
                                                title="편집"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteGroup(group.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded transition-colors"
                                                title="삭제"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
