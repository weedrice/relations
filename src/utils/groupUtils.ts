/**
 * 그룹 관련 유틸
 * - 그룹 내부 여부 판정 (노드가 그룹 사각형 안에 있으면 해당 그룹 소속으로 간주)
 */

import type { Group } from '../stores/types';
import type { CharacterNode } from '../stores/types';

export interface Point {
  x: number;
  y: number;
}

/** 점이 그룹 사각형 안에 있는지 */
export function isPointInsideGroup(point: Point, group: Group): boolean {
  return (
    point.x >= group.x &&
    point.x <= group.x + group.width &&
    point.y >= group.y &&
    point.y <= group.y + group.height
  );
}

/** 점을 포함하는 그룹 ID (여러 개면 첫 번째) */
export function getContainingGroupId(point: Point, groups: Group[]): string | undefined {
  const found = groups.find((g) => isPointInsideGroup(point, g));
  return found?.id;
}

/** 노드 중심점이 그룹 사각형 안에 있는지 */
export function isNodeInsideGroup(node: CharacterNode, group: Group): boolean {
  return isPointInsideGroup({ x: node.x, y: node.y }, group);
}

/** 그룹에 속한 노드 목록 (groupId 일치 또는 그룹 내부에 있는 경우) */
export function getNodesInGroup(
  group: Group,
  nodes: CharacterNode[]
): CharacterNode[] {
  return nodes.filter(
    (n) => n.groupId === group.id || isNodeInsideGroup(n, group)
  );
}
