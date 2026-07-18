export default function Toggle({ on, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-disabled={disabled}
      aria-label={label}
      className={`toggle${on ? " on" : ""}`}
      disabled={disabled}
      onClick={() => !disabled && onChange(!on)}
    />
  );
}
