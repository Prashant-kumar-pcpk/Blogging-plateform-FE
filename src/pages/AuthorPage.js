import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiFetch } from "../api/api";
import { estimateReadTime, getConnectedSocialAccounts, stripHtml } from "../utils/postHelpers";

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function AuthorPage({ appState }) {
  const { username } = useParams();
  const { token, user } = appState;
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch(`/users/author/${username}`, { token })
      .then((response) => {
        setData(response);
        setMessage("");
      })
      .catch((error) => {
        setData(null);
        setMessage(error.message);
      });
  }, [username, token]);

  const toggleSubscription = async () => {
    if (!user || !data?.author?._id) {
      setMessage("Log in to subscribe to this author.");
      return;
    }

    try {
      setBusy(true);
      const response = await apiFetch("/subscriptions/toggle", {
        token,
        method: "POST",
        body: { targetType: "author", authorId: data.author._id },
      });

      setData((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          subscribed: response.subscribed,
          author: {
            ...current.author,
            subscribersCount: Math.max(
              0,
              (current.author.subscribersCount || 0) + (response.subscribed ? 1 : -1)
            ),
          },
        };
      });
      setMessage(response.subscribed ? "Subscribed to this author." : "Unsubscribed from this author.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    return (
      <div className="rounded-[2rem] bg-white p-10 shadow-card">
        {message || "Loading author page..."}
      </div>
    );
  }

  const connectedAccounts = getConnectedSocialAccounts({
    email: data.author.email,
    socialLinks: data.author.socialLinks,
  }).filter((item) => item.key !== "email");

  const isOwnProfile = Boolean(user && user.username === data.author.username);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-ink via-slate-800 to-teal-700 text-white shadow-card">
        <div className="grid gap-8 p-8 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.3em] text-mint/80">Author page</p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.75rem] bg-white/10 text-3xl font-bold text-white">
                {data.author.avatar ? (
                  <img
                    src={data.author.avatar}
                    alt={data.author.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  data.author.name?.slice(0, 1)?.toUpperCase() || "A"
                )}
              </div>
              <div>
                <h1 className="font-display text-5xl">{data.author.name}</h1>
                <p className="mt-2 text-sm text-white/70">@{data.author.username}</p>
              </div>
            </div>
            <p className="max-w-3xl text-base leading-7 text-white/78">
              {data.author.bio || "This author has not added a bio yet."}
            </p>
            <div className="flex flex-wrap gap-3">
              {isOwnProfile ? (
                <Link className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white" to="/dashboard">
                  Open dashboard
                </Link>
              ) : (
                <button
                  className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  onClick={toggleSubscription}
                  type="button"
                  disabled={busy}
                >
                  {data.subscribed ? "Unsubscribe" : "Subscribe"}
                </button>
              )}
              {isOwnProfile ? (
                <Link className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white" to="/editor">
                  Write a new post
                </Link>
              ) : null}
            </div>
            {connectedAccounts.length ? (
              <div className="flex flex-wrap gap-2">
                {connectedAccounts.map((account) => (
                  <a
                    key={`${account.key}-${account.value}`}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/12"
                    href={account.value}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {account.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur sm:grid-cols-2">
            <AuthorStat label="Published posts" value={data.posts.length} />
            <AuthorStat label="Subscribers" value={data.author.subscribersCount || 0} />
            <AuthorStat label="Total views" value={data.totals.views} />
            <AuthorStat label="Total likes" value={data.totals.likes} />
            <AuthorStat label="Comments" value={data.totals.comments} />
            <AuthorStat label="Shares" value={data.totals.shares} />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Publishing archive</p>
            <h2 className="mt-2 font-display text-3xl">Stories from {data.author.name}</h2>
          </div>
          <span className="rounded-full bg-smoke px-4 py-2 text-sm font-semibold text-ink/60">
            {data.posts.length} live
          </span>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.posts.map((post) => (
            <article key={post._id} className="overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white">
              {post.coverImage ? (
                <img src={post.coverImage} alt={post.title} className="h-48 w-full object-cover" />
              ) : (
                <div className="h-48 bg-gradient-to-br from-mint via-sand to-amber-100" />
              )}
              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-ink/40">
                  <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                  <span>{estimateReadTime(post.content)} min read</span>
                </div>
                <div>
                  <h3 className="font-display text-2xl text-ink">{post.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/65">
                    {post.excerpt || stripHtml(post.content).slice(0, 140)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.categories.map((category) => (
                    <span
                      key={category._id}
                      className="rounded-full bg-smoke px-3 py-1 text-xs font-semibold text-ink/70"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-3 rounded-[1.25rem] bg-smoke p-3 text-center">
                  <CompactStat label="Views" value={post.analytics.views} />
                  <CompactStat label="Likes" value={post.analytics.likes} />
                  <CompactStat label="Comments" value={post.analytics.commentsCount} />
                  <CompactStat
                    label="Shares"
                    value={Object.values(post.analytics.shares || {}).reduce((sum, value) => sum + value, 0)}
                  />
                </div>
                <Link
                  className="inline-flex rounded-full bg-ink px-4 py-3 text-sm font-semibold text-sand"
                  to={`/posts/${post.slug}`}
                >
                  Read post
                </Link>
              </div>
            </article>
          ))}
        </div>

        {!data.posts.length ? (
          <div className="mt-5 rounded-[1.5rem] bg-smoke p-5 text-sm text-ink/60">
            No published posts from this author yet.
          </div>
        ) : null}
      </section>

      {message ? <div className="rounded-[1.5rem] bg-white px-4 py-3 text-sm shadow-card">{message}</div> : null}
    </div>
  );
}

function AuthorStat({ label, value }) {
  return (
    <div className="rounded-[1.25rem] bg-white/10 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/60">{label}</p>
      <p className="mt-2 font-display text-3xl text-white">{value}</p>
    </div>
  );
}

function CompactStat({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-ink/40">{label}</p>
      <p className="mt-2 font-display text-xl text-ink">{value}</p>
    </div>
  );
}

export default AuthorPage;
