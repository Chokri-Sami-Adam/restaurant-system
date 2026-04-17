export default function ToggleSwitch({ value, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative w-14 h-8 rounded-full transition-all ${
        value ? 'bg-emerald-600 shadow-lg shadow-emerald-500/50' : 'bg-zinc-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
          value ? 'translate-x-6' : ''
        }`}
      />
    </button>
  );
}
