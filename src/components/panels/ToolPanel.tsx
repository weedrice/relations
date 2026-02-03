/**
 * ToolPanel - 도구 패널 컴포넌트
 * 
 * 좌측 도구 모음을 제공합니다.
 */

import { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useMapStore, useTemporalStore } from '../../stores/useMapStore';
import { useAutoLayout } from '../../hooks/useAutoLayout';
import { PANEL_Z_BASE, PANEL_Z_FOCUSED } from '../../constants/panelZIndex';

const PANEL_ID = 'panel-tool';

// ========================
// Icons
// ========================
const icons = {
    pointer: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l7.5 18 2.25-6.75L19.5 12 3 3z" />
        </svg>
    ),
    addNode: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
        </svg>
    ),
    addEdge: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="5" cy="12" r="3" />
            <circle cx="19" cy="12" r="3" />
            <path d="M8 12h8" />
        </svg>
    ),
    undo: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 10h10a5 5 0 0 1 5 5v2" />
            <path d="M7 6L3 10l4 4" />
        </svg>
    ),
    redo: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10H11a5 5 0 0 0-5 5v2" />
            <path d="M17 6l4 4-4 4" />
        </svg>
    ),
    save: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <path d="M17 21v-8H7v8M7 3v5h8" />
        </svg>
    ),
    open: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    new: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6M12 18v-6M9 15h6" />
        </svg>
    ),
    zoomIn: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
        </svg>
    ),
    zoomOut: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35M8 11h6" />
        </svg>
    ),
    fitView: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" />
        </svg>
    ),
    autoLayout: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="8" y="14" width="8" height="7" rx="1" />
            <path d="M6.5 10v2M17.5 10v2M12 10v4" />
        </svg>
    ),
    addGroup: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
            <path d="M8 8h8M8 12h8M8 16h4" />
        </svg>
    ),
    exportPdf: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
            <path d="M14 2v6h6" />
            <path d="M9 15h6M9 11h6" />
        </svg>
    ),
    exportImage: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
        </svg>
    ),
    canvasBoundary: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="20" rx="1" strokeDasharray="3 2" />
        </svg>
    ),
};

// ========================
// Tool Button Component
// ========================
interface ToolButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
}

