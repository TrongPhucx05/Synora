import { clsx } from "clsx";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export const ToggleSwitch = ({ checked, onChange, disabled }: ToggleSwitchProps) => (
  <button
    onClick={onChange}
    disabled={disabled}
    aria-checked={checked}
    role="switch"
    className={clsx(
      "w-10 h-5 rounded-full transition-all relative shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
      checked ? "bg-primary" : "bg-slate-300",
      disabled && "opacity-50 cursor-not-allowed",
    )}
  >
    <span
      className={clsx(
        "absolute top-0.5 w-4 h-4 rounded-full bg-surface shadow-sm transition-transform duration-200",
        checked ? "left-[22px]" : "left-[2px]",
      )}
    />
  </button>
);