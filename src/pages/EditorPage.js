import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { apiFetch } from "../api/api";
import FilterPill from "../components/common/FilterPill";
import InputField from "../components/common/InputField";
import RichTextToolbar from "../components/editor/RichTextToolbar";
import {
  countWords,
  escapeHtml,
  estimateReadTime,
  getEmbedHtml,
  isValidHttpUrl,
  slugifyPreview,
  stripHtml,
  toggleId,
} from "../utils/postHelpers";

function EditorPage({ appState }) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { posts, categories, tags, token, refresh } = appState;
  const existingPost = posts.find((post) => post._id === postId);
  const editorRef = useRef(null);
  const [form, setForm] = useState({
    title: existingPost?.title || "",
    excerpt: existingPost?.excerpt || "",
    coverImage: existingPost?.coverImage || "",
    content: existingPost?.content || "<p>Start writing here...</p>",
    status: existingPost?.status || "draft",
    categories: existingPost?.categories?.map((item) => item._id) || [],
    tags: existingPost?.tags?.map((item) => item._id) || [],
  });
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [activePanel, setActivePanel] = useState("write");
  const [assetForm, setAssetForm] = useState({
    imageUrl: "",
    mediaUrl: "",
    caption: "",
  });

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== form.content) {
      editorRef.current.innerHTML = form.content;
    }
  }, [form.content]);

  const content = editorRef.current?.innerHTML || form.content;
  const plainContent = stripHtml(content);
  const wordCount = countWords(content);
  const readTime = estimateReadTime(content);
  const slugPreview = slugifyPreview(form.title) || "your-story-slug";

  const validate = (status) => {
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = "Title is required.";
    } else if (form.title.trim().length < 8) {
      nextErrors.title = "Use a title with at least 8 characters.";
    }

    if (!form.excerpt.trim()) {
      nextErrors.excerpt = "Excerpt is required.";
    } else if (form.excerpt.trim().length < 20) {
      nextErrors.excerpt = "Write a slightly longer excerpt for readers.";
    }

    if (!plainContent) {
      nextErrors.content = "Post content is required.";
    } else if (plainContent.length < 50) {
      nextErrors.content = "Write at least a short paragraph before saving.";
    }

    if (status === "published" && !form.categories.length) {
      nextErrors.categories = "Add at least one category before publishing.";
    }

    if (status === "published" && !form.tags.length) {
      nextErrors.tags = "Add at least one tag before publishing.";
    }

    if (form.coverImage && !/^https?:\/\//i.test(form.coverImage.trim())) {
      nextErrors.coverImage = "Cover image must be a valid http(s) URL.";
    }

    return nextErrors;
  };

  const updateContent = (nextContent) => {
    setForm((current) => ({ ...current, content: nextContent }));
  };

  const insertHtml = (html) => {
    if (!editorRef.current) {
      return;
    }

    editorRef.current.focus();
    document.execCommand("insertHTML", false, html);
    updateContent(editorRef.current.innerHTML);
    setActivePanel("write");
  };

  const insertHostedImage = () => {
    if (!isValidHttpUrl(assetForm.imageUrl)) {
      setMessage("Use a valid http(s) URL for the image.");
      return;
    }

    const captionHtml = assetForm.caption.trim()
      ? `<figcaption>${escapeHtml(assetForm.caption.trim())}</figcaption>`
      : "";

    insertHtml(`
      <figure class="editor-image" contenteditable="false">
        <img src="${escapeHtml(assetForm.imageUrl.trim())}" alt="${escapeHtml(assetForm.caption.trim() || "Embedded image")}" />
        ${captionHtml}
      </figure>
      <p><br></p>
    `);
    setAssetForm((current) => ({ ...current, imageUrl: "", caption: "" }));
    setMessage("Image inserted into the editor.");
  };

  const insertHostedMedia = () => {
    const embedHtml = getEmbedHtml(assetForm.mediaUrl);
    if (!embedHtml) {
      setMessage("Use a valid media URL such as YouTube, Vimeo, mp4, mp3, or another http(s) link.");
      return;
    }

    insertHtml(embedHtml);
    setAssetForm((current) => ({ ...current, mediaUrl: "" }));
    setMessage("Media block inserted into the editor.");
  };

  const submit = async (status) => {
    const nextErrors = validate(status);
    setErrors(nextErrors);
    setMessage("");

    if (Object.keys(nextErrors).length) {
      setMessage("Fix the highlighted fields before continuing.");
      return;
    }

    const payload = { ...form, content, status };
    const path = existingPost ? `/posts/${existingPost._id}` : "/posts";
    const method = existingPost ? "PUT" : "POST";

    try {
      setSubmitting(true);
      await apiFetch(path, { token, method, body: payload });
      await refresh();
      setMessage(status === "draft" ? "Draft saved" : "Post published");
      navigate("/dashboard");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
      <div className="rounded-[2rem] bg-white p-6 shadow-card">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Rich text editor</p>
            <h1 className="mt-2 font-display text-4xl">{existingPost ? "Edit post" : "Create post"}</h1>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-full border border-ink/10 px-4 py-2 font-semibold disabled:opacity-50"
              onClick={() => submit("draft")}
              type="button"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save draft"}
            </button>
            <button
              className="rounded-full bg-coral px-4 py-2 font-semibold text-white disabled:opacity-50"
              onClick={() => submit("published")}
              type="button"
              disabled={submitting}
            >
              Publish
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 rounded-[1.5rem] bg-smoke p-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink/40">Words</p>
              <p className="mt-2 font-display text-3xl">{wordCount}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink/40">Read time</p>
              <p className="mt-2 font-display text-3xl">{readTime} min</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink/40">Slug preview</p>
              <p className="mt-2 truncate text-sm font-semibold text-ink/75">/posts/{slugPreview}</p>
            </div>
          </div>
          <InputField
            label="Title"
            value={form.title}
            onChange={(value) => setForm({ ...form, title: value })}
            error={errors.title}
            required
            maxLength={120}
            placeholder="A clear, specific title works best"
          />
          <InputField
            label="Excerpt"
            value={form.excerpt}
            onChange={(value) => setForm({ ...form, excerpt: value })}
            error={errors.excerpt}
            required
            maxLength={220}
            placeholder="Summarize what readers will learn"
          />
          <InputField
            label="Cover image URL"
            value={form.coverImage}
            onChange={(value) => setForm({ ...form, coverImage: value })}
            error={errors.coverImage}
            placeholder="https://example.com/cover.jpg"
          />
          <div className="flex gap-2">
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold ${activePanel === "write" ? "bg-ink text-sand" : "bg-smoke text-ink"}`}
              onClick={() => setActivePanel("write")}
              type="button"
            >
              Write
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold ${activePanel === "preview" ? "bg-ink text-sand" : "bg-smoke text-ink"}`}
              onClick={() => setActivePanel("preview")}
              type="button"
            >
              Preview
            </button>
          </div>
          <RichTextToolbar
            targetRef={editorRef}
            onContentChange={updateContent}
            onMessage={setMessage}
          />
          {activePanel === "write" ? (
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className={`editor-canvas min-h-[420px] rounded-[1.5rem] border px-5 py-4 outline-none ${
                errors.content ? "border-coral" : "border-ink/10"
              }`}
              onInput={(event) => setForm({ ...form, content: event.currentTarget.innerHTML })}
            />
          ) : (
            <div
              className="editor-canvas prose prose-slate min-h-[420px] max-w-none rounded-[1.5rem] border border-ink/10 px-5 py-4"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
          {errors.content ? <p className="text-sm text-coral">{errors.content}</p> : null}
        </div>
      </div>

      <aside className="space-y-6">
        <section className="rounded-[2rem] bg-white p-6 shadow-card">
          <h2 className="font-display text-3xl">Media studio</h2>
          <div className="mt-4 space-y-4">
            <InputField
              label="Hosted image URL"
              value={assetForm.imageUrl}
              onChange={(value) => setAssetForm((current) => ({ ...current, imageUrl: value }))}
              placeholder="https://example.com/image.jpg"
            />
            <InputField
              label="Optional image caption"
              value={assetForm.caption}
              onChange={(value) => setAssetForm((current) => ({ ...current, caption: value }))}
              placeholder="Explain what readers are seeing"
            />
            <button
              className="w-full rounded-2xl bg-ink px-4 py-3 font-semibold text-sand"
              onClick={insertHostedImage}
              type="button"
            >
              Insert hosted image
            </button>

            <div className="h-px bg-ink/10" />

            <InputField
              label="Media URL"
              value={assetForm.mediaUrl}
              onChange={(value) => setAssetForm((current) => ({ ...current, mediaUrl: value }))}
              placeholder="YouTube, Vimeo, mp4, mp3, or another media link"
            />
            <button
              className="w-full rounded-2xl bg-mint px-4 py-3 font-semibold text-ink"
              onClick={insertHostedMedia}
              type="button"
            >
              Insert media block
            </button>
            <p className="text-sm text-ink/60">
              Use the toolbar for local image, video, and audio uploads. Use this panel for hosted media links and captions.
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-card">
          <h2 className="font-display text-3xl">Categories</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <FilterPill
                key={category._id}
                active={form.categories.includes(category._id)}
                onClick={() => setForm({ ...form, categories: toggleId(form.categories, category._id) })}
              >
                {category.name}
              </FilterPill>
            ))}
          </div>
          {errors.categories ? <p className="mt-3 text-sm text-coral">{errors.categories}</p> : null}
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-card">
          <h2 className="font-display text-3xl">Tags</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <FilterPill
                key={tag._id}
                active={form.tags.includes(tag._id)}
                onClick={() => setForm({ ...form, tags: toggleId(form.tags, tag._id) })}
              >
                #{tag.name}
              </FilterPill>
            ))}
          </div>
          {errors.tags ? <p className="mt-3 text-sm text-coral">{errors.tags}</p> : null}
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-card">
          <h2 className="font-display text-3xl">Publishing notes</h2>
          <ul className="mt-4 space-y-3 text-sm text-ink/70">
            <li>Use drafts to save in-progress writing.</li>
            <li>Add text, headings, lists, links, images, videos, audio, and embedded media from one editor.</li>
            <li>Hosted media works best for large assets; local uploads are embedded directly into the post content.</li>
            <li>Analytics update automatically on views, likes, shares, and comments.</li>
          </ul>
        </section>
        {message ? <div className="rounded-[1.5rem] bg-mint px-4 py-3 text-sm">{message}</div> : null}
      </aside>
    </section>
  );
}

export default EditorPage;