function ToolButton({ icon, label, onClick, disabled, active }: ToolButtonProps) {
    return (
        <motion.button
            whileHover={!disabled ? { scale: 1.05 } : undefined}
            whileTap={!disabled ? { scale: 0.95 } : undefined}
            onClick={onClick}
            disabled={disabled}
            className={`
        w-10 h-10 rounded-lg flex items-center justify-center
        transition-all duration-200
        ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600 hover:text-white'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
            title={label}
        >
            <span className="w-5 h-5 [&>svg]:w-full [&>svg]:h-full">{icon}</span>
        </motion.button>
    );
}

// ========================
// Divider Component
// ========================
function Divider() {
    return <div className="h-px bg-slate-600/70 my-2 mx-0" aria-hidden />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-2 first:mt-0 text-center">{children}</div>;
}

// ========================
// Component
// ========================
export default function ToolPanel() {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Store
    const {
        data,
        newProject,
        saveProject,
        loadProject,
        addNode,
        stagePosition,
        stageScale,
        setStageScale,
        setStagePosition,
        currentYear,
        editorMode,
        setEditorMode,
        cancelConnecting,
        updateSettings,
        focusedPanelId,
        setFocusedPanel,
    } = useMapStore();

    const handleToggleGroupMode = useCallback(() => {
        if (editorMode === 'group') {
            setEditorMode('select');
        } else {
            cancelConnecting();
            setEditorMode('group');
        }
    }, [editorMode, setEditorMode, cancelConnecting]);

    const temporal = useTemporalStore();

    // Auto Layout
    const { applyLayout } = useAutoLayout();

    // ========================
    // Handlers
    // ========================
    const handleNew = useCallback(() => {
        if (confirm('새 프로젝트를 생성하시겠습니까? 저장되지 않은 변경사항은 사라집니다.')) {
            newProject();
        }
    }, [newProject]);

    const handleSave = useCallback(async () => {
        try {
            await saveProject();
        } catch (error) {
            console.error('Save failed:', error);
            alert('저장에 실패했습니다.');
        }
    }, [saveProject]);

    const handleOpenClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            try {
                await loadProject(file);
            } catch (error) {
                console.error('Load failed:', error);
                alert('파일을 불러오는데 실패했습니다.');
            }

            // 파일 입력 초기화
            e.target.value = '';
        },
        [loadProject]
    );

    const handleAddNode = useCallback(() => {
        // 현재 보이는 뷰포트의 가운데(스테이지 좌표)에 생성
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;
        const stageX = (screenCenterX - stagePosition.x) / stageScale;
        const stageY = (screenCenterY - stagePosition.y) / stageScale;
        const id = addNode({
            x: stageX,
            y: stageY,
            status: 'alive',
            attributes: {
                name: `Character ${Math.floor(Math.random() * 1000)}`,
            },
        });
        console.log('Added node:', id);
    }, [addNode, currentYear, stagePosition, stageScale]);

    const handleToggleConnectMode = useCallback(() => {
        if (editorMode === 'connect') {
            cancelConnecting();
        } else {
            setEditorMode('connect');
        }
    }, [editorMode, setEditorMode, cancelConnecting]);

    const handleAutoLayout = useCallback(async () => {
        try {
            await applyLayout({ algorithm: 'layered', direction: 'RIGHT' });
        } catch (error) {
            console.error('Auto layout failed:', error);
            alert('자동 배치에 실패했습니다.');
        }
    }, [applyLayout]);

    const handleZoomIn = useCallback(() => {
        setStageScale(stageScale * 1.2);
    }, [stageScale, setStageScale]);

    const handleZoomOut = useCallback(() => {
        setStageScale(stageScale / 1.2);
    }, [stageScale, setStageScale]);

    const handleFitView = useCallback(() => {
        setStageScale(1);
        setStagePosition({ x: 0, y: 0 });
    }, [setStageScale, setStagePosition]);

    const handleToggleCanvasBoundary = useCallback(() => {
        updateSettings({
            showCanvasBoundary: !(data.globalSettings.showCanvasBoundary ?? true),
        });
    }, [data.globalSettings.showCanvasBoundary, updateSettings]);

    const handleUndo = useCallback(() => {
        temporal.getState().undo();
    }, [temporal]);

    const handleRedo = useCallback(() => {
        temporal.getState().redo();
    }, [temporal]);

    // ========================
    // Render
    // ========================
    return (
        <motion.div
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="absolute left-6 top-1/2 -translate-y-1/2 panel-base rounded-lg tool-panel-padding"
            style={{ zIndex: focusedPanelId === PANEL_ID ? PANEL_Z_FOCUSED : PANEL_Z_BASE }}
            onMouseDown={() => setFocusedPanel(PANEL_ID)}
        >
            <div className="flex flex-col gap-2">
                <SectionLabel>파일</SectionLabel>
                <ToolButton icon={icons.new} label="새 프로젝트" onClick={handleNew} />
                <ToolButton icon={icons.open} label="열기" onClick={handleOpenClick} />
                <ToolButton icon={icons.save} label="저장" onClick={handleSave} />

                <Divider />
                <SectionLabel>편집</SectionLabel>
                <ToolButton icon={icons.addNode} label="캐릭터 추가" onClick={handleAddNode} />
                <ToolButton
                    icon={icons.addEdge}
                    label="관계선 추가 (노드 2개 순서대로 클릭)"
                    onClick={handleToggleConnectMode}
                    active={editorMode === 'connect'}
                />
                <ToolButton
                    icon={icons.addGroup}
                    label="그룹 생성 (드래그하여 영역 지정)"
                    onClick={handleToggleGroupMode}
                    active={editorMode === 'group'}
                />
                <ToolButton icon={icons.autoLayout} label="자동 배치" onClick={handleAutoLayout} />

                <Divider />
                <SectionLabel>실행</SectionLabel>
                <ToolButton icon={icons.undo} label="실행 취소" onClick={handleUndo} />
                <ToolButton icon={icons.redo} label="다시 실행" onClick={handleRedo} />

                <Divider />
                <SectionLabel>뷰</SectionLabel>
                <ToolButton icon={icons.zoomIn} label="확대" onClick={handleZoomIn} />
                <ToolButton icon={icons.zoomOut} label="축소" onClick={handleZoomOut} />
                <ToolButton icon={icons.fitView} label="뷰 맞추기" onClick={handleFitView} />
                <ToolButton
                    icon={icons.canvasBoundary}
                    label="캔버스 경계 표시"
                    onClick={handleToggleCanvasBoundary}
                    active={data.globalSettings.showCanvasBoundary ?? true}
                />
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".relmap"
                onChange={handleFileChange}
                className="hidden"
            />
        </motion.div>
    );
}
