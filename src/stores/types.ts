/**
 * 인물 관계도 에디터 - 타입 정의
 */

// ========================
// Schema Version
// ========================
export const CURRENT_SCHEMA_VERSION = '1.0.0';

// ========================
// Meta & Settings
// ========================
export interface MapMeta {
    schemaVersion: string;
    createdAt: number;
    updatedAt: number;
    projectTitle: string;
}

export interface GlobalSettings {
    theme: 'light' | 'dark';
    showGrid: boolean;
    gridSize: number;
    snapToGrid: boolean;
}

// ========================
// Character Node
// ========================
export type NodeStatus = 'alive' | 'dead' | 'missing';

export interface CharacterAttributes {
    name: string;
    age?: number;
    job?: string;
    description?: string;
    [key: string]: string | number | boolean | undefined;
}

export interface CharacterNode {
    id: string;
    x: number;
    y: number;
    status: NodeStatus;
    img?: string; // WebP Base64
    borderColor?: string;
    attributes: CharacterAttributes;
    groupId?: string; // 소속 그룹 ID
}

// ========================
// Relationship Edge
// ========================
export type RelationshipType =
    | 'friendly'   // 친함
    | 'distant'    // 소원
    | 'hostile'    // 적대
    | 'romantic'   // 연인
    | 'family'     // 가족
    | 'business'   // 업무
    | 'custom';    // 커스텀

export interface RelationshipEdge {
    id: string;
    sourceId: string;
    targetId: string;
    type: RelationshipType;
    label?: string;
    bidirectional: boolean; // 양방향 화살표
    color?: string;
    strokeWidth?: number;
    customStyle?: {
        dashArray?: number[];
        opacity?: number;
    };
}

// ========================
// Group
// ========================
export interface Group {
    id: string;
    name: string;
    color: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

// ========================
// Timeline
// ========================
export interface TimelineYear {
    year: number;
    label?: string; // 연도 라벨 (예: "Chapter 1")
    nodes: CharacterNode[];
    edges: RelationshipEdge[];
    groups: Group[];
}

// ========================
// Main Data Structure
// ========================
export interface MapData {
    meta: MapMeta;
    globalSettings: GlobalSettings;
    timeline: TimelineYear[];
}

// ========================
// Store State & Actions
// ========================
export type EditorMode = 'select' | 'connect' | 'group';

export interface MapState {
    // Data
    data: MapData;

    // UI State
    currentYear: number;
    selectedNodeIds: string[];
    selectedEdgeIds: string[];
    editorMode: EditorMode;
    connectingFromNodeId: string | null; // 연결 모드에서 시작 노드 ID

    // Viewport
    stagePosition: { x: number; y: number };
    stageScale: number;

    // Loading State
    isLoading: boolean;
    error: string | null;
}

export interface MapActions {
    // Project
    newProject: (title?: string) => void;
    saveProject: () => Promise<void>;
    loadProject: (file: File) => Promise<void>;

    // Settings
    updateSettings: (settings: Partial<GlobalSettings>) => void;
    updateMeta: (meta: Partial<MapMeta>) => void;

    // Timeline
    setCurrentYear: (year: number) => void;
    addYear: (year: number) => void;
    removeYear: (year: number) => void;
    duplicateYear: (sourceYear: number, targetYear: number) => void;

    // Nodes
    addNode: (node: Omit<CharacterNode, 'id'>) => string;
    updateNode: (id: string, updates: Partial<CharacterNode>) => void;
    deleteNode: (id: string) => void;

    // Edges
    addEdge: (edge: Omit<RelationshipEdge, 'id'>) => string;
    updateEdge: (id: string, updates: Partial<RelationshipEdge>) => void;
    deleteEdge: (id: string) => void;

    // Groups
    addGroup: (group: Omit<Group, 'id'>) => string;
    updateGroup: (id: string, updates: Partial<Group>) => void;
    deleteGroup: (id: string) => void;

    // Selection
    selectNode: (id: string, multi?: boolean) => void;
    selectEdge: (id: string, multi?: boolean) => void;
    clearSelection: () => void;

    // Editor Mode
    setEditorMode: (mode: EditorMode) => void;
    startConnecting: (nodeId: string) => void;
    cancelConnecting: () => void;
    completeConnecting: (targetNodeId: string) => void;

    // Viewport
    setStagePosition: (position: { x: number; y: number }) => void;
    setStageScale: (scale: number) => void;

    // Utils
    getCurrentYearData: () => TimelineYear | undefined;
}

// ========================
// Utility Types
// ========================
export interface Point {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Rect extends Point, Size { }
