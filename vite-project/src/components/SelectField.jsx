export default function SelectField({ value, onChange, options = [], disabled = false, className = '' }) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`input-dark ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
