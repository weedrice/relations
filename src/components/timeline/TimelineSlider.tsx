/**
 * TimelineSlider - 타임라인 슬라이더 컴포넌트
 * 
 * 연도별 데이터를 탐색할 수 있는 슬라이더를 제공합니다.
 */

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../stores/useMapStore';

// ========================
// Component
// ========================
export default function TimelineSlider() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newYear, setNewYear] = useState('');

    // Store
    const { data, currentYear, setCurrentYear, addYear, removeYear, duplicateYear } = useMapStore();
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
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden"
        >
            {/* Main Timeline Bar */}
            <div className="flex items-center gap-2 p-3">
                {/* Year Buttons */}
                <div className="flex items-center gap-1">
                    {years.map((year) => (
                        <motion.button
                            key={year}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleYearChange(year)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                handleRemoveYear(year);
                            }}
                            className={`
                px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200
                ${year === currentYear
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }
              `}
                        >
                            {year}
                        </motion.button>
                    ))}
                </div>

                {/* Expand Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center justify-center"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                        <path d="M19 9l-7 7-7-7" />
                    </svg>
                </motion.button>
            </div>

            {/* Expanded Panel */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-700"
                    >
                        <div className="p-3 flex items-center gap-2">
                            <input
                                type="number"
                                value={newYear}
                                onChange={(e) => setNewYear(e.target.value)}
                                placeholder="연도 입력..."
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={handleAddYear}
                                className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                추가
                            </button>
                            <button
                                onClick={handleDuplicateYear}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                복제
                            </button>
                        </div>

                        {/* Current Year Info */}
                        <div className="px-3 pb-3">
                            <div className="text-xs text-slate-400">
                                현재: <span className="text-white font-semibold">{currentYear}</span>
                                {' · '}
                                노드: <span className="text-white">{data.timeline.find((t) => t.year === currentYear)?.nodes.length || 0}</span>
                                {' · '}
                                관계: <span className="text-white">{data.timeline.find((t) => t.year === currentYear)?.edges.length || 0}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
