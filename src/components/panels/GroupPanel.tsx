/**
 * GroupPanel - 그룹 관리 패널
 * 
 * 그룹 생성, 편집, 삭제 기능을 제공합니다.
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../stores/useMapStore';
import { useDraggable } from '../../hooks/useDraggable';
import { getNodesInGroup } from '../../utils/groupUtils';
import { PANEL_Z_BASE, PANEL_Z_FOCUSED } from '../../constants/panelZIndex';
import { GROUP_COLORS } from '../../constants/groupColors';
import GroupFormFields from './GroupFormFields';
import type { Group } from '../../stores/types';

const PANEL_ID = 'panel-group';

interface GroupPanelProps {
    isOpen: boolean;
    initialPosition: { x: number; y: number };
    onClose: (position?: { x: number; y: number }) => void;
}

export default function GroupPanel({ isOpen, initialPosition, onClose }: GroupPanelProps) {
    const { getCurrentYearData, updateGroup, deleteGroup, selectedNodeIds, updateNode, focusedPanelId, setFocusedPanel, editingGroupId, setEditingGroupId } = useMapStore();

    const [newGroupName, setNewGroupName] = useState('');
    const [selectedColor, setSelectedColor] = useState(GROUP_COLORS[0]);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);

    const yearData = getCurrentYearData();
    const groups = yearData?.groups || [];

    // 캔버스에서 그룹 더블클릭으로 열었을 때 해당 그룹 편집 상태로
    useEffect(() => {
        if (!isOpen || !editingGroupId) return;
        const yearData = getCurrentYearData();
        const group = yearData?.groups?.find((g) => g.id === editingGroupId);
        if (group) {
            setEditingGroup(group);
            setNewGroupName(group.name);
            setSelectedColor(group.color);
        }
        setEditingGroupId(null);
    }, [isOpen, editingGroupId, getCurrentYearData, setEditingGroupId]);

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

    const handleRemoveFromGroup = useCallback(() => {
        selectedNodeIds.forEach((nodeId) => {
            updateNode(nodeId, { groupId: undefined });
        });
    }, [selectedNodeIds, updateNode]);

    const { position, handleMouseDown } = useDraggable({ initialPosition });

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: 80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 80, opacity: 0 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 200 }}
                    className="fixed w-[330px] panel-base cursor-grab active:cursor-grabbing select-none overflow-hidden box-border"
                    style={{ left: position.x, top: position.y, zIndex: focusedPanelId === PANEL_ID ? PANEL_Z_FOCUSED : PANEL_Z_BASE, padding: '12px' }}
                    onMouseDown={() => setFocusedPanel(PANEL_ID)}
                >
                    <div
                        className="flex justify-between items-center border-b border-slate-700/60 bg-slate-800/40 rounded-t-xl shrink-0"
                        onMouseDown={handleMouseDown}
                    >
                        <h3 className="text-base font-bold text-white">그룹 관리</h3>
                        <button
                            onClick={() => onClose(position)}
                            className="rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors shrink-0"
                            aria-label="닫기"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-8" style={{ marginTop: '8px' }}>
                    {/* 그룹 편집 시에만 표시 */}
                    {editingGroup && (
                        <GroupFormFields
                            className="mb-6"
                            nameLabel="그룹 편집"
                            nameValue={newGroupName}
                            onNameChange={setNewGroupName}
                            namePlaceholder="그룹 이름"
                            color={selectedColor}
                            onColorChange={setSelectedColor}
                            onCancel={handleCancelEdit}
                            onConfirm={handleSaveEdit}
                            confirmLabel="저장"
                            nameInputClassName="input-base w-full text-sm mb-4"
                        />
                    )}

                    {selectedNodeIds.length > 0 && (
                        <div className="rounded-xl bg-slate-700/40 border border-slate-600/50">
                            <div className="text-xs font-medium text-slate-500 mb-5">
                                선택된 캐릭터: {selectedNodeIds.length}명
                            </div>
                            <button
                                onClick={handleRemoveFromGroup}
                                className="w-full bg-slate-600/80 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors mt-1"
                            >
                                그룹에서 제외
                            </button>
                        </div>
                    )}

                    <div className="min-w-0" style={{ marginTop: '10px', paddingLeft: '12px', paddingRight: '12px' }}>
                        <span className="text-xs font-medium text-slate-500 block" style={{ marginBottom: '5px' }}>그룹 목록</span>
                        <div className="space-y-3 max-h-60 overflow-y-auto overflow-x-hidden">
                        {groups.length === 0 ? (
                            <div className="text-sm text-slate-500 text-center py-4">
                                아직 그룹이 없습니다
                            </div>
                        ) : (
                            groups.map((group) => {
                                const memberCount = yearData
                                    ? getNodesInGroup(group, yearData.nodes).length
                                    : 0;

                                return (
                                    <div
                                        key={group.id}
                                        className="flex items-center justify-between rounded-xl bg-slate-700/40 border border-slate-600/40 gap-4"
                                    style={{ paddingLeft: '8px', paddingRight: '8px' }}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div
                                                className="w-4 h-4 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: group.color }}
                                            />
                                            <div className="truncate">
                                                <div className="text-white text-sm truncate">{group.name}</div>
                                                <div className="text-xs text-slate-400">{memberCount}명</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2.5 flex-shrink-0">
                                            {selectedNodeIds.length > 0 && (
                                                <button
                                                    onClick={() => handleMoveToGroup(group.id)}
                                                    className="text-slate-400 hover:text-green-400 hover:bg-slate-600 rounded transition-colors"
                                                    title="선택한 캐릭터를 이 그룹으로 이동"
                                                >
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M5 12l5 5L20 7" />
                                                    </svg>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleStartEdit(group)}
                                                className="text-slate-400 hover:text-blue-400 hover:bg-slate-600 rounded transition-colors"
                                                title="편집"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteGroup(group.id)}
                                                className="text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded transition-colors"
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
                    </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
