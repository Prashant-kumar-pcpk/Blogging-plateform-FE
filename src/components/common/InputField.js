function InputField({
  label,
  value,
  onChange,
  type = "text",
  labelClassName = "text-ink",
  inputClassName = "",
}) {
  return (
    <label className="block">
      <span className={`mb-2 block text-sm font-semibold ${labelClassName}`}>{label}</span>
      <input
        className={`w-full rounded-2xl border border-ink/10 px-4 py-3 outline-none focus:border-coral ${inputClassName}`}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export default InputField;
