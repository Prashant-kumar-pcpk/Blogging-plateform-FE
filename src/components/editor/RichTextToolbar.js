import { useRef } from "react";

import { escapeHtml, getEmbedHtml, isValidHttpUrl } from "../../utils/postHelpers";

function RichTextToolbar({ targetRef, onContentChange, onMessage }) {
  const imageInputRef = useRef(null);
  const mediaInputRef = useRef(null);

  const focusEditor = () => {
    targetRef.current?.focus();
  };

  const syncContent = () => {
    if (targetRef.current) {
      onContentChange(targetRef.current.innerHTML);
    }
  };

  const runCommand = (command, value = null) => {
    focusEditor();
    document.execCommand(command, false, value);
    syncContent();
  };

  const insertHtml = (html) => {
    if (!targetRef.current) {
      return;
    }

    focusEditor();
    document.execCommand("insertHTML", false, html);
    syncContent();
  };

  const insertLink = () => {
    const url = window.prompt("Enter the link URL");
    if (!url) {
      return;
    }

    if (!isValidHttpUrl(url)) {
      onMessage?.("Use a valid http(s) URL for links.");
      return;
    }

    runCommand("createLink", url.trim());
  };

  const insertImageUrl = () => {
    const url = window.prompt("Enter the image URL");
    if (!url) {
      return;
    }

    if (!isValidHttpUrl(url)) {
      onMessage?.("Use a valid http(s) URL for images.");
      return;
    }

    insertHtml(`
      <figure class="editor-image" contenteditable="false">
        <img src="${escapeHtml(url.trim())}" alt="Inserted media" />
      </figure>
      <p><br></p>
    `);
  };

  const embedMedia = () => {
    const url = window.prompt("Paste a YouTube, Vimeo, video, audio, or media link URL");
    if (!url) {
      return;
    }

    const embedHtml = getEmbedHtml(url);
    if (!embedHtml) {
      onMessage?.("Use a valid http(s) URL for embedded media.");
      return;
    }

    insertHtml(embedHtml);
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read the selected file."));
      reader.readAsDataURL(file);
    });

  const handleLocalImage = async (event) => {
    const [file] = event.target.files || [];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      onMessage?.("Choose an image file such as PNG, JPG, GIF, or WebP.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      insertHtml(`
        <figure class="editor-image" contenteditable="false">
          <img src="${escapeHtml(dataUrl)}" alt="${escapeHtml(file.name)}" />
          <figcaption>${escapeHtml(file.name)}</figcaption>
        </figure>
        <p><br></p>
      `);
    } catch (error) {
      onMessage?.(error.message);
    }
  };

  const handleLocalMedia = async (event) => {
    const [file] = event.target.files || [];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) {
      onMessage?.("Choose a video or audio file to insert multimedia.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const mediaTag = file.type.startsWith("video/")
        ? `
          <video controls preload="metadata">
            <source src="${escapeHtml(dataUrl)}" type="${escapeHtml(file.type)}" />
            Your browser does not support the video tag.
          </video>
        `
        : `
          <audio controls preload="metadata">
            <source src="${escapeHtml(dataUrl)}" type="${escapeHtml(file.type)}" />
            Your browser does not support the audio tag.
          </audio>
        `;

      insertHtml(`
        <figure class="embedded-media" contenteditable="false">
          ${mediaTag}
          <figcaption>${escapeHtml(file.name)}</figcaption>
        </figure>
        <p><br></p>
      `);
    } catch (error) {
      onMessage?.(error.message);
    }
  };

  return (
    <div className="space-y-3 rounded-[1.5rem] bg-smoke p-3">
      <div className="flex flex-wrap gap-2">
        {[
          ["Paragraph", "formatBlock", "<p>"],
          ["H2", "formatBlock", "<h2>"],
          ["H3", "formatBlock", "<h3>"],
          ["Bold", "bold"],
          ["Italic", "italic"],
          ["Underline", "underline"],
          ["Quote", "formatBlock", "<blockquote>"],
          ["Bullet", "insertUnorderedList"],
          ["Numbered", "insertOrderedList"],
        ].map(([label, command, value]) => (
          <button
            key={label}
            className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold"
            onClick={() => runCommand(command, value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold"
          onClick={insertLink}
          type="button"
        >
          Link
        </button>
        <button
          className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold"
          onClick={insertImageUrl}
          type="button"
        >
          Image URL
        </button>
        <button
          className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold"
          onClick={() => imageInputRef.current?.click()}
          type="button"
        >
          Upload image
        </button>
        <button
          className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold"
          onClick={embedMedia}
          type="button"
        >
          Embed media
        </button>
        <button
          className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold"
          onClick={() => mediaInputRef.current?.click()}
          type="button"
        >
          Upload video/audio
        </button>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLocalImage}
      />
      <input
        ref={mediaInputRef}
        type="file"
        accept="video/*,audio/*"
        className="hidden"
        onChange={handleLocalMedia}
      />

      <p className="text-xs text-ink/55">
        Add headings, lists, links, hosted images, local images, YouTube or Vimeo embeds, and direct video or audio files.
      </p>
    </div>
  );
}

export default RichTextToolbar;
