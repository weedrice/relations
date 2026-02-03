/**
 * PropertyPanel - 속성 패널 컴포넌트
 * 
 * 우측에 선택된 노드/엣지의 속성을 편집하는 패널을 제공합니다.
 */

import { useCallback, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../stores/useMapStore';
import { useDraggable } from '../../hooks/useDraggable';
import { PANEL_Z_BASE, PANEL_Z_FOCUSED } from '../../constants/panelZIndex';
import type { NodeStatus, RelationshipType } from '../../stores/types';
import { relationshipPresets } from '../../constants/relationshipPresets';
import { statusStyles } from '../../constants/statusStyles';
import ImageCropModal from '../modals/ImageCropModal';

const PANEL_ID = 'panel-property';

// ========================
// Component
// ========================
export default function PropertyPanel() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

    // Store
    const {
        data,
        currentYear,
        selectedNodeIds,
        selectedEdgeIds,
        updateNode,
        updateEdge,
        deleteNode,
        deleteEdge,
        focusedPanelId,
        setFocusedPanel,
    } = useMapStore();

    const yearData = data.timeline.find((t) => t.year === currentYear);
    const selectedNode = yearData?.nodes.find((n) => selectedNodeIds.includes(n.id));
    const selectedEdge = yearData?.edges.find((e) => selectedEdgeIds.includes(e.id));

    const hasSelection = selectedNode || selectedEdge;

    const initialPos = useMemo(
        () => ({ x: typeof window !== 'undefined' ? window.innerWidth - 336 : 400, y: 72 }),
        [hasSelection]
    );
    const { position, handleMouseDown } = useDraggable({ initialPosition: initialPos });

    // ========================
    // Node Handlers
    // ========================
    const handleNameChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (selectedNode) {
                updateNode(selectedNode.id, {
                    attributes: { ...selectedNode.attributes, name: e.target.value },
                });
            }
        },
        [selectedNode, updateNode]
    );

    const handleAttributeChange = useCallback(
        (key: string, value: string | number | undefined) => {
            if (selectedNode) {
                updateNode(selectedNode.id, {
                    attributes: { ...selectedNode.attributes, [key]: value },
                });
            }
        },
        [selectedNode, updateNode]
    );

    const handleStatusChange = useCallback(
        (status: NodeStatus) => {
            if (selectedNode) {
                updateNode(selectedNode.id, { status });
            }
        },
        [selectedNode, updateNode]
    );

    const handleImageClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleImageChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            // 이미지를 Data URL로 변환하여 크롭 모달에서 사용
            const reader = new FileReader();
            reader.onload = () => {
                setTempImageUrl(reader.result as string);
                setIsCropModalOpen(true);
            };
            reader.readAsDataURL(file);

            e.target.value = '';
        },
        []
    );

    const handleCropComplete = useCallback(
        (croppedImageBase64: string) => {
            if (selectedNode) {
                updateNode(selectedNode.id, { img: croppedImageBase64 });
            }
            setTempImageUrl(null);
        },
        [selectedNode, updateNode]
    );

    const handleCropModalClose = useCallback(() => {
        setIsCropModalOpen(false);
        setTempImageUrl(null);
    }, []);

    const handleDeleteNode = useCallback(() => {
        if (selectedNode && confirm('이 캐릭터를 삭제하시겠습니까?')) {
            deleteNode(selectedNode.id);
        }
    }, [selectedNode, deleteNode]);

    // ========================
    // Edge Handlers
    // ========================
    const handleEdgeTypeChange = useCallback(
        (type: RelationshipType) => {
            if (selectedEdge) {
                updateEdge(selectedEdge.id, { type });
            }
        },
        [selectedEdge, updateEdge]
    );

    const handleEdgeLabelChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (selectedEdge) {
                updateEdge(selectedEdge.id, { label: e.target.value });
            }
        },
        [selectedEdge, updateEdge]
    );

    const handleBidirectionalChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (selectedEdge) {
                updateEdge(selectedEdge.id, { bidirectional: e.target.checked });
            }
        },
        [selectedEdge, updateEdge]
    );

    const handleDeleteEdge = useCallback(() => {
        if (selectedEdge && confirm('이 관계선을 삭제하시겠습니까?')) {
            deleteEdge(selectedEdge.id);
        }
    }, [selectedEdge, deleteEdge]);

    // ========================
    // Render
    // ========================
    return (
        <AnimatePresence>
            {hasSelection && (
                <motion.div
                    initial={{ x: 80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 80, opacity: 0 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 200 }}
                    className="fixed w-80 panel-base overflow-hidden cursor-grab active:cursor-grabbing select-none"
                    style={{ left: position.x, top: position.y, zIndex: focusedPanelId === PANEL_ID ? PANEL_Z_FOCUSED : PANEL_Z_BASE }}
                    onMouseDown={() => setFocusedPanel(PANEL_ID)}
                >
                    <div
                        className="border-b border-slate-700/60 bg-slate-800/40 rounded-t-xl shrink-0"
                        onMouseDown={handleMouseDown}
                    >
                        <h3 className="font-semibold text-white text-sm panel-element-margin-all">
                            {selectedNode ? '캐릭터 속성' : '관계 속성'}
                        </h3>
                    </div>

                    <div className="panel-body">
                    {selectedNode && (
                        <div className="space-y-12">
                            <div className="flex flex-col items-center gap-2 panel-element-margin mb-4">
                                <button
                                    onClick={handleImageClick}
                                    className="w-24 h-24 rounded-full bg-slate-700/80 border-2 border-dashed border-slate-600 hover:border-blue-500/70 transition-all overflow-hidden ring-2 ring-transparent hover:ring-blue-500/30"
                                >
                                    {selectedNode.img ? (
                                        <img src={selectedNode.img} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-slate-500 text-sm font-medium">+ 이미지</span>
                                    )}
                                </button>
                                <span className="text-xs text-slate-500">클릭하여 이미지 업로드</span>
                            </div>

                            <div className="panel-element-margin mt-2">
                                <label className="block text-xs font-medium text-slate-500 mb-5">이름</label>
                                <input
                                    type="text"
                                    value={selectedNode.attributes.name || ''}
                                    onChange={handleNameChange}
                                    className="input-base w-full text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6 panel-element-margin">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-5">직업</label>
                                    <input
                                        type="text"
                                        value={(selectedNode.attributes.job as string) ?? ''}
                                        onChange={(e) => handleAttributeChange('job', e.target.value || undefined)}
                                        placeholder="예: 개발자"
                                        className="input-base w-full text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-5">나이</label>
                                    <input
                                        type="number"
                                        value={(selectedNode.attributes.age as number) ?? ''}
                                        onChange={(e) => handleAttributeChange('age', e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="예: 30"
                                        min={0}
                                        className="input-base w-full text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 panel-element-margin">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-5">성별</label>
                                    <input
                                        type="text"
                                        value={(selectedNode.attributes.gender as string) ?? ''}
                                        onChange={(e) => handleAttributeChange('gender', e.target.value || undefined)}
                                        placeholder="예: 남/여"
                                        className="input-base w-full text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-5">키</label>
                                    <input
                                        type="text"
                                        value={(selectedNode.attributes.height as string) ?? ''}
                                        onChange={(e) => handleAttributeChange('height', e.target.value || undefined)}
                                        placeholder="예: 180cm"
                                        className="input-base w-full text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 panel-element-margin">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-5">생일</label>
                                    <input
                                        type="text"
                                        value={(selectedNode.attributes.birthday as string) ?? ''}
                                        onChange={(e) => handleAttributeChange('birthday', e.target.value || undefined)}
                                        placeholder="예: 1990-01-15"
                                        className="input-base w-full text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-5">몸무게</label>
                                    <input
                                        type="text"
                                        value={(selectedNode.attributes.weight as string) ?? ''}
                                        onChange={(e) => handleAttributeChange('weight', e.target.value || undefined)}
                                        placeholder="예: 70kg"
                                        className="input-base w-full text-sm"
                                    />
                                </div>
                            </div>

                            <div className="panel-element-margin">
                                <label className="block text-xs font-medium text-slate-500 mb-5">상태</label>
                                <div className="flex gap-5">
                                    {Object.values(statusStyles).map((style) => (
                                        <button
                                            key={style.status}
                                            onClick={() => handleStatusChange(style.status)}
                                            className={`
                                                flex-1 rounded-lg text-sm font-medium py-3 px-4 transition-all
                                                ${selectedNode.status === style.status
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'}
                                            `}
                                        >
                                            {style.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-10 panel-element-margin">
                                <button
                                    onClick={handleDeleteNode}
                                    className="w-full rounded-lg text-sm font-medium transition-colors bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    )}

                    {selectedEdge && (
                        <div className="space-y-12">
                            <div className="panel-element-margin">
                                <label className="block text-xs font-medium text-slate-500 mb-1">관계 유형</label>
                                <div className="pt-8 grid grid-cols-2 gap-3">
                                    {Object.values(relationshipPresets).map((preset) => (
                                        <button
                                            key={preset.type}
                                            onClick={() => handleEdgeTypeChange(preset.type)}
                                            className={`
                                                rounded-lg text-sm font-medium transition-all flex items-center gap-4 py-3 px-4
                                                ${selectedEdge.type === preset.type
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'}
                                            `}
                                        >
                                            <span
                                                className="w-4 h-4 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: preset.color }}
                                            />
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="panel-element-margin">
                                <label className="block text-xs font-medium text-slate-500 mb-5">라벨</label>
                                <input
                                    type="text"
                                    value={selectedEdge.label || ''}
                                    onChange={handleEdgeLabelChange}
                                    placeholder="관계 설명..."
                                    className="input-base w-full text-sm"
                                />
                            </div>

                            <label className="flex items-center gap-4 cursor-pointer text-sm text-slate-300 mt-4 panel-element-margin">
                                <input
                                    type="checkbox"
                                    checked={selectedEdge.bidirectional}
                                    onChange={handleBidirectionalChange}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-2 focus:ring-blue-500/50"
                                />
                                양방향 관계
                            </label>

                            <div className="panel-element-margin">
                                <button
                                    onClick={handleDeleteEdge}
                                    className="w-full rounded-lg text-sm font-medium transition-colors bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                    />
                    </div>
                </motion.div>
            )}

            {/* Image Crop Modal */}
            {tempImageUrl && (
                <ImageCropModal
                    isOpen={isCropModalOpen}
                    imageUrl={tempImageUrl}
                    onClose={handleCropModalClose}
                    onCropComplete={handleCropComplete}
                />
            )}
        </AnimatePresence>
    );
}
