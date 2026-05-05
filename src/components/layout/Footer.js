import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="mt-8 border-t border-[#f57c00]/10 bg-[#fff8ef]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-display text-3xl text-[#f57c00]">Blogger Platform</p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-ink/65">
              Publish stories, share ideas, and grow your audience with a clean writing space inspired by the classic Blogger experience.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-ink/70">
            <Link className="rounded-full px-4 py-2 hover:bg-white" to="/">
              Home
            </Link>
            <Link className="rounded-full px-4 py-2 hover:bg-white" to="/auth/register">
              Create Blog
            </Link>
            <Link className="rounded-full px-4 py-2 hover:bg-white" to="/auth/login">
              Sign In
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-[#f57c00]/10 pt-4 text-xs uppercase tracking-[0.22em] text-ink/40 sm:flex-row sm:items-center sm:justify-between">
          <span>Modern Blogger-style MERN platform</span>
          <span>Write. Publish. Grow.</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
