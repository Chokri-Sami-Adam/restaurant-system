export default function InputField({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  min,
  max,
  step,
  disabled = false,
  className = '',
}) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={`input-dark ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    />
  );
}
