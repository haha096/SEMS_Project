// src/components/ui/checkbox.tsx
import * as React from "react";

// shadcn 호환: boolean | "indeterminate"
type CheckedState = boolean | "indeterminate";

export interface CheckboxProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "checked"> {
    checked?: CheckedState;
    onCheckedChange?: (checked: CheckedState) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className = "", checked, onCheckedChange, ...props }, ref) => {
        // 내부 상태 (uncontrolled 대비)
        const [inner, setInner] = React.useState<CheckedState>(checked ?? false);

        // 외부 controlled 대응
        React.useEffect(() => {
            if (checked !== undefined) setInner(checked);
        }, [checked]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const next = e.target.indeterminate ? "indeterminate" : e.target.checked;
            setInner(next);
            onCheckedChange?.(next);
        };

        // indeterminate 지원
        const inputRef = React.useRef<HTMLInputElement>(null);
        React.useEffect(() => {
            const node = inputRef.current;
            if (!node) return;
            node.indeterminate = inner === "indeterminate";
        }, [inner]);

        return (
            <input
                ref={(node) => {
                    inputRef.current = node;
                    if (typeof ref === "function") ref(node);
                    else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
                }}
                type="checkbox"
                className={
                    "h-4 w-4 rounded border-gray-300 text-blue-600 " +
                    "focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 " +
                    "disabled:opacity-50 disabled:cursor-not-allowed " +
                    className
                }
                checked={inner === true}
                onChange={handleChange}
                {...props}
            />
        );
    }
);
Checkbox.displayName = "Checkbox";
