/**
 * App - 메인 애플리케이션 컴포넌트
 * 
 * 인물 관계도 에디터의 메인 레이아웃을 구성합니다.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import MainCanvas from './components/canvas/MainCanvas';
import ToolPanel from './components/panels/ToolPanel';
import PropertyPanel from './components/panels/PropertyPanel';
import GroupPanel from './components/panels/GroupPanel';
import SearchPanel from './components/panels/SearchPanel';
import MiniMap from './components/panels/MiniMap';
import TimelineSlider from './components/timeline/TimelineSlider';
import { useMapStore } from './stores/useMapStore';
import { useKeyboardShortcuts, SHORTCUT_LIST } from './hooks/useKeyboardShortcuts';
import { usePdfExport, useImageExport } from './hooks/usePdfExport';

// ========================
// Component
// ========================
export default function App() {
  const { data, isLoading, error, editorMode } = useMapStore();
  const [isGroupPanelOpen, setIsGroupPanelOpen] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // 키보드 단축키 활성화
  useKeyboardShortcuts();

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
      <header className="absolute top-0 left-0 right-0 h-14 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
              <circle cx="12" cy="12" r="3" />
              <circle cx="5" cy="6" r="2" />
              <circle cx="19" cy="6" r="2" />
              <circle cx="5" cy="18" r="2" />
              <circle cx="19" cy="18" r="2" />
              <path d="M7 7l3 3M14 10l3-3M7 17l3-3M14 14l3 3" />
            </svg>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              {data.meta.projectTitle}
            </h1>
            <p className="text-xs text-slate-400">Relationship Map Editor</p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {/* Editor Mode Indicator */}
          {editorMode === 'connect' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-600/20 border border-green-500/50 rounded-lg text-sm text-green-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 007.07 0l4-4a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.07 0l-4 4a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
              연결 모드
            </div>
          )}

          {/* Search Button */}
          <button
            onClick={() => setIsSearchPanelOpen(!isSearchPanelOpen)}
            className={`p-2 rounded-lg transition-colors ${isSearchPanelOpen ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            title="검색 (Ctrl+F)"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>

          {/* Group Button */}
          <button
            onClick={() => setIsGroupPanelOpen(!isGroupPanelOpen)}
            className={`p-2 rounded-lg transition-colors ${isGroupPanelOpen ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            title="그룹 관리"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="8" y="14" width="8" height="7" rx="1" />
            </svg>
          </button>

          {/* Help Button */}
          <button
            onClick={() => setIsHelpOpen(!isHelpOpen)}
            className={`p-2 rounded-lg transition-colors ${isHelpOpen ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            title="단축키 도움말"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <circle cx="12" cy="17" r="0.5" fill="currentColor" />
            </svg>
          </button>

          {/* Export Menu */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${isExportMenuOpen ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              title="내보내기"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-2 z-50">
                <button
                  onClick={handleExportPdf}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  PDF 내보내기
                </button>
                <button
                  onClick={handleExportImage}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  PNG 이미지 내보내기
                </button>
              </div>
            )}
          </div>

          {/* Status */}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
              <span>저장 중...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Zoom Indicator */}
          <div className="text-sm text-slate-400">
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

      {/* Group Panel (Right) */}
      <GroupPanel isOpen={isGroupPanelOpen} onClose={() => setIsGroupPanelOpen(false)} />

      {/* Search Panel (Top Center) */}
      <SearchPanel isOpen={isSearchPanelOpen} onClose={() => setIsSearchPanelOpen(false)} />

      {/* Timeline Slider (Bottom) */}
      <TimelineSlider />

      {/* Mini Map (Bottom Right) */}
      <MiniMap />

      {/* Keyboard Shortcuts Help Modal */}
      {isHelpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setIsHelpOpen(false)}
        >
          <div
            className="bg-slate-800 rounded-xl p-6 w-96 max-w-[90vw] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">⌨️ 키보드 단축키</h3>
            <div className="space-y-2">
              {SHORTCUT_LIST.map((shortcut, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                  <span className="text-slate-300">{shortcut.description}</span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-sm text-slate-400 font-mono">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsHelpOpen(false)}
              className="mt-4 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Quick Shortcuts Hint */}
      <div className="absolute bottom-4 left-4 text-xs text-slate-500 space-y-0.5">
        <div><kbd className="px-1 py-0.5 bg-slate-700 rounded text-slate-400">Scroll</kbd> 줌</div>
        <div><kbd className="px-1 py-0.5 bg-slate-700 rounded text-slate-400">Drag</kbd> 팬</div>
        <div><kbd className="px-1 py-0.5 bg-slate-700 rounded text-slate-400">E</kbd> 연결 모드</div>
        <div><kbd className="px-1 py-0.5 bg-slate-700 rounded text-slate-400">?</kbd> 도움말</div>
      </div>
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
