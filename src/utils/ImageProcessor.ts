/**
 * ImageProcessor - 이미지 최적화 유틸리티
 * 
 * 업로드된 이미지를 100x100px로 리사이징하고
 * WebP 포맷으로 변환하여 용량을 최소화합니다.
 */

// ========================
// Constants
// ========================
export const IMAGE_SIZE = 100; // 100x100px
export const IMAGE_QUALITY = 0.8; // WebP 품질 (0~1)
export const IMAGE_FORMAT = 'image/webp';

// ========================
// Types
// ========================
export interface ProcessedImage {
    dataUrl: string; // WebP Base64 데이터 URL
    originalName: string;
    originalSize: number;
    processedSize: number; // 대략적인 크기 (Base64 문자열 길이)
}

export interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

// ========================
// Image Processing
// ========================

/**
 * 이미지 파일을 로드하여 HTMLImageElement로 반환
 */
function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

/**
 * 이미지 URL을 로드하여 HTMLImageElement로 반환
 */
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image from URL'));

        img.src = url;
    });
}

/**
 * 이미지를 중앙 기준으로 정사각형 크롭 영역 계산
 */
function calculateSquareCropArea(width: number, height: number): CropArea {
    const size = Math.min(width, height);
    return {
        x: (width - size) / 2,
        y: (height - size) / 2,
        width: size,
        height: size,
    };
}

/**
 * 이미지를 지정된 크기로 리사이징하고 WebP로 변환
 */
function resizeAndConvert(
    img: HTMLImageElement,
    cropArea?: CropArea,
    size: number = IMAGE_SIZE,
    quality: number = IMAGE_QUALITY
): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }

    canvas.width = size;
    canvas.height = size;

    // 크롭 영역이 없으면 자동으로 정사각형 크롭
    const crop = cropArea || calculateSquareCropArea(img.width, img.height);

    // 이미지 그리기 (크롭 + 리사이즈)
    ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        size,
        size
    );

    // WebP로 변환
    return canvas.toDataURL(IMAGE_FORMAT, quality);
}

/**
 * 원형 클리핑을 적용한 이미지 생성
 */
function applyCircularClip(
    img: HTMLImageElement,
    cropArea?: CropArea,
    size: number = IMAGE_SIZE,
    quality: number = IMAGE_QUALITY
): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }

    canvas.width = size;
    canvas.height = size;

    // 원형 클리핑 경로 생성
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // 크롭 영역이 없으면 자동으로 정사각형 크롭
    const crop = cropArea || calculateSquareCropArea(img.width, img.height);

    // 이미지 그리기
    ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        size,
        size
    );

    return canvas.toDataURL(IMAGE_FORMAT, quality);
}

// ========================
// Main Processing Functions
// ========================

/**
 * 이미지 파일을 100x100px WebP로 변환
 */
export async function processImage(
    file: File,
    options?: {
        cropArea?: CropArea;
        circular?: boolean;
        size?: number;
        quality?: number;
    }
): Promise<ProcessedImage> {
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
        throw new Error('Invalid file type. Please upload an image file.');
    }

    const img = await loadImage(file);

    const size = options?.size ?? IMAGE_SIZE;
    const quality = options?.quality ?? IMAGE_QUALITY;

    const dataUrl = options?.circular
        ? applyCircularClip(img, options?.cropArea, size, quality)
        : resizeAndConvert(img, options?.cropArea, size, quality);

    return {
        dataUrl,
        originalName: file.name,
        originalSize: file.size,
        processedSize: dataUrl.length,
    };
}

/**
 * Data URL에서 이미지를 다시 처리 (크롭 등)
 */
export async function reprocessImage(
    dataUrl: string,
    options?: {
        cropArea?: CropArea;
        circular?: boolean;
        size?: number;
        quality?: number;
    }
): Promise<string> {
    const img = await loadImageFromUrl(dataUrl);

    const size = options?.size ?? IMAGE_SIZE;
    const quality = options?.quality ?? IMAGE_QUALITY;

    return options?.circular
        ? applyCircularClip(img, options?.cropArea, size, quality)
        : resizeAndConvert(img, options?.cropArea, size, quality);
}

// ========================
// Utility Functions
// ========================

/**
 * Base64 데이터 URL의 대략적인 파일 크기 계산 (bytes)
 */
export function estimateBase64Size(dataUrl: string): number {
    // Base64는 원본 대비 약 1.33배 크기
    // "data:image/webp;base64," 프리픽스 제거
    const base64 = dataUrl.split(',')[1] || dataUrl;
    return Math.round((base64.length * 3) / 4);
}

/**
 * 파일 크기를 사람이 읽기 쉬운 형식으로 변환
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 이미지 유효성 검사
 */
export function isValidImageDataUrl(dataUrl: string): boolean {
    return dataUrl.startsWith('data:image/');
}

/**
 * 지원되는 이미지 파일 타입
 */
export const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
];

/**
 * 파일이 지원되는 이미지 타입인지 확인
 */
export function isSupportedImageType(file: File): boolean {
    return SUPPORTED_IMAGE_TYPES.includes(file.type);
}
