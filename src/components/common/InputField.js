function InputField({
  label,
  value,
  onChange,
  type = "text",
  labelClassName = "text-ink",
  inputClassName = "",
  error = "",
  placeholder = "",
  required = false,
  maxLength,
}) {
  return (
    <label className="block">
      <span className={`mb-2 block text-sm font-semibold ${labelClassName}`}>
        {label}
        {required ? <span className="ml-1 text-coral">*</span> : null}
      </span>
      <input
        className={`w-full rounded-2xl border px-4 py-3 outline-none focus:border-coral ${
          error ? "border-coral" : "border-ink/10"
        } ${inputClassName}`}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <span className="mt-2 block text-sm text-coral">{error}</span> : null}
    </label>
  );
}

export default InputField;
