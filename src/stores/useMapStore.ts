/**
 * useMapStore - Zustand 전역 상태 관리
 * 
 * 인물 관계도 에디터의 모든 상태를 관리합니다.
 * Zundo를 사용하여 Undo/Redo 기능을 지원합니다.
 */

import { create } from 'zustand';
import { temporal } from 'zundo';
import { nanoid } from './nanoid';
import type {
    MapState,
    MapActions,
    CharacterNode,
    RelationshipEdge,
    Group,
    TimelineYear,
    GlobalSettings,
    MapMeta,
    EditorMode,
} from './types';
import { saveToFile, loadFromFile, createDefaultMapData } from '../utils/DataManager';

// ========================
// Initial State
// ========================
const initialState: MapState = {
    data: createDefaultMapData(),
    currentYear: new Date().getFullYear(),
    selectedNodeIds: [],
    selectedEdgeIds: [],
    editorMode: 'select',
    connectingFromNodeId: null,
    stagePosition: { x: 0, y: 0 },
    stageScale: 1,
    isLoading: false,
    error: null,
};

// ========================
// Store Type
// ========================
type MapStore = MapState & MapActions;

// ========================
// Store Implementation
// ========================
export const useMapStore = create<MapStore>()(
    temporal(
        (set, get) => ({
            // Initial State
            ...initialState,

            // ========================
            // Project Actions
            // ========================
            newProject: (title = 'Untitled Project') => {
                set({
                    data: createDefaultMapData(title),
                    currentYear: new Date().getFullYear(),
                    selectedNodeIds: [],
                    selectedEdgeIds: [],
                    stagePosition: { x: 0, y: 0 },
                    stageScale: 1,
                    error: null,
                });
            },

            saveProject: async () => {
                const { data } = get();
                try {
                    set({ isLoading: true, error: null });
                    await saveToFile(data);
                    set({ isLoading: false });
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Failed to save project';
                    set({ isLoading: false, error: message });
                    throw error;
                }
            },

            loadProject: async (file: File) => {
                try {
                    set({ isLoading: true, error: null });
                    const loadedData = await loadFromFile(file);

                    // 첫 번째 연도로 설정
                    const firstYear = loadedData.timeline[0]?.year || new Date().getFullYear();

                    set({
                        data: loadedData,
                        currentYear: firstYear,
                        selectedNodeIds: [],
                        selectedEdgeIds: [],
                        stagePosition: { x: 0, y: 0 },
                        stageScale: 1,
                        isLoading: false,
                    });
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Failed to load project';
                    set({ isLoading: false, error: message });
                    throw error;
                }
            },

            // ========================
            // Settings Actions
            // ========================
            updateSettings: (settings: Partial<GlobalSettings>) => {
                set((state) => ({
                    data: {
                        ...state.data,
                        globalSettings: { ...state.data.globalSettings, ...settings },
                    },
                }));
            },

            updateMeta: (meta: Partial<MapMeta>) => {
                set((state) => ({
                    data: {
                        ...state.data,
                        meta: { ...state.data.meta, ...meta },
                    },
                }));
            },

            // ========================
            // Timeline Actions
            // ========================
            setCurrentYear: (year: number) => {
                set({ currentYear: year, selectedNodeIds: [], selectedEdgeIds: [] });
            },

            addYear: (year: number) => {
                set((state) => {
                    // 이미 존재하는 연도인지 확인
                    if (state.data.timeline.some((t) => t.year === year)) {
                        return state;
                    }

                    const newYear: TimelineYear = {
                        year,
                        nodes: [],
                        edges: [],
                        groups: [],
                    };

                    const timeline = [...state.data.timeline, newYear].sort((a, b) => a.year - b.year);

                    return {
                        data: { ...state.data, timeline },
                        currentYear: year,
                    };
                });
            },

            removeYear: (year: number) => {
                set((state) => {
                    const timeline = state.data.timeline.filter((t) => t.year !== year);

                    if (timeline.length === 0) {
                        // 최소 1개의 연도는 유지
                        return state;
                    }

                    const currentYear = state.currentYear === year
                        ? timeline[0].year
                        : state.currentYear;

                    return {
                        data: { ...state.data, timeline },
                        currentYear,
                    };
                });
            },

            duplicateYear: (sourceYear: number, targetYear: number) => {
                set((state) => {
                    const source = state.data.timeline.find((t) => t.year === sourceYear);
                    if (!source) return state;

                    // 이미 존재하는 연도면 덮어쓰기
                    const existingIndex = state.data.timeline.findIndex((t) => t.year === targetYear);

                    const newYear: TimelineYear = {
                        ...JSON.parse(JSON.stringify(source)), // Deep clone
                        year: targetYear,
                    };

                    let timeline: TimelineYear[];
                    if (existingIndex >= 0) {
                        timeline = [...state.data.timeline];
                        timeline[existingIndex] = newYear;
                    } else {
                        timeline = [...state.data.timeline, newYear].sort((a, b) => a.year - b.year);
                    }

                    return {
                        data: { ...state.data, timeline },
                        currentYear: targetYear,
                    };
                });
            },

            // ========================
            // Node Actions
            // ========================
            addNode: (node: Omit<CharacterNode, 'id'>) => {
                const id = nanoid();

                set((state) => {
                    const timeline = state.data.timeline.map((t) => {
                        if (t.year !== state.currentYear) return t;
                        return {
                            ...t,
                            nodes: [...t.nodes, { ...node, id }],
                        };
                    });

                    return { data: { ...state.data, timeline } };
                });

                return id;
            },

            updateNode: (id: string, updates: Partial<CharacterNode>) => {
                set((state) => {
                    const timeline = state.data.timeline.map((t) => {
                        if (t.year !== state.currentYear) return t;
                        return {
                            ...t,
                            nodes: t.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
                        };
                    });

                    return { data: { ...state.data, timeline } };
                });
            },

            deleteNode: (id: string) => {
                set((state) => {
                    const timeline = state.data.timeline.map((t) => {
                        if (t.year !== state.currentYear) return t;
                        return {
                            ...t,
                            nodes: t.nodes.filter((n) => n.id !== id),
                            // 연결된 엣지도 삭제
                            edges: t.edges.filter((e) => e.sourceId !== id && e.targetId !== id),
                        };
                    });

                    return {
                        data: { ...state.data, timeline },
                        selectedNodeIds: state.selectedNodeIds.filter((nid) => nid !== id),
                    };
                });
            },

            // ========================
            // Edge Actions
            // ========================
            addEdge: (edge: Omit<RelationshipEdge, 'id'>) => {
                const id = nanoid();

                set((state) => {
                    const timeline = state.data.timeline.map((t) => {
                        if (t.year !== state.currentYear) return t;
                        return {
                            ...t,
                            edges: [...t.edges, { ...edge, id }],
                        };
                    });

                    return { data: { ...state.data, timeline } };
                });

                return id;
            },

            updateEdge: (id: string, updates: Partial<RelationshipEdge>) => {
                set((state) => {
                    const timeline = state.data.timeline.map((t) => {
                        if (t.year !== state.currentYear) return t;
                        return {
                            ...t,
                            edges: t.edges.map((e) => (e.id === id ? { ...e, ...updates } : e)),
                        };
                    });

                    return { data: { ...state.data, timeline } };
                });
            },

            deleteEdge: (id: string) => {
                set((state) => {
                    const timeline = state.data.timeline.map((t) => {
                        if (t.year !== state.currentYear) return t;
                        return {
                            ...t,
                            edges: t.edges.filter((e) => e.id !== id),
                        };
                    });

                    return {
                        data: { ...state.data, timeline },
                        selectedEdgeIds: state.selectedEdgeIds.filter((eid) => eid !== id),
                    };
                });
            },

            // ========================
            // Group Actions
            // ========================
            addGroup: (group: Omit<Group, 'id'>) => {
                const id = nanoid();

                set((state) => {
                    const timeline = state.data.timeline.map((t) => {
                        if (t.year !== state.currentYear) return t;
                        return {
                            ...t,
                            groups: [...t.groups, { ...group, id }],
                        };
                    });

                    return { data: { ...state.data, timeline } };
                });

                return id;
            },

            updateGroup: (id: string, updates: Partial<Group>) => {
                set((state) => {
                    const timeline = state.data.timeline.map((t) => {
                        if (t.year !== state.currentYear) return t;
                        return {
                            ...t,
                            groups: t.groups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
                        };
                    });

                    return { data: { ...state.data, timeline } };
                });
            },

            deleteGroup: (id: string) => {
                set((state) => {
                    const timeline = state.data.timeline.map((t) => {
                        if (t.year !== state.currentYear) return t;
                        return {
                            ...t,
                            groups: t.groups.filter((g) => g.id !== id),
                            // 그룹에 속한 노드의 groupId 제거
                            nodes: t.nodes.map((n) => (n.groupId === id ? { ...n, groupId: undefined } : n)),
                        };
                    });

                    return { data: { ...state.data, timeline } };
                });
            },

            // ========================
            // Selection Actions
            // ========================
            selectNode: (id: string, multi = false) => {
                set((state) => ({
                    selectedNodeIds: multi
                        ? state.selectedNodeIds.includes(id)
                            ? state.selectedNodeIds.filter((nid) => nid !== id)
                            : [...state.selectedNodeIds, id]
                        : [id],
                    selectedEdgeIds: multi ? state.selectedEdgeIds : [],
                }));
            },

            selectEdge: (id: string, multi = false) => {
                set((state) => ({
                    selectedEdgeIds: multi
                        ? state.selectedEdgeIds.includes(id)
                            ? state.selectedEdgeIds.filter((eid) => eid !== id)
                            : [...state.selectedEdgeIds, id]
                        : [id],
                    selectedNodeIds: multi ? state.selectedNodeIds : [],
                }));
            },

            clearSelection: () => {
                set({ selectedNodeIds: [], selectedEdgeIds: [] });
            },

            // ========================
            // Editor Mode Actions
            // ========================
            setEditorMode: (mode: EditorMode) => {
                set({ editorMode: mode, connectingFromNodeId: null });
            },

            startConnecting: (nodeId: string) => {
                set({ editorMode: 'connect', connectingFromNodeId: nodeId });
            },

            cancelConnecting: () => {
                set({ editorMode: 'select', connectingFromNodeId: null });
            },

            completeConnecting: (targetNodeId: string) => {
                const { connectingFromNodeId, addEdge } = get();
                if (!connectingFromNodeId || connectingFromNodeId === targetNodeId) {
                    set({ editorMode: 'select', connectingFromNodeId: null });
                    return;
                }

                // 새 관계선 추가
                addEdge({
                    sourceId: connectingFromNodeId,
                    targetId: targetNodeId,
                    type: 'friendly',
                    bidirectional: false,
                });

                set({ editorMode: 'select', connectingFromNodeId: null });
            },

            // ========================
            // Viewport Actions
            // ========================
            setStagePosition: (position: { x: number; y: number }) => {
                set({ stagePosition: position });
            },

            setStageScale: (scale: number) => {
                // 스케일 범위 제한 (0.1 ~ 3.0)
                const clampedScale = Math.max(0.1, Math.min(3.0, scale));
                set({ stageScale: clampedScale });
            },

            // ========================
            // Utility Actions
            // ========================
            getCurrentYearData: () => {
                const { data, currentYear } = get();
                return data.timeline.find((t) => t.year === currentYear);
            },
        }),
        {
            // Zundo 설정 - Undo/Redo 대상 상태 지정
            partialize: (state) => ({
                data: state.data,
                currentYear: state.currentYear,
            }),
            // 히스토리 제한
            limit: 50,
        }
    )
);

// ========================
// Undo/Redo Hooks
// ========================
export const useTemporalStore = () => useMapStore.temporal;
