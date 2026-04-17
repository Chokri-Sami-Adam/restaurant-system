export default function TextareaField({
  value,
  onChange,
  placeholder = '',
  rows = 3,
  disabled = false,
  className = '',
}) {
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={`input-dark resize-y ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    />
  );
}
