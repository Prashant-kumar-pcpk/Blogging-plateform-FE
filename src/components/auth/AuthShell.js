import { Link } from "react-router-dom";

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
      <div className="rounded-[2rem] bg-white p-8 shadow-card">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Access</p>
        <h1 className="mt-2 font-display text-4xl">{title}</h1>
        <p className="mt-4 max-w-xl text-ink/70">{subtitle}</p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
          <Link className="rounded-full border border-ink/10 px-4 py-2 hover:bg-ink/5" to="/auth/login">
            Login
          </Link>
          <Link className="rounded-full border border-ink/10 px-4 py-2 hover:bg-ink/5" to="/auth/register">
            Register
          </Link>
        </div>
      </div>

      <div className="rounded-[2rem] bg-ink p-8 shadow-card">
        {children}
        {footer ? <div className="mt-5 text-sm text-white/75">{footer}</div> : null}
      </div>
    </section>
  );
}

export default AuthShell;
