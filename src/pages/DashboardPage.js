import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiFetch } from "../api/api";
import InputField from "../components/common/InputField";

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function DashboardPage({ appState }) {
  const { token, user, subscriptions, refresh } = appState;
  const [posts, setPosts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [subscriptionFeed, setSubscriptionFeed] = useState([]);
  const [taxonomyItems, setTaxonomyItems] = useState({ categories: [], tags: [] });
  const [profile, setProfile] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
    socialLinks: user?.socialLinks || {},
  });
  const [taxonomyForm, setTaxonomyForm] = useState({
    name: "",
    description: "",
    color: "#0f766e",
    type: "category",
  });
  const [message, setMessage] = useState("");
  const [editingTaxonomy, setEditingTaxonomy] = useState(null);
  const [taxonomyErrors, setTaxonomyErrors] = useState({});
  const [profileErrors, setProfileErrors] = useState({});
  const [isProfileEditing, setIsProfileEditing] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      const [myPosts, dashboardAnalytics, queuedComments, feed, allCategories, allTags] = await Promise.all([
        apiFetch("/posts/mine", { token }),
        apiFetch("/posts/analytics/dashboard", { token }),
        apiFetch("/comments/moderation/queue", { token }),
        apiFetch("/subscriptions/feed", { token }),
        apiFetch("/categories"),
        apiFetch("/tags"),
      ]);
      setPosts(myPosts);
      setAnalytics(dashboardAnalytics);
      setModerationQueue(queuedComments);
      setSubscriptionFeed(feed);
      setTaxonomyItems({ categories: allCategories, tags: allTags });
    };

    loadDashboard().catch((error) => setMessage(error.message));
  }, [token]);

  const moderateComment = async (commentId, status) => {
    const moderationReason =
      status === "visible"
        ? "Approved from dashboard"
        : status === "deleted"
          ? "Removed from dashboard"
          : "Flagged from dashboard";

    const updatedComment = await apiFetch(`/comments/${commentId}/moderate`, {
      token,
      method: "PUT",
      body: { status, moderationReason },
    });

    if (status === "deleted") {
      setModerationQueue((current) => current.filter((item) => item._id !== commentId));
    } else {
      setModerationQueue((current) =>
        current.map((item) => (item._id === commentId ? { ...item, ...updatedComment } : item))
      );
    }

    setMessage(`Comment marked as ${status}`);
    await refresh();
  };

  const updateProfile = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!profile.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (profile.bio && profile.bio.trim().length > 300) {
      nextErrors.bio = "Bio must be 300 characters or less.";
    }

    ["linkedin", "github", "twitter", "facebook", "instagram"].forEach((field) => {
      const value = profile.socialLinks?.[field];
      if (value && !/^https?:\/\//i.test(value.trim())) {
        nextErrors[field] = "Enter a valid http(s) URL.";
      }
    });

    setProfileErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setMessage("Fix the highlighted profile fields before saving.");
      return;
    }

    try {
      const updatedUser = await apiFetch("/users/profile", {
        token,
        method: "PUT",
        body: profile,
      });
      appState.persistSession({ token, user: updatedUser });
      setProfile((current) => ({
        ...current,
        name: updatedUser.name || "",
        bio: updatedUser.bio || "",
        avatar: updatedUser.avatar || "",
        socialLinks: updatedUser.socialLinks || {},
      }));
      setIsProfileEditing(false);
      setMessage("Profile updated");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const createTaxonomy = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!taxonomyForm.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (taxonomyForm.type === "category" && taxonomyForm.color && !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(taxonomyForm.color.trim())) {
      nextErrors.color = "Use a valid hex color like #0f766e.";
    }

    setTaxonomyErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setMessage("Fix the taxonomy form before creating it.");
      return;
    }

    const path = taxonomyForm.type === "category" ? "/categories" : "/tags";
    try {
      await apiFetch(path, {
        token,
        method: "POST",
        body: {
          name: taxonomyForm.name.trim(),
          description: taxonomyForm.description.trim(),
          color: taxonomyForm.type === "category" ? taxonomyForm.color.trim() : undefined,
        },
      });
      setTaxonomyForm({ ...taxonomyForm, name: "", description: "" });
      await refresh();
      const [allCategories, allTags] = await Promise.all([apiFetch("/categories"), apiFetch("/tags")]);
      setTaxonomyItems({ categories: allCategories, tags: allTags });
      setTaxonomyErrors({});
      setMessage(`${taxonomyForm.type} created`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const startTaxonomyEdit = (type, item) => {
    setEditingTaxonomy({
      type,
      id: item._id,
      name: item.name,
      description: item.description || "",
      color: item.color || "#0f766e",
    });
    setMessage("");
  };

  const saveTaxonomyEdit = async () => {
    if (!editingTaxonomy) {
      return;
    }

    if (!editingTaxonomy.name.trim()) {
      setMessage("Name is required.");
      return;
    }

    const path = editingTaxonomy.type === "category" ? "/categories" : "/tags";
    try {
      await apiFetch(`${path}/${editingTaxonomy.id}`, {
        token,
        method: "PUT",
        body: {
          name: editingTaxonomy.name.trim(),
          description: editingTaxonomy.description.trim(),
          color: editingTaxonomy.type === "category" ? editingTaxonomy.color.trim() : undefined,
        },
      });
      const [allCategories, allTags] = await Promise.all([apiFetch("/categories"), apiFetch("/tags")]);
      setTaxonomyItems({ categories: allCategories, tags: allTags });
      setEditingTaxonomy(null);
      await refresh();
      setMessage(`${editingTaxonomy.type} updated`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteTaxonomy = async (type, id) => {
    const path = type === "category" ? "/categories" : "/tags";
    try {
      await apiFetch(`${path}/${id}`, { token, method: "DELETE" });
      const [allCategories, allTags] = await Promise.all([apiFetch("/categories"), apiFetch("/tags")]);
      setTaxonomyItems({ categories: allCategories, tags: allTags });
      await refresh();
      setMessage(`${type} deleted`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const publishedPosts = posts.filter((post) => post.status === "published");
  const draftPosts = posts.filter((post) => post.status === "draft");
  const latestPost = posts[0];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-ink via-slate-600 to-teal-600 text-white shadow-card">
        <div className="grid gap-8 p-8 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-mint/80">
                  Creator studio
                </p>
                <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
                  Build your voice, publish consistently, and track how readers respond.
                </h1>
              </div>
              <Link
                className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white"
                to="/editor"
              >
                Write a new story
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Published"
                value={analytics?.postsPublished ?? publishedPosts.length}
                tone="light"
              />
              <MetricCard label="Drafts" value={draftPosts.length} tone="light" />
              <MetricCard label="Subscribers" value={subscriptions.length} tone="light" />
              <MetricCard label="Moderation" value={moderationQueue.length} tone="light" />
            </div>

            {latestPost ? (
              <div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-white/60">
                      Most recent story
                    </p>
                    <h2 className="mt-2 font-display text-2xl">{latestPost.title}</h2>
                  </div>
                  <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                    {latestPost.status}
                  </span>
                </div>
                <p className="mt-3 max-w-2xl text-sm text-white/72">
                  {latestPost.excerpt || "Keep refining your latest story and share it with readers."}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/68">
                  <span>{latestPost.analytics.views} views</span>
                  <span>{latestPost.analytics.likes} likes</span>
                  <span>{latestPost.analytics.commentsCount} comments</span>
                  <span>Updated {formatDate(latestPost.updatedAt)}</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.5rem] bg-white/12 text-xl font-bold text-white">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user?.name || "User avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user?.name?.slice(0, 1)?.toUpperCase() || "U"
                )}
              </div>
              <div>
                <p className="font-display text-2xl">{user?.name}</p>
                {/* <p className="text-sm text-white/65">@{user?.username}</p> */}
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-black/15 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-white/55">Creator note</p>
              <p className="mt-3 text-sm leading-6 text-white/76">
                {user?.bio || "Add a bio so readers and collaborators understand your voice and beat."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SoftStat label="Total views" value={analytics?.totals.views ?? 0} />
              <SoftStat label="Total likes" value={analytics?.totals.likes ?? 0} />
              <SoftStat label="Comments" value={analytics?.totals.comments ?? 0} />
              <SoftStat label="Shares" value={analytics?.totals.shares ?? 0} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-6">
          <section className="rounded-[2rem] bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Audience pulse</p>
                <h2 className="mt-2 font-display text-3xl">Performance overview</h2>
              </div>
              <Link
                className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold hover:bg-ink/5"
                to="/editor"
              >
                Start next draft
              </Link>
            </div>

            {analytics ? (
              <>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <AudienceCard label="Views" value={analytics.totals.views} accent="bg-coral" />
                  <AudienceCard label="Likes" value={analytics.totals.likes} accent="bg-mint" />
                  <AudienceCard label="Comments" value={analytics.totals.comments} accent="bg-ink" />
                  <AudienceCard label="Shares" value={analytics.totals.shares} accent="bg-amber-500" />
                </div>

                <div className="mt-6 rounded-[1.75rem] bg-smoke p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-ink/40">
                        Story leaderboard
                      </p>
                      <h3 className="mt-2 font-display text-2xl">Top post performance</h3>
                    </div>
                    <span className="text-sm text-ink/50">
                      {analytics.performance.length} published stories
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    {analytics.performance.length ? (
                      analytics.performance.map((item, index) => (
                        <div key={item.slug} className="rounded-[1.5rem] bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-bold text-sand">
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-semibold text-ink">{item.title}</p>
                                <p className="text-sm text-ink/50">
                                  {item.views} views, {item.likes} likes, {item.comments} comments
                                </p>
                              </div>
                            </div>
                            <Link
                              className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold hover:bg-ink/5"
                              to={`/posts/${item.slug}`}
                            >
                              Open
                            </Link>
                          </div>
                          <div className="mt-4 h-3 rounded-full bg-smoke">
                            <div
                              className="h-3 rounded-full bg-gradient-to-r from-coral to-orange-400"
                              style={{
                                width: `${Math.max(
                                  12,
                                  (item.views / Math.max(analytics.totals.views || 1, 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.5rem] bg-white p-4 text-sm text-ink/60">
                        Publish a story to start seeing audience performance here.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[1.75rem] bg-smoke p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-ink/40">
                      Momentum chart
                    </p>
                    <h3 className="mt-2 font-display text-2xl">Recent publishing performance</h3>
                    <div className="mt-5">
                      <TrendChart items={analytics.recentActivity} />
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] bg-smoke p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-ink/40">
                      Share channels
                    </p>
                    <h3 className="mt-2 font-display text-2xl">Where readers share from</h3>
                    <div className="mt-5 space-y-3">
                      {Object.entries(analytics.totals.shareBreakdown || {}).map(([platform, value]) => (
                        <div key={platform}>
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="font-semibold capitalize text-ink">{platform}</span>
                            <span className="text-ink/55">{value}</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-white">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-coral"
                              style={{
                                width: `${Math.max(
                                  value > 0 ? 12 : 0,
                                  (value / Math.max(analytics.totals.shares || 1, 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Publishing desk</p>
                <h2 className="mt-2 font-display text-3xl">Your stories</h2>
              </div>
              <span className="rounded-full bg-smoke px-4 py-2 text-sm font-semibold text-ink/60">
                {posts.length} total
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              {posts.length ? (
                posts.map((post) => (
                  <article
                    key={post._id}
                    className="rounded-[1.75rem] border border-ink/10 p-5 transition hover:border-ink/20 hover:shadow-card"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                              post.status === "published"
                                ? "bg-mint/30 text-ink"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {post.status}
                          </span>
                          <span className="text-xs uppercase tracking-[0.2em] text-ink/35">
                            Updated {formatDate(post.updatedAt)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-display text-2xl text-ink">{post.title}</h3>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
                            {post.excerpt || "No excerpt added yet. Add one to improve how your story is discovered."}
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
                      </div>

                      <div className="min-w-[220px] rounded-[1.5rem] bg-smoke p-4">
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <MiniMetric label="Views" value={post.analytics.views} />
                          <MiniMetric label="Likes" value={post.analytics.likes} />
                          <MiniMetric
                            label="Comments"
                            value={post.analytics.commentsCount}
                          />
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Link
                            className="flex-1 rounded-full border border-ink/10 px-4 py-2 text-center text-sm font-semibold hover:bg-white"
                            to={`/posts/${post.slug}`}
                          >
                            View
                          </Link>
                          <Link
                            className="flex-1 rounded-full bg-ink px-4 py-2 text-center text-sm font-semibold text-sand"
                            to={`/editor/${post._id}`}
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.75rem] bg-smoke p-6 text-sm text-ink/60">
                  No posts yet. Start your first story and build your dashboard around real readers.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section
            id="profile-settings"
            className="scroll-mt-28 rounded-[2rem] bg-white p-6 shadow-card"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Public identity</p>
                <h2 className="mt-2 font-display text-3xl">Profile studio</h2>
              </div>
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.25rem] bg-smoke">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-ink">
                    {profile.name?.slice(0, 1)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
            </div>

            {isProfileEditing ? (
              <form className="mt-5 space-y-3" onSubmit={updateProfile}>
                <InputField
                  label="Name"
                  value={profile.name}
                  onChange={(value) => setProfile({ ...profile, name: value })}
                  error={profileErrors.name}
                  required
                />
                <InputField
                  label="Bio"
                  value={profile.bio}
                  onChange={(value) => setProfile({ ...profile, bio: value })}
                  error={profileErrors.bio}
                  maxLength={300}
                />
                <InputField
                  label="LinkedIn"
                  value={profile.socialLinks.linkedin || ""}
                  onChange={(value) =>
                    setProfile({ ...profile, socialLinks: { ...profile.socialLinks, linkedin: value } })
                  }
                  error={profileErrors.linkedin}
                />
                <InputField
                  label="GitHub"
                  value={profile.socialLinks.github || ""}
                  onChange={(value) =>
                    setProfile({ ...profile, socialLinks: { ...profile.socialLinks, github: value } })
                  }
                  error={profileErrors.github}
                />
                <InputField
                  label="Twitter"
                  value={profile.socialLinks.twitter || ""}
                  onChange={(value) =>
                    setProfile({ ...profile, socialLinks: { ...profile.socialLinks, twitter: value } })
                  }
                  error={profileErrors.twitter}
                />
                <InputField
                  label="Facebook"
                  value={profile.socialLinks.facebook || ""}
                  onChange={(value) =>
                    setProfile({ ...profile, socialLinks: { ...profile.socialLinks, facebook: value } })
                  }
                  error={profileErrors.facebook}
                />
                <InputField
                  label="Instagram"
                  value={profile.socialLinks.instagram || ""}
                  onChange={(value) =>
                    setProfile({ ...profile, socialLinks: { ...profile.socialLinks, instagram: value } })
                  }
                  error={profileErrors.instagram}
                />
                <div className="flex gap-3">
                  <button
                    className="flex-1 rounded-2xl bg-ink px-4 py-3 font-semibold text-sand"
                    type="submit"
                  >
                    Save profile
                  </button>
                  <button
                    className="rounded-2xl border border-ink/10 px-4 py-3 font-semibold text-ink"
                    onClick={() => {
                      setIsProfileEditing(false);
                      setProfileErrors({});
                      setMessage("");
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-[1.5rem] bg-smoke p-4">
                  <p className="font-semibold text-ink">{profile.name || "Unnamed profile"}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/65">
                    {profile.bio || "No bio added yet."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      ["LinkedIn", profile.socialLinks.linkedin],
                      ["GitHub", profile.socialLinks.github],
                      ["Twitter", profile.socialLinks.twitter],
                      ["Facebook", profile.socialLinks.facebook],
                      ["Instagram", profile.socialLinks.instagram],
                    ]
                      .filter(([, value]) => value)
                      .map(([label, value]) => (
                        <a
                          key={`${label}-${value}`}
                          className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink/70"
                          href={value}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {label}
                        </a>
                      ))}
                  </div>
                </div>
                <button
                  className="w-full rounded-2xl bg-ink px-4 py-3 font-semibold text-sand"
                  onClick={() => {
                    setIsProfileEditing(true);
                    setProfileErrors({});
                    setMessage("");
                  }}
                  type="button"
                >
                  Edit profile
                </button>
              </div>
            )}
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Community care</p>
                <h2 className="mt-2 font-display text-3xl">Comment moderation</h2>
              </div>
              <span className="rounded-full bg-smoke px-4 py-2 text-sm font-semibold text-ink/60">
                {moderationQueue.length} active
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {moderationQueue.length ? (
                moderationQueue.map((item) => (
                  <div key={item._id} className="rounded-[1.5rem] border border-ink/10 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.author?.name || "Unknown user"}</p>
                        <p className="text-sm text-ink/50">
                          On{" "}
                          <Link className="font-semibold text-ink" to={`/posts/${item.post?.slug}`}>
                            {item.post?.title || "Untitled post"}
                          </Link>
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "flagged"
                            ? "bg-coral/20 text-coral"
                            : "bg-mint/30 text-ink"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-ink/70">{item.content}</p>
                    {item.moderationReason ? (
                      <p className="mt-3 text-xs font-medium text-coral">{item.moderationReason}</p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold"
                        onClick={() => moderateComment(item._id, "visible")}
                        type="button"
                      >
                        Approve
                      </button>
                      <button
                        className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold"
                        onClick={() => moderateComment(item._id, "flagged")}
                        type="button"
                      >
                        Flag
                      </button>
                      <button
                        className="rounded-full border border-coral/30 px-4 py-2 text-sm font-semibold text-coral"
                        onClick={() => moderateComment(item._id, "deleted")}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] bg-smoke p-4 text-sm text-ink/60">
                  No comments need moderation right now.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Notifications</p>
            <h2 className="mt-2 font-display text-3xl">Subscription feed</h2>
            <div className="mt-5 space-y-3">
              {subscriptionFeed.length ? (
                subscriptionFeed.map((item) => (
                  <div key={item._id} className="rounded-[1.5rem] bg-smoke p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{item.title}</p>
                        <p className="text-sm text-ink/55">
                          {item.notificationType === "author"
                            ? `New post from ${item.author?.name || "an author"}`
                            : `Update in ${item.categories?.[0]?.name || "a subscribed category"}`}
                        </p>
                      </div>
                      <Link
                        className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold"
                        to={`/posts/${item.slug}`}
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] bg-smoke p-4 text-sm text-ink/60">
                  Subscribe to authors or categories to see new-post notifications here.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Taxonomy lab</p>
            <h2 className="mt-2 font-display text-3xl">Categories and tags</h2>
            <form className="mt-5 space-y-3" onSubmit={createTaxonomy}>
              <select
                className="w-full rounded-2xl border border-ink/10 px-4 py-3"
                value={taxonomyForm.type}
                onChange={(event) => setTaxonomyForm({ ...taxonomyForm, type: event.target.value })}
              >
                <option value="category">Category</option>
                <option value="tag">Tag</option>
              </select>
              <InputField
                label="Name"
                value={taxonomyForm.name}
                onChange={(value) => setTaxonomyForm({ ...taxonomyForm, name: value })}
                error={taxonomyErrors.name}
                required
              />
              <InputField
                label="Description"
                value={taxonomyForm.description}
                onChange={(value) => setTaxonomyForm({ ...taxonomyForm, description: value })}
              />
              {taxonomyForm.type === "category" ? (
                <InputField
                  label="Color"
                  value={taxonomyForm.color}
                  onChange={(value) => setTaxonomyForm({ ...taxonomyForm, color: value })}
                  error={taxonomyErrors.color}
                  placeholder="#0f766e"
                />
              ) : null}
              <button
                className="w-full rounded-2xl bg-mint px-4 py-3 font-semibold text-ink"
                type="submit"
              >
                Create {taxonomyForm.type}
              </button>
            </form>

            {editingTaxonomy ? (
              <div className="mt-5 rounded-[1.5rem] border border-ink/10 p-4">
                <p className="text-sm font-semibold text-ink">Editing {editingTaxonomy.type}</p>
                <div className="mt-3 space-y-3">
                  <InputField
                    label="Name"
                    value={editingTaxonomy.name}
                    onChange={(value) => setEditingTaxonomy({ ...editingTaxonomy, name: value })}
                  />
                  <InputField
                    label="Description"
                    value={editingTaxonomy.description}
                    onChange={(value) => setEditingTaxonomy({ ...editingTaxonomy, description: value })}
                  />
                  {editingTaxonomy.type === "category" ? (
                    <InputField
                      label="Color"
                      value={editingTaxonomy.color}
                      onChange={(value) => setEditingTaxonomy({ ...editingTaxonomy, color: value })}
                    />
                  ) : null}
                  <div className="flex gap-2">
                    <button
                      className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand"
                      onClick={saveTaxonomyEdit}
                      type="button"
                    >
                      Save
                    </button>
                    <button
                      className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold"
                      onClick={() => setEditingTaxonomy(null)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-ink">Categories</p>
                <div className="mt-3 space-y-2">
                  {taxonomyItems.categories.map((category) => (
                    <div key={category._id} className="flex items-center justify-between gap-3 rounded-[1.25rem] bg-smoke p-3">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.name}
                      </span>
                      <div className="flex gap-2">
                        <button className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold" onClick={() => startTaxonomyEdit("category", category)} type="button">
                          Edit
                        </button>
                        <button className="rounded-full border border-coral/30 px-3 py-1 text-xs font-semibold text-coral" onClick={() => deleteTaxonomy("category", category._id)} type="button">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-ink">Tags</p>
                <div className="mt-3 space-y-2">
                  {taxonomyItems.tags.map((tag) => (
                    <div key={tag._id} className="flex items-center justify-between gap-3 rounded-[1.25rem] bg-smoke p-3">
                      <span className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink/75">
                        #{tag.name}
                      </span>
                      <div className="flex gap-2">
                        <button className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold" onClick={() => startTaxonomyEdit("tag", tag)} type="button">
                          Edit
                        </button>
                        <button className="rounded-full border border-coral/30 px-3 py-1 text-xs font-semibold text-coral" onClick={() => deleteTaxonomy("tag", tag._id)} type="button">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Network</p>
            <h2 className="mt-2 font-display text-3xl">Subscriptions</h2>
            <div className="mt-4 space-y-3">
              {subscriptions.length ? (
                subscriptions.map((subscription) => (
                  <div key={subscription._id} className="rounded-[1.5rem] bg-smoke p-4 text-sm">
                    {subscription.targetType === "author"
                      ? `Author: ${subscription.author?.name || "Unknown"}`
                      : `Category: ${subscription.category?.name || "Unknown"}`}
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] bg-smoke p-4 text-sm text-ink/60">
                  You are not subscribed to any authors or categories yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {message ? (
        <div className="rounded-[1.5rem] bg-ink px-4 py-3 text-sm text-white">
          {message}
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value, tone = "light" }) {
  return (
    <div
      className={`rounded-[1.5rem] p-4 ${
        tone === "light" ? "bg-white/10 text-white" : "bg-white text-ink"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.25em] opacity-70">{label}</p>
      <p className="mt-3 font-display text-3xl">{value}</p>
    </div>
  );
}

function SoftStat({ label, value }) {
  return (
    <div className="rounded-[1.25rem] bg-white/8 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-white/55">{label}</p>
      <p className="mt-2 font-display text-2xl text-white">{value}</p>
    </div>
  );
}

function AudienceCard({ label, value, accent }) {
  return (
    <div className="rounded-[1.5rem] border border-ink/10 bg-smoke p-4">
      <div className={`h-2 w-14 rounded-full ${accent}`} />
      <p className="mt-4 text-xs uppercase tracking-[0.24em] text-ink/40">{label}</p>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-ink/40">{label}</p>
      <p className="mt-2 font-display text-2xl text-ink">{value}</p>
    </div>
  );
}

function TrendChart({ items }) {
  if (!items?.length) {
    return (
      <div className="rounded-[1.5rem] bg-white p-4 text-sm text-ink/60">
        Publish a few stories to unlock trend visualizations here.
      </div>
    );
  }

  const maxValue = Math.max(
    ...items.flatMap((item) => [item.views, item.likes, item.comments, item.shares]),
    1
  );

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.slug} className="rounded-[1.25rem] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="max-w-[14rem] truncate text-sm font-semibold text-ink">{item.title}</p>
            <span className="text-xs text-ink/45">{formatDate(item.publishedAt)}</span>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { label: "Views", value: item.views, tone: "from-coral to-orange-400" },
              { label: "Likes", value: item.likes, tone: "from-emerald-400 to-teal-500" },
              { label: "Comments", value: item.comments, tone: "from-slate-700 to-slate-500" },
              { label: "Shares", value: item.shares, tone: "from-amber-400 to-yellow-500" },
            ].map((metric) => (
              <div key={`${item.slug}-${metric.label}`}>
                <div className="flex items-center justify-between gap-3 text-xs text-ink/55">
                  <span>{metric.label}</span>
                  <span>{metric.value}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-smoke">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${metric.tone}`}
                    style={{ width: `${Math.max(metric.value > 0 ? 10 : 0, (metric.value / maxValue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default DashboardPage;
