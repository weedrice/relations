# Interactive Relationship Map Editor - 개발 Task

## 프로젝트 개요
인물 관계도를 시각적으로 편집하고, 시간에 따른 관계 변화를 애니메이션으로 확인할 수 있는 서버리스 웹 애플리케이션

---

## Phase 1: 기반 설정 ✅

- [x] Vite + React + TypeScript 프로젝트 초기화
- [x] 핵심 의존성 설치 (konva, zustand, fflate, elkjs, jspdf, framer-motion, react-easy-crop)
- [x] TailwindCSS 설정
- [x] 프로젝트 구조 설계

---

## Phase 2: 핵심 유틸리티 ✅

- [x] DataManager.ts - .relmap 파일 저장/불러오기 (Gzip 압축)
- [x] ImageProcessor.ts - 이미지 리사이징 (100x100), WebP 변환, 원형 클립
- [x] nanoid.ts - 유니크 ID 생성기

---

## Phase 3: 상태 관리 ✅

- [x] types.ts - 데이터 타입 정의 (MapData, CharacterNode, RelationshipEdge, Group, TimelineYear)
- [x] useMapStore.ts - Zustand + Zundo 전역 상태 관리
- [x] Undo/Redo 기능 (50단계 히스토리)

---

## Phase 4: 캔버스 컴포넌트 ✅

- [x] MainCanvas.tsx - Konva.js 무한 캔버스, 줌/팬
- [x] CharacterNode.tsx - 100px 원형 노드, 드래그, 상태별 스타일
- [x] RelationshipEdge.tsx - 베지어 커브 관계선, 화살표, 라벨
- [x] GroupContainer.tsx - 그룹 배경 영역
- [x] GridBackground.tsx - 동적 그리드 패턴

---

## Phase 5: UI 패널 ✅

- [x] ToolPanel.tsx - 좌측 도구 패널 (파일 작업, 노드 추가, 줌, Undo/Redo)
- [x] PropertyPanel.tsx - 우측 속성 패널 (노드/엣지 편집)
- [x] TimelineSlider.tsx - 하단 타임라인 (연도 선택, 추가, 복제)
- [x] MiniMap.tsx - 우측 하단 미니맵

---

## Phase 6: 고급 기능 ✅

- [x] 관계선 추가 UI (연결 모드)
- [x] 타임라인 애니메이션 (useTimelineAnimation.ts)
- [x] Auto-Layout ELKjs (useAutoLayout.ts)
- [x] PDF 내보내기 (usePdfExport.ts)
- [x] 이미지 크롭/편집 (ImageCropModal.tsx)
- [x] 그룹 관리 UI (GroupPanel.tsx)
- [x] 검색/필터 (SearchPanel.tsx)
- [x] 키보드 단축키 (useKeyboardShortcuts.ts)

---

## Phase 7: 통합 및 UI 개선 ✅

- [x] App.tsx에 모든 패널 통합
- [x] 헤더에 검색/그룹/도움말 버튼 추가
- [x] 연결 모드 인디케이터 표시
- [x] PDF 내보내기 버튼 헤더에 추가
- [x] PNG 이미지 내보내기 버튼 헤더에 추가
- [x] 이미지 크롭 모달을 PropertyPanel에 연결
- [x] 외부 클릭 시 내보내기 메뉴 닫기

---

## Phase 8: 테스트 및 최적화 🔄

- [ ] 키보드 단축키 테스트
- [ ] 파일 저장/불러오기 테스트
- [ ] 타임라인 애니메이션 테스트
- [ ] 자동 배치 테스트
- [ ] 성능 최적화 (대량 노드 처리)
- [ ] 브라우저 호환성 테스트

---

## Phase 9: 문서화 ⏳

- [ ] README.md 업데이트 (사용법, 기능 설명)
- [ ] 단축키 목록 문서화
- [ ] 파일 포맷(.relmap) 스펙 문서화

---

## 현재 진행 상황

**완료**: Phase 1~7 (기본 기능 및 UI 개선 완료)
**진행 중**: Phase 8 (테스트 및 최적화)
**대기 중**: Phase 9 (문서화)

---

## 다음 작업

1. 개발 서버에서 기능 테스트 (키보드 단축키, 파일 저장/불러오기)
2. 타임라인 애니메이션 테스트
3. 자동 배치 기능 테스트
