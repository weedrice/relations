/**
 * PropertyPanel - 속성 패널 컴포넌트
 * 
 * 우측에 선택된 노드/엣지의 속성을 편집하는 패널을 제공합니다.
 */

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../stores/useMapStore';
import type { NodeStatus, RelationshipType } from '../../stores/types';
import { relationshipPresets } from '../../constants/relationshipPresets';
import { statusStyles } from '../../constants/statusStyles';
import ImageCropModal from '../modals/ImageCropModal';

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
    } = useMapStore();

    const yearData = data.timeline.find((t) => t.year === currentYear);
    const selectedNode = yearData?.nodes.find((n) => selectedNodeIds.includes(n.id));
    const selectedEdge = yearData?.edges.find((e) => selectedEdgeIds.includes(e.id));

    // 선택된 항목이 없으면 렌더링하지 않음
    const hasSelection = selectedNode || selectedEdge;

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
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    className="absolute right-4 top-4 w-72 bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-4 py-3 bg-slate-700/50 border-b border-slate-600">
                        <h3 className="font-semibold text-white">
                            {selectedNode ? '캐릭터 속성' : '관계 속성'}
                        </h3>
                    </div>

                    {/* Node Properties */}
                    {selectedNode && (
                        <div className="p-4 space-y-4">
                            {/* Profile Image */}
                            <div className="flex flex-col items-center gap-2">
                                <button
                                    onClick={handleImageClick}
                                    className="w-20 h-20 rounded-full bg-slate-700 border-2 border-dashed border-slate-500 hover:border-blue-400 transition-colors overflow-hidden"
                                >
                                    {selectedNode.img ? (
                                        <img src={selectedNode.img} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-slate-400 text-sm">이미지</span>
                                    )}
                                </button>
                                <span className="text-xs text-slate-400">클릭하여 이미지 업로드</span>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">이름</label>
                                <input
                                    type="text"
                                    value={selectedNode.attributes.name || ''}
                                    onChange={handleNameChange}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">상태</label>
                                <div className="flex gap-2">
                                    {Object.values(statusStyles).map((style) => (
                                        <button
                                            key={style.status}
                                            onClick={() => handleStatusChange(style.status)}
                                            className={`
                        flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${selectedNode.status === style.status
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                }
                      `}
                                        >
                                            {style.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Delete Button */}
                            <button
                                onClick={handleDeleteNode}
                                className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                            >
                                삭제
                            </button>
                        </div>
                    )}

                    {/* Edge Properties */}
                    {selectedEdge && (
                        <div className="p-4 space-y-4">
                            {/* Relationship Type */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">관계 유형</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.values(relationshipPresets).map((preset) => (
                                        <button
                                            key={preset.type}
                                            onClick={() => handleEdgeTypeChange(preset.type)}
                                            className={`
                        px-2 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2
                        ${selectedEdge.type === preset.type
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                }
                      `}
                                        >
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: preset.color }}
                                            />
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Label */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">라벨</label>
                                <input
                                    type="text"
                                    value={selectedEdge.label || ''}
                                    onChange={handleEdgeLabelChange}
                                    placeholder="관계 설명..."
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Bidirectional */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedEdge.bidirectional}
                                    onChange={handleBidirectionalChange}
                                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-300">양방향 관계</span>
                            </label>

                            {/* Delete Button */}
                            <button
                                onClick={handleDeleteEdge}
                                className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                            >
                                삭제
                            </button>
                        </div>
                    )}

                    {/* Hidden File Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                    />
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
