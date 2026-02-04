# 인물 관계도 에디터

인물 관계도를 시각적으로 편집하고, 타임라인에 따른 관계 변화를 애니메이션으로 확인할 수 있는 서버리스 웹 애플리케이션입니다.

## 기술 스택

| 카테고리 | 기술 |
|---|---|
| UI 프레임워크 | React 19, TypeScript |
| 캔버스 렌더링 | Konva.js, react-konva |
| 상태 관리 | Zustand, Zundo (Undo/Redo) |
| 스타일링 | TailwindCSS v4 |
| 번들러 | Vite |
| 자동 배치 | ELKjs |
| 파일 압축 | fflate (Gzip) |
| PDF 내보내기 | jsPDF |
| 애니메이션 | Framer Motion |

---

## 시작하기

### 환경 요구사항

- Node.js 18 이상
- npm

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# 린팅
npm run lint
```

---

## 프로젝트 구조

```
src/
├── components/
│   ├── canvas/          # 캔버스 컴포넌트 (MainCanvas, CharacterNode, RelationshipEdge, GroupContainer, GridBackground)
│   ├── panels/          # UI 패널 (ToolPanel, PropertyPanel, GroupPanel, SearchPanel, MiniMap)
│   ├── modals/          # 모달 (ImageCropModal)
│   └── timeline/        # 타임라인 (TimelineSlider)
├── stores/              # Zustand 상태 관리 및 타입 정의
├── hooks/               # 커스텀 훅 (단축키, 드래그, 자동배치, PDF 내보내기, 타임라인 애니메이션)
├── utils/               # 유틸리티 (파일 저장/불러오기, 이미지 처리, 그룹 판정)
└── constants/           # 상수 정의 (관계 스타일, 그룹 색상, 노드 상태 등)
```

---

## 기능

### 캔버스
- 무한 캔버스 (줌 범위: 0.1x ~ 3.0x)
- 마우스 휠 줌, 드래그 팬
- 동적 그리드 배경
- 뷰포트 미니맵

### 노드 관리
- 원형 노드 추가, 이동, 삭제
- 이미지 업로드 및 크롭 (자동 WebP 변환, 100x100px 최적화)
- 노드 상태 설정: 생존, 사망, 실종
- 속성 편집: 이름, 나이, 직업, 성별, 키, 체중, 생일, 설명

### 관계선
- 베지어 곡선 렌더링
- 양방향 화살표 지원
- 라벨 추가
- 7가지 관계 유형

| 유형 | 색상 | 표현 |
|---|---|---|
| 친함 | 그린 | 실선 |
| 소원 | 슬레이트 | 점선 |
| 적대 | 레드 | 실선 |
| 연인 | 핑크 | 실선 |
| 가족 | 앰버 | 실선 |
| 업무 | 블루 | 실선 |
| 커스텀 | 바이올렛 | 실선 |

### 그룹
- 드래그로 영역 지정하여 그룹 생성
- 8가지 색상 팔레트
- 그룹 내 노드 관리

### 타임라인
- 연도별 관계도 상태 관리
- 연도 추가, 삭제, 복제
- 연도 간 전환 시 애니메이션

### 파일 관리
- `.relmap` 파일 포맷으로 저장/불러오기 (Gzip 압축)
- 스키마 버전 관리 및 마이그레이션

### 내보내기
- PDF 내보내기
- PNG 이미지 내보내기

### 편의 기능
- 자동 배치 (ELKjs)
- Undo / Redo (50단계 히스토리)
- 노드, 관계선 검색/필터

---

## 키보드 단축키

| 단축키 | 기능 |
|---|---|
| `Ctrl + N` | 새 프로젝트 |
| `Ctrl + S` | 저장 |
| `Ctrl + Z` | 실행 취소 (Undo) |
| `Ctrl + Shift + Z` / `Ctrl + Y` | 다시 실행 (Redo) |
| `Ctrl + G` | 그룹 패널 열기 |
| `E` | 연결 모드 토글 |
| `Shift + G` | 그룹 모드 토글 |
| `Delete` / `Backspace` | 선택 항목 삭제 |
| `Escape` | 선택 해제 / 모드 취소 |

> 텍스트 입력 필드에 포커스된 상태에서는 단축키가 동작하지 않습니다.

---

## .relmap 파일 포맷

`.relmap` 파일은 `MapData` 객체를 JSON 직렬화한 후 Gzip 압축한 바이너리 파일입니다.

```
MapData (JSON) → UTF-8 인코딩 → Gzip 압축 → .relmap 파일
```

### 데이터 구조

```typescript
MapData {
  meta: {
    schemaVersion: string    // 현재: "1.0.0"
    createdAt: number        // 생성 시간 (Unix timestamp)
    updatedAt: number        // 마지막 저장 시간
    projectTitle: string     // 프로젝트 제목
  }
  globalSettings: {
    theme: 'dark' | 'light'
    showGrid: boolean
    snapToGrid: boolean
    gridSize: number
  }
  timeline: TimelineYear[]   // 연도별 데이터 배열
}

TimelineYear {
  year: number
  label?: string
  nodes: CharacterNode[]
  edges: RelationshipEdge[]
  groups: Group[]
}

CharacterNode {
  id: string
  x, y: number               // 캔버스 좌표
  status: 'alive' | 'dead' | 'missing'
  img?: string                // WebP Base64 이미지
  attributes: {
    name: string
    age?, job?, description?, gender?, height?, birthday?, weight?: string
  }
  groupId?: string
}

RelationshipEdge {
  id: string
  sourceId, targetId: string
  type: 'friendly' | 'distant' | 'hostile' | 'romantic' | 'family' | 'business' | 'custom'
  label?: string
  bidirectional: boolean
  color?, strokeWidth?: number
}

Group {
  id: string
  name: string
  color: string
  x, y, width, height: number
}
```

파일 불러오기 시 스키마 버전을 검증하고, 이전 버전이면 자동 마이그레이션됩니다.
