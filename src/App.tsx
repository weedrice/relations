/**
 * App - 메인 애플리케이션 컴포넌트
 * 
 * 인물 관계도 에디터의 메인 레이아웃을 구성합니다.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import MainCanvas from './components/canvas/MainCanvas';
import { useDraggable } from './hooks/useDraggable';
import ToolPanel from './components/panels/ToolPanel';
import PropertyPanel from './components/panels/PropertyPanel';
import GroupPanel from './components/panels/GroupPanel';
import SearchPanel from './components/panels/SearchPanel';
import MiniMap from './components/panels/MiniMap';
import TimelineSlider from './components/timeline/TimelineSlider';
import { useMapStore } from './stores/useMapStore';
import { useKeyboardShortcuts, SHORTCUT_LIST } from './hooks/useKeyboardShortcuts';
import { usePdfExport, useImageExport } from './hooks/usePdfExport';
import { PANEL_Z_BASE, PANEL_Z_FOCUSED } from './constants/panelZIndex';

const PANEL_POSITIONS_KEY = 'relations-panel-positions';
const TOP_MARGIN = 72;

function getCenterTop(panelWidth: number) {
  if (typeof window === 'undefined') return { x: 400, y: TOP_MARGIN };
  return { x: Math.max(16, (window.innerWidth - panelWidth) / 2), y: TOP_MARGIN };
}

function loadPanelPositions(): { group?: { x: number; y: number }; search?: { x: number; y: number }; help?: { x: number; y: number } } {
  try {
    const raw = localStorage.getItem(PANEL_POSITIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

function savePanelPosition(panel: 'group' | 'search' | 'help', pos: { x: number; y: number }) {
  try {
    const prev = loadPanelPositions();
    const next = { ...prev, [panel]: pos };
    localStorage.setItem(PANEL_POSITIONS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

// ========================
// Component
// ========================
export default function App() {
  const { data, isLoading, error, editorMode, updateMeta, setEditingGroupId, setFocusedPanel } = useMapStore();
  const [isGroupPanelOpen, setIsGroupPanelOpen] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleEditValue, setTitleEditValue] = useState('');
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcuts();

  const startEditingTitle = useCallback(() => {
    setTitleEditValue(data.meta.projectTitle || '');
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.select(), 0);
  }, [data.meta.projectTitle]);

  const commitTitleEdit = useCallback(() => {
    const trimmed = titleEditValue.trim();
    if (trimmed) {
      updateMeta({ projectTitle: trimmed });
    }
    setIsEditingTitle(false);
  }, [titleEditValue, updateMeta]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitTitleEdit();
      }
      if (e.key === 'Escape') {
        setTitleEditValue(data.meta.projectTitle || '');
        setIsEditingTitle(false);
        titleInputRef.current?.blur();
      }
    },
    [commitTitleEdit, data.meta.projectTitle]
  );

  // Ctrl+G 그룹 패널 열기 / 캔버스에서 그룹 더블클릭 시 해당 그룹 편집으로 열기
  useEffect(() => {
    const onOpenGroupPanel = (e: Event) => {
      const detail = (e as CustomEvent<{ groupId?: string }>).detail;
      if (detail?.groupId) setEditingGroupId(detail.groupId);
      setIsGroupPanelOpen(true);
    };
    window.addEventListener('open-group-panel', onOpenGroupPanel);
    return () => window.removeEventListener('open-group-panel', onOpenGroupPanel);
  }, [setEditingGroupId]);

  // 외부 클릭 시 내보내기 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };

    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExportMenuOpen]);

  // 내보내기 훅
  const { exportToPdf } = usePdfExport();
  const { exportToImage } = useImageExport();

  // 내보내기 핸들러
  const handleExportPdf = useCallback(async () => {
    const stageRef = (window as unknown as { __stageRef: unknown }).__stageRef;
    if (!stageRef) {
      alert('캔버스가 준비되지 않았습니다.');
      return;
    }
    try {
      await exportToPdf(stageRef as Parameters<typeof exportToPdf>[0], {
        filename: data.meta.projectTitle || 'relationship-map',
      });
      setIsExportMenuOpen(false);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF 내보내기에 실패했습니다.');
    }
  }, [exportToPdf, data.meta.projectTitle]);

  const handleExportImage = useCallback(() => {
    const stageRef = (window as unknown as { __stageRef: unknown }).__stageRef;
    if (!stageRef) {
      alert('캔버스가 준비되지 않았습니다.');
      return;
    }
    try {
      exportToImage(stageRef as Parameters<typeof exportToImage>[0], data.meta.projectTitle || 'relationship-map');
      setIsExportMenuOpen(false);
    } catch (error) {
      console.error('Image export failed:', error);
      alert('이미지 내보내기에 실패했습니다.');
    }
  }, [exportToImage, data.meta.projectTitle]);

  return (
    <div className="w-screen h-screen bg-slate-900 overflow-hidden relative">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 h-14 panel-base border-b border-slate-700/50 flex items-center justify-between z-10 rounded-none header-padding">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
              <circle cx="12" cy="12" r="3" />
              <circle cx="5" cy="6" r="2" />
              <circle cx="19" cy="6" r="2" />
              <circle cx="5" cy="18" r="2" />
              <circle cx="19" cy="18" r="2" />
              <path d="M7 7l3 3M14 10l3-3M7 17l3-3M14 14l3 3" />
            </svg>
          </div>
          <div className="min-w-0">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={titleEditValue}
                onChange={(e) => setTitleEditValue(e.target.value)}
                onBlur={commitTitleEdit}
                onKeyDown={handleTitleKeyDown}
                className="text-base font-bold text-white tracking-tight bg-slate-700/60 border border-slate-600 rounded-md px-2 py-0.5 w-full max-w-[280px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="프로젝트 제목"
                autoFocus
              />
            ) : (
              <h1
                className="text-base font-bold text-white tracking-tight cursor-pointer hover:text-slate-200 truncate max-w-[280px]"
                onClick={startEditingTitle}
                title="클릭하여 제목 편집"
              >
                {data.meta.projectTitle || '제목 없음'}
              </h1>
            )}
            <p className="text-xs text-slate-500 font-medium">인물 관계도</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editorMode === 'connect' && (
            <div className="flex items-center gap-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-lg text-sm font-medium text-emerald-400" style={{ padding: '5px' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 007.07 0l4-4a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.07 0l-4 4a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
              연결 모드
            </div>
          )}
          {editorMode === 'group' && (
            <div className="flex items-center gap-2.5 bg-violet-500/15 border border-violet-500/40 rounded-lg text-sm font-medium text-violet-400" style={{ padding: '5px' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
              </svg>
              그룹 모드
            </div>
          )}

          <div className="w-px h-6 bg-slate-600/60" aria-hidden />

          <button
            onClick={() => setIsSearchPanelOpen(!isSearchPanelOpen)}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${isSearchPanelOpen ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/80'}`}
            title="검색 (Ctrl+F)"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
          <button
            onClick={() => setIsGroupPanelOpen(!isGroupPanelOpen)}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${isGroupPanelOpen ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/80'}`}
            title="그룹 관리"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="8" y="14" width="8" height="7" rx="1" />
            </svg>
          </button>
          <button
            onClick={() => {
              const next = !isHelpOpen;
              setIsHelpOpen(next);
              if (next) setFocusedPanel('modal-help');
            }}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${isHelpOpen ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/80'}`}
            title="단축키 도움말"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <circle cx="12" cy="17" r="0.5" fill="currentColor" />
            </svg>
          </button>

          <div className="relative flex items-center" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${isExportMenuOpen ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/80'}`}
              title="내보내기"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            {isExportMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 panel-base z-50">
                <button
                  onClick={handleExportPdf}
                  className="w-full text-left text-sm font-medium text-slate-200 hover:bg-slate-700/80 hover:text-white flex items-center gap-3 transition-colors rounded-none first:rounded-t-[11px]"
                >
                  <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  PDF 내보내기
                </button>
                <button
                  onClick={handleExportImage}
                  className="w-full text-left text-sm font-medium text-slate-200 hover:bg-slate-700/80 hover:text-white flex items-center gap-3 transition-colors rounded-none last:rounded-b-[11px]"
                >
                  <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  PNG 이미지 내보내기
                </button>
              </div>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center gap-2.5 text-sm font-medium text-blue-400 ml-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
              <span>저장 중...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2.5 text-sm font-medium text-red-400 ml-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="text-sm font-medium text-slate-500 tabular-nums min-w-[3rem] text-right">
            <ZoomIndicator />
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <div className="absolute inset-0 pt-14">
        <MainCanvas />
      </div>

      {/* Tool Panel (Left) */}
      <ToolPanel />

      {/* Property Panel (Right) */}
      <PropertyPanel />

      {/* Group Panel */}
      <GroupPanel
        isOpen={isGroupPanelOpen}
        initialPosition={loadPanelPositions().group ?? getCenterTop(320)}
        onClose={(position) => {
          if (position) savePanelPosition('group', position);
          setIsGroupPanelOpen(false);
        }}
      />

      {/* Search Panel */}
      <SearchPanel
        isOpen={isSearchPanelOpen}
        initialPosition={loadPanelPositions().search ?? getCenterTop(440)}
        onClose={(position) => {
          if (position) savePanelPosition('search', position);
          setIsSearchPanelOpen(false);
        }}
      />

      {/* Timeline Slider (Bottom) - 일단 숨김 */}
      <div style={{ display: 'none' }} aria-hidden>
        <TimelineSlider />
      </div>

      {/* Mini Map (Bottom Right) */}
      <MiniMap />

      {/* Keyboard Shortcuts Help Modal - 드래그 가능 */}
      {isHelpOpen && (
        <HelpModal
          initialPosition={loadPanelPositions().help ?? getCenterTop(420)}
          onClose={(position) => {
            if (position) savePanelPosition('help', position);
            setIsHelpOpen(false);
          }}
        />
      )}

    </div>
  );
}

