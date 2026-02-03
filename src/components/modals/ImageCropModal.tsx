/**
 * ImageCropModal - 이미지 크롭 모달
 * 
 * react-easy-crop을 사용하여 이미지를 원형으로 크롭합니다.
 */

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { reprocessImage } from '../../utils/ImageProcessor';

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

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                    onClick={handleCancel}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-slate-800 rounded-2xl p-6 w-[500px] max-w-[90vw] shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold text-white mb-4">이미지 크롭</h3>

                        {/* Cropper Area */}
                        <div className="relative h-[300px] bg-slate-900 rounded-xl overflow-hidden">
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

                        {/* Zoom Slider */}
                        <div className="mt-4">
                            <label className="text-sm text-slate-400 block mb-2">확대/축소</label>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCancel}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                            >
                                {isProcessing ? '처리 중...' : '적용'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
