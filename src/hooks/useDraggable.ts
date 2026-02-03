/**
 * useDraggable - 팝업/패널 드래그 훅
 *
 * 헤더 영역을 드래그하여 위치를 이동할 수 있게 합니다.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseDraggableOptions {
  /** 초기 위치 (px) */
  initialPosition: { x: number; y: number };
}

export function useDraggable({ initialPosition }: UseDraggableOptions) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef({ posX: 0, posY: 0, mouseX: 0, mouseY: 0 });

  // 팝업이 다시 열릴 때 초기 위치로 리셋
  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition.x, initialPosition.y]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a') || target.closest('input')) return;
      e.preventDefault();
      startRef.current = {
        posX: position.x,
        posY: position.y,
        mouseX: e.clientX,
        mouseY: e.clientY,
      };
      setIsDragging(true);
    },
    [position.x, position.y]
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => {
      setPosition({
        x: startRef.current.posX + e.clientX - startRef.current.mouseX,
        y: startRef.current.posY + e.clientY - startRef.current.mouseY,
      });
    };

    const onUp = () => setIsDragging(false);

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  return { position, handleMouseDown, isDragging };
}
