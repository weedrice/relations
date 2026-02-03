/**
 * usePdfExport - PDF 내보내기 훅
 * 
 * jsPDF를 사용하여 현재 캔버스를 PDF로 내보냅니다.
 */

import { useCallback } from 'react';
import { jsPDF } from 'jspdf';
import type { Stage } from 'konva/lib/Stage';

interface ExportOptions {
    filename?: string;
    quality?: number;
    scale?: number;
    orientation?: 'portrait' | 'landscape';
    format?: 'a4' | 'a3' | 'letter';
}

const defaultOptions: ExportOptions = {
    filename: 'relationship-map',
    quality: 0.95,
    scale: 2,
    orientation: 'landscape',
    format: 'a4',
};

/**
 * PDF 내보내기 훅
 */
export function usePdfExport() {
    const exportToPdf = useCallback(
        async (stage: Stage | null, options: ExportOptions = {}) => {
            if (!stage) {
                throw new Error('Stage reference is required');
            }

            const opts = { ...defaultOptions, ...options };

            try {
                // 현재 스테이지 상태 저장
                const oldScale = stage.scaleX();
                const oldPosition = { x: stage.x(), y: stage.y() };

                // 스테이지를 원래 크기로 리셋
                stage.scale({ x: 1, y: 1 });
                stage.position({ x: 0, y: 0 });

                // 캔버스의 실제 크기 계산
                const bbox = stage.getClientRect({ skipTransform: true });
                const width = bbox.width || stage.width();
                const height = bbox.height || stage.height();

                // 이미지로 변환
                const dataUrl = stage.toDataURL({
                    pixelRatio: opts.scale,
                    mimeType: 'image/png',
                    quality: opts.quality,
                });

                // 스테이지 상태 복원
                stage.scale({ x: oldScale, y: oldScale });
                stage.position(oldPosition);

                // PDF 생성
                const pdf = new jsPDF({
                    orientation: opts.orientation,
                    unit: 'mm',
                    format: opts.format,
                });

                // PDF 페이지 크기
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                // 이미지 비율 계산
                const imgRatio = width / height;
                const pdfRatio = pdfWidth / pdfHeight;

                let imgWidth: number;
                let imgHeight: number;
                let x: number;
                let y: number;

                if (imgRatio > pdfRatio) {
                    // 이미지가 더 넓음 - 너비에 맞춤
                    imgWidth = pdfWidth - 20; // 여백 10mm
                    imgHeight = imgWidth / imgRatio;
                    x = 10;
                    y = (pdfHeight - imgHeight) / 2;
                } else {
                    // 이미지가 더 높음 - 높이에 맞춤
                    imgHeight = pdfHeight - 20;
                    imgWidth = imgHeight * imgRatio;
                    x = (pdfWidth - imgWidth) / 2;
                    y = 10;
                }

                // 이미지 추가
                pdf.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight);

                // 제목 추가 (옵션)
                pdf.setFontSize(8);
                pdf.setTextColor(128);
                pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 10, pdfHeight - 5);

                // PDF 저장
                pdf.save(`${opts.filename}.pdf`);

                return true;
            } catch (error) {
                console.error('PDF export failed:', error);
                throw error;
            }
        },
        []
    );

    return { exportToPdf };
}

/**
 * 이미지로 내보내기 (PNG)
 */
export function useImageExport() {
    const exportToImage = useCallback(
        (stage: Stage | null, filename: string = 'relationship-map') => {
            if (!stage) {
                throw new Error('Stage reference is required');
            }

            const dataUrl = stage.toDataURL({
                pixelRatio: 2,
                mimeType: 'image/png',
            });

            // 다운로드 링크 생성
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            return true;
        },
        []
    );

    return { exportToImage };
}
