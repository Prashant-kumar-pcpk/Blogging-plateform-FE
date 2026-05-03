function RichTextToolbar({ targetRef }) {
  const runCommand = (command) => {
    targetRef.current?.focus();
    document.execCommand(command, false);
  };

  const insertLink = () => {
    const url = window.prompt("Enter the link URL");
    if (!url) {
      return;
    }

    targetRef.current?.focus();
    document.execCommand("createLink", false, url);
  };

  const insertImage = () => {
    const url = window.prompt("Enter the image URL");
    if (!url) {
      return;
    }

    targetRef.current?.focus();
    document.execCommand("insertImage", false, url);
  };

  const embedMedia = () => {
    const url = window.prompt("Paste a YouTube or media embed URL");
    if (!url || !targetRef.current) {
      return;
    }

    targetRef.current.focus();
    document.execCommand(
      "insertHTML",
      false,
      `<p><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></p>`
    );
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
      <button
        className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold"
        onClick={insertLink}
        type="button"
      >
        Link
      </button>
      <button
        className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold"
        onClick={insertImage}
        type="button"
      >
        Image
      </button>
      <button
        className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold"
        onClick={embedMedia}
        type="button"
      >
        Media
      </button>
    </div>
  );
}

export default RichTextToolbar;
