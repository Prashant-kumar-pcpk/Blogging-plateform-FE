import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { apiFetch } from "../api/api";
import FilterPill from "../components/common/FilterPill";
import InputField from "../components/common/InputField";
import RichTextToolbar from "../components/editor/RichTextToolbar";
import { toggleId } from "../utils/postHelpers";

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

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== form.content) {
      editorRef.current.innerHTML = form.content;
    }
  }, [form.content]);

  const submit = async (status) => {
    const payload = { ...form, content: editorRef.current?.innerHTML || form.content, status };
    const path = existingPost ? `/posts/${existingPost._id}` : "/posts";
    const method = existingPost ? "PUT" : "POST";
    await apiFetch(path, { token, method, body: payload });
    await refresh();
    setMessage(status === "draft" ? "Draft saved" : "Post published");
    navigate("/dashboard");
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
            <button className="rounded-full border border-ink/10 px-4 py-2 font-semibold" onClick={() => submit("draft")}>
              Save draft
            </button>
            <button className="rounded-full bg-coral px-4 py-2 font-semibold text-white" onClick={() => submit("published")}>
              Publish
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <InputField label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <InputField label="Excerpt" value={form.excerpt} onChange={(value) => setForm({ ...form, excerpt: value })} />
          <InputField label="Cover image URL" value={form.coverImage} onChange={(value) => setForm({ ...form, coverImage: value })} />
          <RichTextToolbar targetRef={editorRef} />
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="min-h-[420px] rounded-[1.5rem] border border-ink/10 px-5 py-4 outline-none"
            onInput={(event) => setForm({ ...form, content: event.currentTarget.innerHTML })}
          />
        </div>
      </div>

      <aside className="space-y-6">
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
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-card">
          <h2 className="font-display text-3xl">Publishing notes</h2>
          <ul className="mt-4 space-y-3 text-sm text-ink/70">
            <li>Use drafts to save in-progress writing.</li>
            <li>Publish when title, excerpt, and content are ready.</li>
            <li>Analytics update automatically on views, likes, shares, and comments.</li>
          </ul>
        </section>
        {message ? <div className="rounded-[1.5rem] bg-mint px-4 py-3 text-sm">{message}</div> : null}
      </aside>
    </section>
  );
}

export default EditorPage;
