/**
 * DataManager - Gzip 압축/해제 유틸리티
 * 
 * .relmap 파일 포맷으로 데이터를 저장하고 불러옵니다.
 * fflate 라이브러리를 사용하여 Gzip 압축을 수행합니다.
 */

import { gzipSync, gunzipSync } from 'fflate';
import { saveAs } from 'file-saver';
import type { MapData } from '../stores/types';
import { CURRENT_SCHEMA_VERSION } from '../stores/types';

// ========================
// Constants
// ========================
export const RELMAP_FILE_EXTENSION = '.relmap';
export const RELMAP_MIME_TYPE = 'application/octet-stream';

// ========================
// Schema Migration
// ========================
type MigrationFunction = (data: unknown) => unknown;

/**
 * 버전별 마이그레이션 함수 맵
 * 키: 소스 버전, 값: { target: 타겟 버전, migrate: 마이그레이션 함수 }
 */
const migrations: Map<string, { target: string; migrate: MigrationFunction }> = new Map([
    // 예시: 1.0.0 -> 1.1.0 마이그레이션
    // ['1.0.0', {
    //   target: '1.1.0',
    //   migrate: (data) => {
    //     // 마이그레이션 로직
    //     return { ...data, newField: 'defaultValue' };
    //   }
    // }],
]);

/**
 * 데이터를 현재 스키마 버전으로 마이그레이션
 */
function migrateData(data: unknown, fromVersion: string): MapData {
    let currentData = data;
    let currentVersion = fromVersion;

    // 반복적으로 마이그레이션 수행
    while (currentVersion !== CURRENT_SCHEMA_VERSION) {
        const migration = migrations.get(currentVersion);

        if (!migration) {
            // 마이그레이션 경로가 없으면 현재 버전이 최신이거나 지원되지 않는 버전
            if (currentVersion !== CURRENT_SCHEMA_VERSION) {
                console.warn(`No migration path from version ${currentVersion} to ${CURRENT_SCHEMA_VERSION}`);
            }
            break;
        }

        currentData = migration.migrate(currentData);
        currentVersion = migration.target;
        console.log(`Migrated from ${fromVersion} to ${currentVersion}`);
    }

    return currentData as MapData;
}

/**
 * 스키마 버전을 검증
 */
function validateSchemaVersion(data: unknown): string {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format: expected object');
    }

    const mapData = data as { meta?: { schemaVersion?: string } };

    if (!mapData.meta?.schemaVersion) {
        throw new Error('Invalid data format: missing schemaVersion');
    }

    return mapData.meta.schemaVersion;
}

// ========================
// Save Functions
// ========================

/**
 * MapData를 Gzip 압축하여 Blob으로 변환
 */
export function compressData(data: MapData): Blob {
    // 1. JS Object -> JSON String
    const jsonString = JSON.stringify(data);

    // 2. JSON String -> Uint8Array
    const textEncoder = new TextEncoder();
    const uint8Array = textEncoder.encode(jsonString);

    // 3. Gzip Compression
    const compressed = gzipSync(uint8Array);

    // 4. Blob 생성 - ArrayBuffer로 변환하여 타입 호환성 유지
    return new Blob([compressed.slice()], { type: RELMAP_MIME_TYPE });
}

/**
 * MapData를 .relmap 파일로 저장
 */
export async function saveToFile(data: MapData, filename?: string): Promise<void> {
    // 저장 시간 업데이트
    const dataToSave: MapData = {
        ...data,
        meta: {
            ...data.meta,
            updatedAt: Date.now(),
        },
    };

    const blob = compressData(dataToSave);
    const finalFilename = filename || `${data.meta.projectTitle || 'untitled'}${RELMAP_FILE_EXTENSION}`;

    saveAs(blob, finalFilename);
}

// ========================
// Load Functions
// ========================

/**
 * ArrayBuffer를 압축 해제하여 MapData로 변환
 */
export function decompressData(buffer: ArrayBuffer): MapData {
    // 1. ArrayBuffer -> Uint8Array
    const compressed = new Uint8Array(buffer);

    // 2. Gzip Decompression
    const decompressed = gunzipSync(compressed);

    // 3. Uint8Array -> String
    const textDecoder = new TextDecoder();
    const jsonString = textDecoder.decode(decompressed);

    // 4. JSON Parse
    const rawData = JSON.parse(jsonString);

    // 5. Schema Version 검증
    const schemaVersion = validateSchemaVersion(rawData);

    // 6. 필요시 마이그레이션
    const migratedData = migrateData(rawData, schemaVersion);

    return migratedData;
}

/**
 * File 객체에서 .relmap 파일을 읽어 MapData로 변환
 */
export async function loadFromFile(file: File): Promise<MapData> {
    // 파일 확장자 검증
    if (!file.name.endsWith(RELMAP_FILE_EXTENSION)) {
        throw new Error(`Invalid file type. Expected ${RELMAP_FILE_EXTENSION} file.`);
    }

    // File -> ArrayBuffer
    const buffer = await file.arrayBuffer();

    // 압축 해제 및 파싱
    return decompressData(buffer);
}

// ========================
// Default Data
// ========================

/**
 * 새 프로젝트의 기본 데이터 생성
 */
export function createDefaultMapData(title: string = 'Untitled Project'): MapData {
    const now = Date.now();
    const currentYear = new Date().getFullYear();

    return {
        meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION,
            createdAt: now,
            updatedAt: now,
            projectTitle: title,
        },
        globalSettings: {
            theme: 'dark',
            showGrid: true,
            showCanvasBoundary: true,
            gridSize: 20,
            snapToGrid: false,
        },
        timeline: [
            {
                year: currentYear,
                label: 'Start',
                nodes: [],
                edges: [],
                groups: [],
            },
        ],
    };
}

// ========================
// Export Utilities
// ========================

/**
 * MapData를 JSON 문자열로 내보내기 (디버깅용)
 */
export function exportToJson(data: MapData): string {
    return JSON.stringify(data, null, 2);
}

/**
 * JSON 문자열에서 MapData 가져오기 (디버깅용)
 */
export function importFromJson(jsonString: string): MapData {
    const rawData = JSON.parse(jsonString);
    const schemaVersion = validateSchemaVersion(rawData);
    return migrateData(rawData, schemaVersion);
}
