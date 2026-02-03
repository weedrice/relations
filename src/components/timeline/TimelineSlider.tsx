/**
 * TimelineSlider - 타임라인 슬라이더 컴포넌트
 * 
 * 연도별 데이터를 탐색할 수 있는 슬라이더를 제공합니다.
 */

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../stores/useMapStore';
import { PANEL_Z_BASE, PANEL_Z_FOCUSED } from '../../constants/panelZIndex';

const PANEL_ID = 'panel-timeline';

// ========================
// Component
// ========================
export default function TimelineSlider() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newYear, setNewYear] = useState('');

    // Store
    const { data, currentYear, setCurrentYear, addYear, removeYear, duplicateYear, focusedPanelId, setFocusedPanel } = useMapStore();
    const years = data.timeline.map((t) => t.year).sort((a, b) => a - b);

    // ========================
    // Handlers
    // ========================
    const handleYearChange = useCallback(
        (year: number) => {
            setCurrentYear(year);
        },
        [setCurrentYear]
    );

    const handleAddYear = useCallback(() => {
        const year = parseInt(newYear, 10);
        if (!isNaN(year) && !years.includes(year)) {
            addYear(year);
            setNewYear('');
        }
    }, [newYear, years, addYear]);

    const handleDuplicateYear = useCallback(() => {
        const year = parseInt(newYear, 10);
        if (!isNaN(year)) {
            duplicateYear(currentYear, year);
            setNewYear('');
        }
    }, [newYear, currentYear, duplicateYear]);

    const handleRemoveYear = useCallback(
        (year: number) => {
            if (years.length > 1 && confirm(`${year}년 데이터를 삭제하시겠습니까?`)) {
                removeYear(year);
            }
        },
        [years.length, removeYear]
    );

    // ========================
    // Render
    // ========================
    return (
        <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 22, stiffness: 200 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 panel-base overflow-hidden"
            style={{ zIndex: focusedPanelId === PANEL_ID ? PANEL_Z_FOCUSED : PANEL_Z_BASE }}
            onMouseDown={() => setFocusedPanel(PANEL_ID)}
        >
            <div className="flex items-center gap-5 panel-element-margin">
                <div className="flex items-center gap-4 flex-wrap panel-element-margin">
                    {years.map((year) => (
                        <motion.button
                            key={year}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleYearChange(year)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                handleRemoveYear(year);
                            }}
                            className={`
                                rounded-lg font-semibold text-sm transition-all duration-200
                                ${year === currentYear
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                                    : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'}
                            `}
                        >
                            {year}
                        </motion.button>
                    ))}
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-8 h-8 rounded-lg bg-slate-700/80 text-slate-400 hover:bg-slate-600 hover:text-white flex items-center justify-center transition-colors"
                    aria-label={isExpanded ? '패널 접기' : '패널 펼치기'}
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    >
                        <path d="M19 9l-7 7-7-7" />
                    </svg>
                </motion.button>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-700/60"
                    >
                        <div className="flex items-center gap-4 panel-element-margin">
                            <input
                                type="number"
                                value={newYear}
                                onChange={(e) => setNewYear(e.target.value)}
                                placeholder="연도 입력..."
                                className="input-base flex-1 text-sm"
                            />
                            <button
                                onClick={handleAddYear}
                                className="rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            >
                                추가
                            </button>
                            <button
                                onClick={handleDuplicateYear}
                                className="btn-primary rounded-lg text-sm"
                            >
                                복제
                            </button>
                        </div>
                        <div className="panel-element-margin">
                            <div className="text-xs text-slate-500 font-medium">
                                현재 <span className="text-white">{currentYear}</span>
                                {' · '}
                                노드 <span className="text-white">{data.timeline.find((t) => t.year === currentYear)?.nodes.length || 0}</span>
                                {' · '}
                                관계 <span className="text-white">{data.timeline.find((t) => t.year === currentYear)?.edges.length || 0}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
