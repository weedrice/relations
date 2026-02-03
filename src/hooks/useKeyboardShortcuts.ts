/**
 * useKeyboardShortcuts - 키보드 단축키 훅
 * 
 * 에디터의 키보드 단축키를 처리합니다.
 */

import { useEffect, useCallback } from 'react';
import { useMapStore, useTemporalStore } from '../stores/useMapStore';

interface ShortcutConfig {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description: string;
}

export function useKeyboardShortcuts() {
    const {
        deleteNode,
        deleteEdge,
        selectedNodeIds,
        selectedEdgeIds,
        clearSelection,
        saveProject,
        newProject,
        setEditorMode,
        cancelConnecting,
        editorMode,
    } = useMapStore();

    const temporal = useTemporalStore();

    // 선택된 항목 삭제
    const handleDelete = useCallback(() => {
        selectedNodeIds.forEach((id) => deleteNode(id));
        selectedEdgeIds.forEach((id) => deleteEdge(id));
    }, [selectedNodeIds, selectedEdgeIds, deleteNode, deleteEdge]);

    // Undo
    const handleUndo = useCallback(() => {
        temporal.getState().undo();
    }, [temporal]);

    // Redo
    const handleRedo = useCallback(() => {
        temporal.getState().redo();
    }, [temporal]);

    // 새 프로젝트
    const handleNew = useCallback(() => {
        if (confirm('새 프로젝트를 생성하시겠습니까?')) {
            newProject();
        }
    }, [newProject]);

    // 저장
    const handleSave = useCallback(async () => {
        try {
            await saveProject();
        } catch (error) {
            console.error('Save failed:', error);
        }
    }, [saveProject]);

    // 연결 모드 토글
    const handleToggleConnectMode = useCallback(() => {
        if (editorMode === 'connect') {
            cancelConnecting();
        } else {
            setEditorMode('connect');
        }
    }, [editorMode, setEditorMode, cancelConnecting]);

    // ESC - 선택 해제 또는 모드 취소
    const handleEscape = useCallback(() => {
        if (editorMode === 'connect') {
            cancelConnecting();
        } else {
            clearSelection();
        }
    }, [editorMode, cancelConnecting, clearSelection]);

    // 단축키 목록
    const shortcuts: ShortcutConfig[] = [
        { key: 'Delete', action: handleDelete, description: '선택 항목 삭제' },
        { key: 'Backspace', action: handleDelete, description: '선택 항목 삭제' },
        { key: 'z', ctrl: true, action: handleUndo, description: '실행 취소' },
        { key: 'z', ctrl: true, shift: true, action: handleRedo, description: '다시 실행' },
        { key: 'y', ctrl: true, action: handleRedo, description: '다시 실행' },
        { key: 'n', ctrl: true, action: handleNew, description: '새 프로젝트' },
        { key: 's', ctrl: true, action: handleSave, description: '저장' },
        { key: 'e', action: handleToggleConnectMode, description: '연결 모드 토글' },
        { key: 'Escape', action: handleEscape, description: '선택 해제 / 모드 취소' },
    ];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 입력 필드에서는 단축키 비활성화
            if (e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                e.target instanceof HTMLSelectElement) {
                return;
            }

            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
                const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
                const altMatch = shortcut.alt ? e.altKey : !e.altKey;
                const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

                if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                    e.preventDefault();
                    shortcut.action();
                    return;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);

    return { shortcuts };
}

/**
 * 단축키 목록 표시용 데이터
 */
export const SHORTCUT_LIST = [
    { keys: 'Delete / Backspace', description: '선택 항목 삭제' },
    { keys: 'Ctrl + Z', description: '실행 취소 (Undo)' },
    { keys: 'Ctrl + Shift + Z / Ctrl + Y', description: '다시 실행 (Redo)' },
    { keys: 'Ctrl + N', description: '새 프로젝트' },
    { keys: 'Ctrl + S', description: '저장' },
    { keys: 'E', description: '연결 모드 토글' },
    { keys: 'Escape', description: '선택 해제 / 모드 취소' },
];
