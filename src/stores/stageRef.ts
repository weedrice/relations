/**
 * stageRef - 전역 Stage Reference
 * 
 * MainCanvas의 Stage Ref를 전역에서 접근 가능하게 합니다.
 * PDF/이미지 내보내기 등에서 사용됩니다.
 */

import type { Stage } from 'konva/lib/Stage';
import type { MutableRefObject } from 'react';
import { createRef } from 'react';

// 전역 Stage Ref
export const globalStageRef: MutableRefObject<Stage | null> = createRef();
