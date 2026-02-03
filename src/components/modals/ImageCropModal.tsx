/**
 * ImageCropModal - 이미지 크롭 모달
 * 
 * react-easy-crop을 사용하여 이미지를 원형으로 크롭합니다.
 */

import { useState, useCallback, useMemo } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { useDraggable } from '../../hooks/useDraggable';
import { useMapStore } from '../../stores/useMapStore';
import { PANEL_Z_BASE, PANEL_Z_FOCUSED } from '../../constants/panelZIndex';
import { reprocessImage } from '../../utils/ImageProcessor';

const MODAL_ID = 'modal-image-crop';

interface ImageCropModalProps {
    isOpen: boolean;
    imageUrl: string;
    onClose: () => void;
    onCropComplete: (croppedImageBase64: string) => void;
}

// 크롭된 이미지를 캔버스로 추출
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
    const image = new Image();
    image.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = imageSrc;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // 크롭 크기로 캔버스 설정
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // 크롭 영역 그리기
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    // Data URL로 변환
    const croppedDataUrl = canvas.toDataURL('image/png');

    // reprocessImage로 최적화 (100x100, WebP, 원형 클립)
    const optimizedDataUrl = await reprocessImage(croppedDataUrl, { circular: true });

    return optimizedDataUrl;
}

export default function ImageCropModal({
    isOpen,
    imageUrl,
    onClose,
    onCropComplete,
}: ImageCropModalProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = useCallback((location: Point) => {
        setCrop(location);
    }, []);

    const onZoomChange = useCallback((newZoom: number) => {
        setZoom(newZoom);
    }, []);

    const onCropCompleteInternal = useCallback((_: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = useCallback(async () => {
        if (!croppedAreaPixels) return;

        setIsProcessing(true);
        try {
            const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels);
            onCropComplete(croppedImage);
            onClose();
        } catch (error) {
            console.error('Crop failed:', error);
            alert('이미지 크롭에 실패했습니다.');
        } finally {
            setIsProcessing(false);
        }
    }, [imageUrl, croppedAreaPixels, onCropComplete, onClose]);

    const handleCancel = useCallback(() => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        onClose();
    }, [onClose]);

    const initialPos = useMemo(
        () => ({
            x: typeof window !== 'undefined' ? Math.max(16, window.innerWidth / 2 - 258) : 200,
            y: typeof window !== 'undefined' ? Math.max(56, window.innerHeight / 2 - 240) : 200,
        }),
        [isOpen]
    );
    const { position, handleMouseDown } = useDraggable({ initialPosition: initialPos });
    const focusedPanelId = useMapStore((s) => s.focusedPanelId);
    const setFocusedPanel = useMapStore((s) => s.setFocusedPanel);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    style={{ zIndex: focusedPanelId === MODAL_ID ? PANEL_Z_FOCUSED : PANEL_Z_BASE }}
                    onClick={handleCancel}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed panel-base w-[520px] max-w-[90vw] cursor-grab active:cursor-grabbing select-none"
                        style={{ left: position.x, top: position.y }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={() => setFocusedPanel(MODAL_ID)}
                    >
                        <div
                            className="border-b border-slate-700/60 bg-slate-800/40 rounded-t-xl"
                            onMouseDown={handleMouseDown}
                        >
                            <h3 className="text-lg font-bold text-white panel-element-margin-all">이미지 크롭</h3>
                            <p className="text-sm text-slate-500 mt-2.5 panel-element-margin">원형으로 잘라 프로필에 사용됩니다.</p>
                        </div>

                        <div className="space-y-8 panel-body">
                        <div className="relative h-[280px] bg-slate-900/80 rounded-xl overflow-hidden border border-slate-700/50 panel-element-margin">
                            <Cropper
                                image={imageUrl}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={onCropChange}
                                onZoomChange={onZoomChange}
                                onCropComplete={onCropCompleteInternal}
                            />
                        </div>

                        <div className="panel-element-margin">
                            <label className="text-xs font-medium text-slate-500 block mb-4">확대/축소</label>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-2 rounded-full appearance-none bg-slate-700 accent-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                            />
                        </div>

                        <div className="flex gap-4 mt-2 panel-element-margin">
                            <button
                                onClick={handleCancel}
                                className="flex-1 input-base font-medium text-white hover:bg-slate-600 transition-colors rounded-lg"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isProcessing}
                                className="flex-1 btn-primary rounded-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isProcessing ? '처리 중...' : '적용'}
                            </button>
                        </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
