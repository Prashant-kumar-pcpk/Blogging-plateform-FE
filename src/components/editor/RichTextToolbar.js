function RichTextToolbar({ targetRef }) {
  const runCommand = (command) => {
    targetRef.current?.focus();
    document.execCommand(command, false);
  };

  return (
    <div className="flex flex-wrap gap-2 rounded-[1.5rem] bg-smoke p-3">
      {[
        ["Bold", "bold"],
        ["Italic", "italic"],
        ["H2", "formatBlock", "<h2>"],
        ["Quote", "formatBlock", "<blockquote>"],
        ["Bullet", "insertUnorderedList"],
      ].map(([label, command, value]) => (
        <button
          key={label}
          className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold"
          onClick={() => (value ? document.execCommand(command, false, value) : runCommand(command))}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default RichTextToolbar;
