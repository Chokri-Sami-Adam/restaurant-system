const DatePicker = ({ value, onChange }) => {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-dark cursor-pointer w-full"
      onFocus={(e) => e.target.showPicker?.()}
    />
  );
};

export default DatePicker;