// ========================
// Sub Components
// ========================

function ZoomIndicator() {
  const stageScale = useMapStore((state) => state.stageScale);
  return <span>{Math.round(stageScale * 100)}%</span>;
}

const HELP_MODAL_ID = 'modal-help';

function HelpModal({
  initialPosition,
  onClose,
}: {
  initialPosition: { x: number; y: number };
  onClose: (position?: { x: number; y: number }) => void;
}) {
  const { position, handleMouseDown } = useDraggable({ initialPosition });
  const focusedPanelId = useMapStore((s) => s.focusedPanelId);
  const setFocusedPanel = useMapStore((s) => s.setFocusedPanel);
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      style={{ zIndex: focusedPanelId === HELP_MODAL_ID ? PANEL_Z_FOCUSED : PANEL_Z_BASE }}
      onClick={() => onClose(position)}
    >
      <div
        className="fixed panel-base w-[420px] max-w-[90vw] cursor-grab active:cursor-grabbing select-none overflow-hidden"
        style={{ left: position.x, top: position.y }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={() => setFocusedPanel(HELP_MODAL_ID)}
      >
        <div
          className="flex items-center justify-between border-b border-slate-700/60 bg-slate-800/40 rounded-t-xl shrink-0"
          onMouseDown={handleMouseDown}
        >
          <div>
            <h3 className="text-lg font-bold text-white panel-element-margin-all">키보드 단축키</h3>
            <p className="text-sm text-slate-500 mt-3 panel-element-margin">에디터에서 사용할 수 있는 단축키입니다.</p>
          </div>
          <button
            type="button"
            onClick={() => onClose(position)}
            className="rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors shrink-0 panel-element-margin-all"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-0 divide-y divide-slate-700/80 panel-body panel-element-margin">
          {SHORTCUT_LIST.map((shortcut, index) => (
            <div key={index} className="flex justify-between items-center panel-element-margin">
              <span className="text-sm font-medium text-slate-300">{shortcut.description}</span>
              <kbd className="bg-slate-700/80 rounded-md text-xs font-semibold text-slate-300 font-mono border border-slate-600/50 shrink-0">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
        <div className="mt-8 panel-element-margin">
          <button
            onClick={() => onClose(position)}
            className="w-full input-base font-medium text-white hover:bg-slate-600 transition-colors rounded-lg"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
