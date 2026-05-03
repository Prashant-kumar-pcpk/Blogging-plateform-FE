import { useState } from "react";
import { Link } from "react-router-dom";

import FilterPill from "../components/common/FilterPill";
import StatCard from "../components/common/StatCard";
import { stripHtml } from "../utils/postHelpers";

function HomePage({ appState }) {
  const { posts, categories, tags, subscriptions, user } = appState;
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTag, setActiveTag] = useState("all");

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      !search ||
      [post.title, post.excerpt, post.content].some((value) =>
        (value || "").toLowerCase().includes(search.toLowerCase())
      );
    const matchesCategory =
      activeCategory === "all" || post.categories.some((category) => category._id === activeCategory);
    const matchesTag = activeTag === "all" || post.tags.some((tag) => tag._id === activeTag);

    return matchesSearch && matchesCategory && matchesTag;
  });

  const featuredPost = filteredPosts[0];

  return (
    <>
      <section className="grid gap-6 rounded-[2rem] bg-gradient-to-br from-ink via-slate-800 to-teal-800 p-8 text-white shadow-card lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-5">
          <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-mint">
            Publishing suite
          </span>
          <h1 className="max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
            Write, measure, and grow a modern blogging community from one dashboard.
          </h1>
          <p className="max-w-2xl text-base text-white/75">
            Rich text publishing, subscriptions, moderation, analytics, taxonomy management, and social sharing are all wired into this platform.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="rounded-full bg-coral px-5 py-3 font-semibold text-white" to={user ? "/editor" : "/auth/login"}>
              {user ? "Create a post" : "Start publishing"}
            </Link>
            <Link className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white" to={user ? "/dashboard" : "/auth/login"}>
              View dashboard
            </Link>
          </div>
        </div>
        <div className="grid gap-4 rounded-[1.5rem] bg-white/10 p-6 backdrop-blur">
          <StatCard label="Published posts" value={posts.length} />
          <StatCard label="Categories" value={categories.length} />
          <StatCard label="Tags" value={tags.length} />
          <StatCard label="Subscriptions" value={subscriptions.length} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_2.1fr]">
        <aside className="space-y-6 rounded-[2rem] bg-white p-6 shadow-card">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Discover</p>
            <h2 className="mt-2 font-display text-3xl">Filters</h2>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Search posts</span>
            <input
              className="w-full rounded-2xl border border-ink/10 px-4 py-3 outline-none focus:border-coral"
              placeholder="Search stories or topics"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div>
            <p className="mb-3 text-sm font-semibold">Categories</p>
            <div className="flex flex-wrap gap-2">
              <FilterPill active={activeCategory === "all"} onClick={() => setActiveCategory("all")}>
                All
              </FilterPill>
              {categories.map((category) => (
                <FilterPill
                  key={category._id}
                  active={activeCategory === category._id}
                  onClick={() => setActiveCategory(category._id)}
                >
                  {category.name}
                </FilterPill>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Tags</p>
            <div className="flex flex-wrap gap-2">
              <FilterPill active={activeTag === "all"} onClick={() => setActiveTag("all")}>
                All
              </FilterPill>
              {tags.map((tag) => (
                <FilterPill key={tag._id} active={activeTag === tag._id} onClick={() => setActiveTag(tag._id)}>
                  #{tag.name}
                </FilterPill>
              ))}
            </div>
          </div>
          {featuredPost ? (
            <div className="rounded-[1.5rem] bg-mint p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Featured</p>
              <h3 className="mt-2 font-display text-2xl">{featuredPost.title}</h3>
              <p className="mt-3 text-sm text-ink/70">{featuredPost.excerpt}</p>
              <Link className="mt-4 inline-flex font-semibold text-coral" to={`/posts/${featuredPost.slug}`}>
                Read story
              </Link>
            </div>
          ) : null}
        </aside>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredPosts.map((post) => (
            <article key={post._id} className="flex flex-col rounded-[2rem] bg-white p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-ink/40">
                <span>{post.author?.name}</span>
                <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="font-display text-2xl">{post.title}</h3>
              <p className="mt-3 line-clamp-4 text-sm text-ink/70">
                {post.excerpt || stripHtml(post.content).slice(0, 140)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {post.categories.map((category) => (
                  <span key={category._id} className="rounded-full bg-smoke px-3 py-1 text-xs font-semibold">
                    {category.name}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between text-sm text-ink/60">
                <span>{post.analytics?.views || 0} views</span>
                <span>{post.analytics?.likes || 0} likes</span>
              </div>
              <Link className="mt-5 inline-flex rounded-full bg-ink px-4 py-3 text-sm font-semibold text-sand" to={`/posts/${post.slug}`}>
                Open post
              </Link>
            </article>
          ))}
        </section>
      </section>
    </>
  );
}

export default HomePage;
