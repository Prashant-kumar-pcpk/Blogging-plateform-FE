import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiFetch } from "../api/api";
import {
  estimateReadTime,
  getConnectedSocialAccounts,
  sharePlatforms,
  stripHtml,
} from "../utils/postHelpers";

const moderationOptions = [
  { value: "visible", label: "Approve" },
  { value: "flagged", label: "Flag" },
  { value: "deleted", label: "Delete" },
];

const formatCommentDate = (value) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const buildShareLink = ({ platform, post, postUrl }) => {
  const title = encodeURIComponent(post.title || "");
  const encodedUrl = encodeURIComponent(postUrl);

  switch (platform) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${title}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(`${post.title} ${postUrl}`)}`;
    case "mail":
      return `mailto:?subject=${title}&body=${encodeURIComponent(
        `${post.excerpt || "Take a look at this post:"}\n\n${postUrl}`
      )}`;
    default:
      return "";
  }
};

const openShareTarget = (platform, shareUrl) => {
  if (!shareUrl) {
    return;
  }

  if (platform === "mail") {
    window.location.href = shareUrl;
    return;
  }

  window.open(shareUrl, "_blank", "noopener,noreferrer,width=720,height=640");
};

function PostDetailsPage({ appState }) {
  const { slug } = useParams();
  const { token, user, posts } = appState;
  const [post, setPost] = useState(null);
  const [viewers, setViewers] = useState([]);
  const [showViewers, setShowViewers] = useState(false);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [moderationNotes, setModerationNotes] = useState({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch(`/posts/${slug}`, { token })
      .then(setPost)
      .catch((error) => setMessage(error.message));
  }, [slug, token]);

  const setCommentInPost = (commentId, updater) => {
    setPost((currentPost) => {
      if (!currentPost) {
        return currentPost;
      }

      return {
        ...currentPost,
        comments: currentPost.comments.map((item) =>
          item._id === commentId ? updater(item) : item
        ),
      };
    });
  };

  const replaceCommentInPost = (nextComment) => {
    setCommentInPost(nextComment._id, () => nextComment);
  };

  const removeCommentFromPost = (commentId) => {
    setPost((currentPost) => {
      if (!currentPost) {
        return currentPost;
      }

      return {
        ...currentPost,
        comments: currentPost.comments.filter((item) => item._id !== commentId),
      };
    });
  };

  const isPostOwner = Boolean(user && post && user._id === post.author._id);
  const connectedSocialAccounts = getConnectedSocialAccounts(user);
  const readTime = estimateReadTime(post?.content || "");
  const relatedPosts = posts
    .filter(
      (item) =>
        item.slug !== post?.slug &&
        item.status === "published" &&
        (item.categories.some((category) =>
          post?.categories.some((currentCategory) => currentCategory._id === category._id)
        ) ||
          item.tags.some((tag) => post?.tags.some((currentTag) => currentTag._id === tag._id)))
    )
    .slice(0, 3);

  const submitComment = async () => {
    if (!comment.trim()) {
      setMessage("Write a comment before posting.");
      return;
    }

    try {
      setSubmitting(true);
      const newComment = await apiFetch("/comments", {
        token,
        method: "POST",
        body: { postId: post._id, content: comment },
      });
      setPost((currentPost) => ({
        ...currentPost,
        comments: [...currentPost.comments, newComment],
        analytics: {
          ...currentPost.analytics,
          commentsCount:
            currentPost.analytics.commentsCount + (newComment.status === "visible" ? 1 : 0),
        },
      }));
      setComment("");
      setMessage(
        newComment.status === "flagged"
          ? "Your comment was submitted for moderation because it looked like spam."
          : "Comment posted."
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (item) => {
    setEditingId(item._id);
    setEditingContent(item.content);
    setMessage("");
  };

  const saveCommentEdit = async (commentId) => {
    if (!editingContent.trim()) {
      setMessage("Comment content cannot be empty.");
      return;
    }

    try {
      setSubmitting(true);
      const updatedComment = await apiFetch(`/comments/${commentId}`, {
        token,
        method: "PUT",
        body: { content: editingContent },
      });
      replaceCommentInPost(updatedComment);
      setEditingId("");
      setEditingContent("");
      setMessage(
        updatedComment.status === "flagged"
          ? "Your edited comment is waiting for moderation."
          : "Comment updated."
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      setSubmitting(true);
      await apiFetch(`/comments/${commentId}`, {
        token,
        method: "DELETE",
      });
      removeCommentFromPost(commentId);
      setMessage("Comment deleted.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const moderateComment = async (commentId, status) => {
    try {
      setSubmitting(true);
      const updatedComment = await apiFetch(`/comments/${commentId}/moderate`, {
        token,
        method: "PUT",
        body: {
          status,
          moderationReason: moderationNotes[commentId] || "",
        },
      });

      if (status === "deleted") {
        removeCommentFromPost(commentId);
      } else {
        replaceCommentInPost(updatedComment);
      }

      setModerationNotes((current) => ({ ...current, [commentId]: "" }));
      setMessage(`Comment marked as ${status}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async () => {
    try {
      const data = await apiFetch(`/posts/${post._id}/like`, { token, method: "POST" });
      setPost((currentPost) => ({
        ...currentPost,
        analytics: { ...currentPost.analytics, likes: data.likes },
        liked: data.liked,
      }));
    } catch (error) {
      setMessage(error.message);
    }
  };

  const share = async (platform) => {
    const postUrl = window.location.href;
    const shareUrl = buildShareLink({ platform, post, postUrl });

    openShareTarget(platform, shareUrl);

    try {
      await apiFetch(`/posts/${post._id}/share`, { method: "POST", body: { platform } });
      setMessage(platform === "mail" ? "Mail draft opened." : `Share window opened for ${platform}.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const toggleSubscription = async () => {
    const data = await apiFetch("/subscriptions/toggle", {
      token,
      method: "POST",
      body: { targetType: "author", authorId: post.author._id },
    });
    setPost({ ...post, subscribed: data.subscribed });
  };

  const toggleViewersPanel = async () => {
    if (!isPostOwner) {
      setMessage("Only the post author can see who viewed this post.");
      return;
    }

    if (showViewers) {
      setShowViewers(false);
      return;
    }

    try {
      setLoadingViewers(true);
      const data = await apiFetch(`/posts/${post._id}/viewers`, { token });
      setViewers(data);
      setShowViewers(true);
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingViewers(false);
    }
  };

  if (!post) {
    return <div className="rounded-[2rem] bg-white p-10 shadow-card">{message || "Loading post..."}</div>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
      <article className="rounded-[2rem] bg-white p-8 shadow-card">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            className="mb-8 h-[18rem] w-full rounded-[1.75rem] object-cover sm:h-[24rem]"
          />
        ) : null}
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-ink/50">
          {post.categories.map((category) => (
            <span key={category._id} className="rounded-full bg-smoke px-3 py-1 font-semibold">
              {category.name}
            </span>
          ))}
        </div>
        <h1 className="font-display text-5xl leading-tight">{post.title}</h1>
        <p className="mt-4 text-lg text-ink/70">{post.excerpt}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-ink/10 py-4 text-sm text-ink/60">
          <Link className="font-semibold text-ink" to={`/authors/${post.author.username}`}>
            {post.author.name}
          </Link>
          <span>{readTime} min read</span>
          <button
            className={`rounded-full px-3 py-1 text-left transition ${
              isPostOwner ? "bg-smoke font-semibold text-ink hover:bg-mint/40" : ""
            }`}
            onClick={toggleViewersPanel}
            type="button"
          >
            {loadingViewers ? "Loading viewers..." : `${post.analytics.views} views`}
          </button>
          <span>{post.analytics.likes} likes</span>
          <span>{post.analytics.commentsCount} comments</span>
        </div>
        {showViewers ? (
          <div className="mt-4 rounded-[1.5rem] bg-smoke p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">People who viewed this post</p>
              <button
                className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold"
                onClick={() => setShowViewers(false)}
                type="button"
              >
                Close
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {viewers.length ? (
                viewers.map((viewer) => (
                  <div
                    key={`${viewer._id}-${viewer.viewedAt}`}
                    className="flex items-center justify-between gap-3 rounded-[1rem] bg-white px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-ink">{viewer.name}</p>
                      <p className="text-ink/50">@{viewer.username}</p>
                    </div>
                    <span className="text-xs text-ink/45">
                      {formatCommentDate(viewer.viewedAt)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-ink/60">No logged-in viewers recorded yet.</p>
              )}
            </div>
          </div>
        ) : null}
        <div className="prose prose-slate mt-8 max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag._id} className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold">
              #{tag.name}
            </span>
          ))}
        </div>
      </article>

      <aside className="space-y-6">
        <section className="rounded-[2rem] bg-white p-6 shadow-card">
          <h2 className="font-display text-3xl">Share on Social-Media</h2>
          {user ? (
            <div className="mt-4 rounded-[1.25rem] bg-smoke p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/45">
                Logged in with
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">{user.email}</p>
              {connectedSocialAccounts.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {connectedSocialAccounts.map((account) => (
                    <span
                      key={`${account.key}-${account.value}`}
                      className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink/70"
                    >
                      {account.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {sharePlatforms.map((platform) => (
              <button
                key={platform}
                className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold"
                onClick={() => share(platform)}
                type="button"
              >
                {platform}
              </button>
            ))}
          </div>
          {!user ? (
            <p className="mt-3 text-sm text-ink/50">
              Log in with your email to see your connected social accounts here.
            </p>
          ) : null}
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-card">
          <h2 className="font-display text-3xl">Engagement</h2>
          <div className="mt-4 flex gap-2">
            <button
              className={`rounded-full px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 ${
                post.liked ? "bg-emerald-600" : "bg-coral"
              }`}
              onClick={toggleLike}
              disabled={!user}
              type="button"
            >
              {post.liked ? "Liked" : "Like post"}
            </button>
            <button
              className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-sand disabled:opacity-50"
              onClick={toggleSubscription}
              disabled={!user}
              type="button"
            >
              {post.subscribed ? "Unsubscribe" : "Subscribe"}
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-[1.5rem] bg-smoke p-4 text-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink/40">Likes</p>
              <p className="mt-2 font-display text-3xl text-ink">{post.analytics.likes}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink/40">Shares</p>
              <p className="mt-2 font-display text-3xl text-ink">
                {Object.values(post.analytics.shares || {}).reduce((sum, value) => sum + value, 0)}
              </p>
            </div>
          </div>
          {!user ? <p className="mt-3 text-sm text-ink/50">Log in to like, comment, or subscribe.</p> : null}
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-3xl">Comments</h2>
            <span className="rounded-full bg-smoke px-3 py-1 text-xs font-semibold text-ink/60">
              {post.comments.length} shown
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {post.comments.map((item) => {
              const isCommentOwner = Boolean(user && item.author?._id === user._id);
              const canDelete = isCommentOwner || isPostOwner;
              const canModerate = isPostOwner && item.status !== "deleted";

              return (
                <div key={item._id} className="rounded-[1.5rem] bg-smoke p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div>
                      <span className="font-semibold">{item.author?.name}</span>
                      <span className="ml-2 text-ink/40">{formatCommentDate(item.updatedAt)}</span>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "visible"
                          ? "bg-mint/30 text-ink"
                          : "bg-coral/20 text-coral"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {editingId === item._id ? (
                    <div className="mt-3 space-y-3">
                      <textarea
                        className="min-h-28 w-full rounded-[1.5rem] border border-ink/10 px-4 py-3"
                        value={editingContent}
                        onChange={(event) => setEditingContent(event.target.value)}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand"
                          onClick={() => saveCommentEdit(item._id)}
                          disabled={submitting}
                          type="button"
                        >
                          Save
                        </button>
                        <button
                          className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold"
                          onClick={() => {
                            setEditingId("");
                            setEditingContent("");
                          }}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-ink/70">{item.content}</p>
                  )}

                  {item.moderationReason ? (
                    <p className="mt-3 text-xs font-medium text-coral">{item.moderationReason}</p>
                  ) : null}

                  {(isCommentOwner || canDelete || canModerate) && editingId !== item._id ? (
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {isCommentOwner && item.status !== "deleted" ? (
                          <button
                            className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold"
                            onClick={() => startEditing(item)}
                            type="button"
                          >
                            Edit
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            className="rounded-full border border-coral/30 px-4 py-2 text-sm font-semibold text-coral"
                            onClick={() => deleteComment(item._id)}
                            disabled={submitting}
                            type="button"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>

                      {canModerate ? (
                        <div className="rounded-[1.25rem] border border-ink/10 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/40">
                            Moderation
                          </p>
                          <textarea
                            className="mt-3 min-h-20 w-full rounded-[1rem] border border-ink/10 px-3 py-2 text-sm"
                            placeholder="Optional moderation note"
                            value={moderationNotes[item._id] || ""}
                            onChange={(event) =>
                              setModerationNotes((current) => ({
                                ...current,
                                [item._id]: event.target.value,
                              }))
                            }
                          />
                          <div className="mt-3 flex flex-wrap gap-2">
                            {moderationOptions.map((option) => (
                              <button
                                key={option.value}
                                className="rounded-full border border-ink/10 px-3 py-2 text-xs font-semibold"
                                onClick={() => moderateComment(item._id, option.value)}
                                disabled={submitting}
                                type="button"
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {!post.comments.length ? (
              <p className="rounded-[1.5rem] bg-smoke p-4 text-sm text-ink/60">
                No comments yet. Start the conversation.
              </p>
            ) : null}
          </div>
          {user ? (
            <div className="mt-4 space-y-3">
              <textarea
                className="min-h-28 w-full rounded-[1.5rem] border border-ink/10 px-4 py-3"
                placeholder="Add a thoughtful comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
              <button
                className="w-full rounded-2xl bg-ink px-4 py-3 font-semibold text-sand disabled:opacity-50"
                onClick={submitComment}
                disabled={submitting}
                type="button"
              >
                Post comment
              </button>
            </div>
          ) : null}
        </section>
        {relatedPosts.length ? (
          <section className="rounded-[2rem] bg-white p-6 shadow-card">
            <h2 className="font-display text-3xl">Related posts</h2>
            <div className="mt-4 space-y-3">
              {relatedPosts.map((item) => (
                <Link
                  key={item._id}
                  className="block rounded-[1.25rem] bg-smoke p-4 transition hover:bg-mint/25"
                  to={`/posts/${item.slug}`}
                >
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="mt-2 text-sm text-ink/60">
                    {item.excerpt || stripHtml(item.content).slice(0, 110)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        {message ? <div className="rounded-[1.5rem] bg-mint px-4 py-3 text-sm">{message}</div> : null}
      </aside>
    </div>
  );
}

export default PostDetailsPage;
