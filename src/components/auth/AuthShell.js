import { Link } from "react-router-dom";

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="overflow-hidden rounded-[2.3rem] bg-[#f57c00] text-white shadow-card">
        <div className="space-y-6 p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.34em] text-white/70">Blogger Platform</p>
          <div>
            <h1 className="font-display text-5xl leading-tight">{title}</h1>
            <p className="mt-4 max-w-xl text-base leading-8 text-white/82">{subtitle}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AuthFeature title="Publish fast" text="Create posts with rich text, images, and multimedia." />
            <AuthFeature title="Grow audience" text="Use comments, subscriptions, and social sharing." />
            <AuthFeature title="Measure impact" text="Watch views, likes, shares, and engagement trends." />
            <AuthFeature title="Own your voice" text="Build a blog that looks and feels like yours." />
          </div>

          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link className="rounded-full bg-white px-4 py-2 text-[#f57c00]" to="/auth/login">
              Sign in
            </Link>
            <Link className="rounded-full border border-white/20 px-4 py-2 text-white" to="/auth/register">
              Create account
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-[2.3rem] border border-[#f57c00]/10 bg-white p-8 shadow-card lg:p-10">
        {children}
        {footer ? <div className="mt-6 text-sm text-ink/60">{footer}</div> : null}
      </div>
    </section>
  );
}

function AuthFeature({ title, text }) {
  return (
    <div className="rounded-[1.4rem] border border-white/12 bg-white/10 p-4 backdrop-blur">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/75">{text}</p>
    </div>
  );
}

export default AuthShell;
