/**
 * GroupFormFields - 새 그룹 / 그룹 편집 공통 폼
 * 이름 입력, 색상 선택(프리셋 + 무지개 RGB 피커), 취소/확인 버튼
 */

import { GROUP_COLORS } from '../../constants/groupColors';

/** 프리셋에 없는 색이면 RGB 피커로 선택된 것으로 간주 */
function isRgbPickerSelected(color: string): boolean {
    const hex = color.startsWith('#') ? color.toLowerCase() : `#${color}`.toLowerCase();
    return !GROUP_COLORS.some((c) => c.toLowerCase() === hex);
}

/** input[type=color]에 넣을 값: 항상 #rrggbb */
function toHexValue(color: string): string {
    if (color.startsWith('#')) return color;
    return `#${color}`;
}

export interface GroupFormFieldsProps {
    /** 이름 필드 라벨 (예: "그룹 편집", "이름") */
    nameLabel: string;
    nameValue: string;
    onNameChange: (value: string) => void;
    namePlaceholder?: string;
    color: string;
    onColorChange: (color: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
    /** 확인 버튼 텍스트 (예: "저장", "생성") */
    confirmLabel: string;
    confirmDisabled?: boolean;
    /** 이름 입력 아래 여백 (그룹 편집: mb-4, 모달: 없음) */
    nameInputClassName?: string;
    /** 이름 input autoFocus (모달에서 true) */
    autoFocus?: boolean;
    /** 루트 wrapper className (그룹 편집: mb-6 panel-element-margin-x) */
    className?: string;
}

const BUTTON_PADDING = { paddingTop: '6px', paddingBottom: '6px' } as const;

export default function GroupFormFields({
    nameLabel,
    nameValue,
    onNameChange,
    namePlaceholder = '그룹 이름',
    color,
    onColorChange,
    onCancel,
    onConfirm,
    confirmLabel,
    confirmDisabled = false,
    nameInputClassName = 'input-base w-full text-sm mb-4',
    autoFocus = false,
    className = '',
}: GroupFormFieldsProps) {
    return (
        <div className={className}>
            <label className="text-xs font-medium text-slate-500 block mb-5">{nameLabel}</label>
            <input
                type="text"
                value={nameValue}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder={namePlaceholder}
                className={nameInputClassName}
                autoFocus={autoFocus}
            />
            <div style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                <div className="rounded-xl bg-slate-700/40 border border-slate-600/50" style={{ padding: '12px' }}>
                    <span className="text-xs font-medium text-slate-500 block mb-3">색상</span>
                    <div className="flex items-center gap-2 flex-wrap">
                        {GROUP_COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => onColorChange(c)}
                                className={`w-6 h-6 rounded-full transition-transform shrink-0 ${toHexValue(color).toLowerCase() === c.toLowerCase() ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                        <div
                            className={`relative shrink-0 w-6 h-6 rounded-full overflow-hidden border-2 hover:scale-110 transition-transform cursor-pointer ${isRgbPickerSelected(color) ? 'scale-125 ring-2 ring-white border-white/80' : 'border-slate-500'}`}
                            style={{ background: 'conic-gradient(from 0deg, #ef4444, #f97316, #eab308, #22c55e, #14b8a6, #3b82f6, #8b5cf6, #ec4899, #ef4444)' }}
                            title="RGB 색상 선택 (클릭)"
                        >
                            <input
                                type="color"
                                value={toHexValue(color)}
                                onChange={(e) => onColorChange(e.target.value)}
                                className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                                aria-label="무지개 그라데이션 RGB 색상 선택"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex gap-5">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 input-base text-sm font-medium hover:bg-slate-600 transition-colors"
                    style={BUTTON_PADDING}
                >
                    취소
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={confirmDisabled}
                    className="flex-1 btn-primary rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={BUTTON_PADDING}
                >
                    {confirmLabel}
                </button>
            </div>
        </div>
    );
}
