import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiFetch } from "../api/api";

function AuthorPage({ appState }) {
  const { username } = useParams();
  const { token } = appState;
  const [data, setData] = useState(null);

  useEffect(() => {
    apiFetch(`/users/author/${username}`, { token })
      .then(setData)
      .catch(() => setData(null));
  }, [username, token]);

  if (!data) {
    return <div className="rounded-[2rem] bg-white p-10 shadow-card">Loading author page...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-8 shadow-card">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Author page</p>
        <h1 className="mt-2 font-display text-5xl">{data.author.name}</h1>
        <p className="mt-4 max-w-3xl text-ink/70">{data.author.bio || "This author has not added a bio yet."}</p>
        <div className="mt-4 flex gap-4 text-sm text-ink/60">
          <span>@{data.author.username}</span>
          <span>{data.author.subscribersCount} subscribers</span>
          <span>{data.posts.length} published posts</span>
        </div>
      </section>
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.posts.map((post) => (
          <article key={post._id} className="rounded-[2rem] bg-white p-5 shadow-card">
            <h2 className="font-display text-2xl">{post.title}</h2>
            <p className="mt-3 text-sm text-ink/70">{post.excerpt}</p>
            <Link className="mt-4 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand" to={`/posts/${post.slug}`}>
              Read post
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}

export default AuthorPage;
