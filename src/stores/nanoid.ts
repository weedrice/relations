/**
 * nanoid - 간단한 유니크 ID 생성기
 * 
 * 패키지 의존성을 줄이기 위해 간단한 구현 사용
 */

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function nanoid(size: number = 12): string {
    let id = '';
    const bytes = crypto.getRandomValues(new Uint8Array(size));

    for (let i = 0; i < size; i++) {
        id += alphabet[bytes[i] % alphabet.length];
    }

    return id;
}
