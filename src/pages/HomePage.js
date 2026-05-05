import { useState } from "react";
import { Link } from "react-router-dom";

import { apiFetch } from "../api/api";
import FilterPill from "../components/common/FilterPill";
import { estimateReadTime, stripHtml } from "../utils/postHelpers";

function HomePage({ appState }) {
  const { posts, categories, tags, subscriptions, user, token, refresh } = appState;
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTag, setActiveTag] = useState("all");
  const [sortMode, setSortMode] = useState("latest");
  const [message, setMessage] = useState("");

  const filteredPosts = [...posts]
    .filter((post) => {
      const matchesSearch =
        !search ||
        [post.title, post.excerpt, post.content].some((value) =>
          (value || "").toLowerCase().includes(search.toLowerCase())
        );
      const matchesCategory =
        activeCategory === "all" || post.categories.some((category) => category._id === activeCategory);
      const matchesTag = activeTag === "all" || post.tags.some((tag) => tag._id === activeTag);

      return matchesSearch && matchesCategory && matchesTag;
    })
    .sort((a, b) => {
      if (sortMode === "popular") {
        return (b.analytics?.views || 0) - (a.analytics?.views || 0);
      }

      if (sortMode === "discussed") {
        return (b.analytics?.commentsCount || 0) - (a.analytics?.commentsCount || 0);
      }

      return new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt);
    });

  const featuredPost = filteredPosts[0];
  const spotlightPosts = filteredPosts.slice(0, 3);
  const recentPosts = filteredPosts.slice(0, 6);
  const subscribedCategoryIds = subscriptions
    .filter((subscription) => subscription.targetType === "category" && subscription.category?._id)
    .map((subscription) => subscription.category._id);

  const toggleCategorySubscription = async (categoryId) => {
    if (!user) {
      setMessage("Log in to subscribe to categories.");
      return;
    }

    try {
      await apiFetch("/subscriptions/toggle", {
        token,
        method: "POST",
        body: { targetType: "category", categoryId },
      });
      await refresh();
      setMessage("Category subscription updated.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2.5rem] bg-[#f57c00] text-white shadow-card">
        <div className="grid gap-10 px-8 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:py-14">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-white/85">
              Blogger-style publishing
            </span>
            <div className="space-y-4">
              <h1 className="max-w-4xl font-display text-5xl leading-tight sm:text-6xl">
                Publish your passion, your way.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-white/82">
                Build a beautiful blog, share stories with text, images, and multimedia, and grow your audience with subscriptions, analytics, comments, and social sharing.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#f57c00] transition hover:bg-sand"
                to={user ? "/editor" : "/auth/register"}
              >
                {user ? "Create your next post" : "Create your blog"}
              </Link>
              <Link
                className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                to={user ? "/dashboard" : "/auth/login"}
              >
                {user ? "Open dashboard" : "Sign in"}
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HeroMetric label="Published posts" value={posts.length} />
              <HeroMetric label="Topics" value={categories.length + tags.length} />
              <HeroMetric label="Subscriptions" value={subscriptions.length} />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 left-8 h-32 w-32 rounded-full bg-amber-300/20 blur-2xl" />
            <div className="relative rounded-[2rem] bg-[#fff8ef] p-4 text-ink shadow-2xl">
              <div className="rounded-[1.6rem] bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[#f57c00]/70">My blog</p>
                    <h2 className="mt-2 font-display text-3xl text-ink">Notes from the creative desk</h2>
                  </div>
                  <div className="rounded-full bg-[#f57c00]/10 px-3 py-1 text-xs font-semibold text-[#f57c00]">
                    Live editor
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="rounded-[1.25rem] bg-[#fff5e8] p-4">
                    <p className="text-sm font-semibold text-ink">Today&apos;s draft</p>
                    <p className="mt-2 font-display text-2xl text-ink">
                      {featuredPost?.title || "Designing a calmer writing workflow"}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-ink/65">
                      {featuredPost?.excerpt ||
                        "Add rich text, images, video, audio, and embeds from one editor, then publish when the story feels right."}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <MiniPanel
                      title="Audience"
                      value={`${featuredPost?.analytics?.views || 0} views`}
                      note="Track performance post by post"
                    />
                    <MiniPanel
                      title="Comments"
                      value={`${featuredPost?.analytics?.commentsCount || 0} replies`}
                      note="Keep the conversation moving"
                    />
                  </div>

                  <div className="rounded-[1.25rem] bg-ink p-4 text-white">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/55">Why creators stay</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <FeatureChip text="Rich editor" />
                      <FeatureChip text="Social share" />
                      <FeatureChip text="Analytics" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <LandingCard
          eyebrow="Create"
          title="Write with focus"
          text="Draft long-form posts with formatting, links, images, embedded media, and clear publishing controls."
        />
        <LandingCard
          eyebrow="Connect"
          title="Grow your readership"
          text="Turn casual readers into followers with subscriptions, comments, author pages, and category discovery."
        />
        <LandingCard
          eyebrow="Measure"
          title="Understand what works"
          text="Watch views, likes, shares, and discussions so each new post gets smarter than the last."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Featured stories</p>
              <h2 className="mt-2 font-display text-4xl text-ink">Start with what readers love</h2>
            </div>
            <Link className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand" to={user ? "/editor" : "/auth/register"}>
              {user ? "Write now" : "Start your blog"}
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {spotlightPosts.length ? (
              spotlightPosts.map((post, index) => (
                <article
                  key={post._id}
                  className={`overflow-hidden rounded-[1.75rem] ${
                    index === 0 ? "bg-[#fff4e6]" : "bg-smoke"
                  } p-4`}
                >
                  {post.coverImage ? (
                    <img src={post.coverImage} alt={post.title} className="h-44 w-full rounded-[1.2rem] object-cover" />
                  ) : (
                    <div className="h-44 rounded-[1.2rem] bg-gradient-to-br from-[#ffd7a8] via-[#fff0dc] to-[#f9c784]" />
                  )}
                  <p className="mt-4 text-xs uppercase tracking-[0.2em] text-ink/40">{post.author?.name}</p>
                  <h3 className="mt-2 font-display text-2xl text-ink">{post.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/65">
                    {post.excerpt || stripHtml(post.content).slice(0, 135)}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm text-ink/55">
                    <span>{estimateReadTime(post.content)} min read</span>
                    <span>{post.analytics?.views || 0} views</span>
                  </div>
                  <Link className="mt-5 inline-flex text-sm font-semibold text-[#f57c00]" to={`/posts/${post.slug}`}>
                    Read post
                  </Link>
                </article>
              ))
            ) : (
              <div className="rounded-[1.5rem] bg-smoke p-5 text-sm text-ink/60">
                Publish your first story to bring this landing page to life.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] bg-[#fff8ef] p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.3em] text-[#f57c00]/60">Why this platform</p>
          <h2 className="mt-2 font-display text-4xl text-ink">Everything a modern Blogger clone needs</h2>
          <div className="mt-6 space-y-4">
            {[
              "Rich writing tools for articles, galleries, video, and audio.",
              "Categories, tags, comments, moderation, and author pages.",
              "Subscriptions and notifications that keep readers coming back.",
              "Analytics and social sharing built into every post.",
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-[1.3rem] bg-white p-4">
                <span className="mt-1 h-3 w-3 rounded-full bg-[#f57c00]" />
                <p className="text-sm leading-6 text-ink/70">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.92fr_2.08fr]">
        <aside className="space-y-6 rounded-[2rem] bg-white p-6 shadow-card">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Explore blogs</p>
            <h2 className="mt-2 font-display text-3xl">Find your next read</h2>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink">Search posts</span>
            <input
              className="w-full rounded-2xl border border-ink/10 px-4 py-3 outline-none focus:border-[#f57c00]"
              placeholder="Search stories or topics"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div>
            <p className="mb-3 text-sm font-semibold text-ink">Categories</p>
            <div className="flex flex-wrap gap-2">
              <FilterPill active={activeCategory === "all"} onClick={() => setActiveCategory("all")}>
                All
              </FilterPill>
              {categories.map((category) => (
                <div key={category._id} className="flex items-center gap-2">
                  <FilterPill
                    active={activeCategory === category._id}
                    onClick={() => setActiveCategory(category._id)}
                  >
                    {category.name}
                  </FilterPill>
                  <button
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      subscribedCategoryIds.includes(category._id)
                        ? "bg-ink text-sand"
                        : "border border-ink/10 text-ink/60"
                    }`}
                    onClick={() => toggleCategorySubscription(category._id)}
                    type="button"
                  >
                    {subscribedCategoryIds.includes(category._id)
                      ? "Subscribed"
                      : `${category.followersCount || 0} follow`}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-ink">Tags</p>
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

          <div>
            <p className="mb-3 text-sm font-semibold text-ink">Feed order</p>
            <div className="flex flex-wrap gap-2">
              <FilterPill active={sortMode === "latest"} onClick={() => setSortMode("latest")}>
                Latest
              </FilterPill>
              <FilterPill active={sortMode === "popular"} onClick={() => setSortMode("popular")}>
                Popular
              </FilterPill>
              <FilterPill active={sortMode === "discussed"} onClick={() => setSortMode("discussed")}>
                Discussed
              </FilterPill>
            </div>
          </div>

          {featuredPost ? (
            <div className="rounded-[1.5rem] bg-[#fff4e6] p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-[#f57c00]/65">Editor&apos;s pick</p>
              <h3 className="mt-2 font-display text-2xl text-ink">{featuredPost.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink/70">{featuredPost.excerpt}</p>
              <Link className="mt-4 inline-flex font-semibold text-[#f57c00]" to={`/posts/${featuredPost.slug}`}>
                Read story
              </Link>
            </div>
          ) : null}
        </aside>

        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Reader feed</p>
              <h2 className="mt-2 font-display text-4xl text-ink">Fresh posts from across the platform</h2>
            </div>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-card">
              {recentPosts.length} stories shown
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {recentPosts.map((post) => (
              <article key={post._id} className="overflow-hidden rounded-[2rem] bg-white shadow-card">
                {post.coverImage ? (
                  <img src={post.coverImage} alt={post.title} className="h-48 w-full object-cover" />
                ) : (
                  <div className="h-48 bg-gradient-to-br from-[#ffd7a8] via-[#fff2df] to-[#ffe6c7]" />
                )}
                <div className="flex flex-col p-5">
                  <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-ink/40">
                    <span>{post.author?.name}</span>
                    <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-display text-2xl text-ink">{post.title}</h3>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-ink/70">
                    {post.excerpt || stripHtml(post.content).slice(0, 140)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.categories.map((category) => (
                      <span key={category._id} className="rounded-full bg-smoke px-3 py-1 text-xs font-semibold text-ink/70">
                        {category.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between text-sm text-ink/60">
                    <span>{post.analytics?.views || 0} views</span>
                    <span>{estimateReadTime(post.content)} min read</span>
                  </div>
                  <Link
                    className="mt-5 inline-flex rounded-full bg-ink px-4 py-3 text-sm font-semibold text-sand"
                    to={`/posts/${post.slug}`}
                  >
                    Open post
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {!recentPosts.length ? (
            <div className="rounded-[1.5rem] bg-white p-6 text-sm text-ink/60 shadow-card">
              No posts match the current filters yet.
            </div>
          ) : null}
        </section>
      </section>

      <section className="rounded-[2.3rem] bg-ink px-8 py-10 text-white shadow-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-mint/70">Start publishing today</p>
            <h2 className="mt-2 font-display text-4xl">Create a blog that feels like yours from day one.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
              Write your first post, customize your voice with categories and tags, and share it everywhere your readers already are.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white"
              to={user ? "/editor" : "/auth/register"}
            >
              {user ? "Open editor" : "Create your account"}
            </Link>
            <Link
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white"
              to={user ? "/dashboard" : "/auth/login"}
            >
              {user ? "View analytics" : "Sign in"}
            </Link>
          </div>
        </div>
      </section>

      {message ? <div className="rounded-[1.5rem] bg-white px-4 py-3 text-sm shadow-card">{message}</div> : null}
    </div>
  );
}

function HeroMetric({ label, value }) {
  return (
    <div className="rounded-[1.4rem] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.24em] text-white/60">{label}</p>
      <p className="mt-3 font-display text-3xl text-white">{value}</p>
    </div>
  );
}

function MiniPanel({ title, value, note }) {
  return (
    <div className="rounded-[1.2rem] border border-ink/8 bg-smoke p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-ink/35">{title}</p>
      <p className="mt-2 font-display text-2xl text-ink">{value}</p>
      <p className="mt-2 text-sm text-ink/55">{note}</p>
    </div>
  );
}

function FeatureChip({ text }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
      {text}
    </div>
  );
}

function LandingCard({ eyebrow, title, text }) {
  return (
    <article className="rounded-[2rem] bg-white p-6 shadow-card">
      <p className="text-xs uppercase tracking-[0.28em] text-[#f57c00]/70">{eyebrow}</p>
      <h3 className="mt-3 font-display text-3xl text-ink">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-ink/68">{text}</p>
    </article>
  );
}

export default HomePage;
