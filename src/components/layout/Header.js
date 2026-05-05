import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Header({ appState }) {
  const { user, clearSession } = appState;
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "B";

  return (
    <header className="sticky top-0 z-50 border-b border-[#f57c00]/10 bg-[#fff8ef]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f57c00] text-xl font-bold text-white shadow-sm">
            B
          </div>
          <div>
            <p className="font-display text-3xl leading-none text-[#f57c00]">Blogger Platform</p>
            <p className="mt-1 text-xs uppercase tracking-[0.28em] text-ink/40">Create your blog</p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link className="rounded-full px-4 py-2 font-medium text-ink/75 transition hover:bg-white" to="/">
            Home
          </Link>
          {user ? (
            <>
              <Link className="rounded-full px-4 py-2 font-medium text-ink/75 transition hover:bg-white" to="/editor">
                New Post
              </Link>
              <Link className="rounded-full px-4 py-2 font-medium text-ink/75 transition hover:bg-white" to="/dashboard">
                Stats
              </Link>
            </>
          ) : null}

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                className="flex items-center gap-3 rounded-full border border-[#f57c00]/10 bg-white px-2 py-2 shadow-sm transition hover:bg-[#fff4e6]"
                onClick={() => setMenuOpen((current) => !current)}
                type="button"
              >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#f57c00] text-sm font-bold text-white">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="max-w-32 truncate text-sm font-semibold text-ink">{user.name}</p>
                  <p className="max-w-32 truncate text-xs text-ink/45">@{user.username}</p>
                </div>
              </button>

              {menuOpen ? (
                <div className="absolute right-0 top-14 z-[100] w-72 rounded-[1.5rem] border border-[#f57c00]/10 bg-white p-3 shadow-card">
                  <div className="rounded-[1.2rem] bg-[#fff8ef] px-4 py-3">
                    <p className="font-semibold text-ink">{user.name}</p>
                    <p className="text-sm text-ink/55">@{user.username}</p>
                    <p className="mt-1 truncate text-sm text-ink/55">{user.email}</p>
                  </div>

                  <div className="mt-3 space-y-1">
                    <MenuLink to={`/authors/${user.username}`} onClick={() => setMenuOpen(false)}>
                      Profile
                    </MenuLink>
                    <MenuLink to="/dashboard" onClick={() => setMenuOpen(false)}>
                      Dashboard
                    </MenuLink>
                    <MenuLink to="/dashboard#profile-settings" onClick={() => setMenuOpen(false)}>
                      Settings
                    </MenuLink>
                    <MenuLink to="/change-password" onClick={() => setMenuOpen(false)}>
                      Change password
                    </MenuLink>
                  </div>

                  <div className="mt-3 border-t border-[#f57c00]/10 pt-3">
                    <button
                      className="flex w-full items-center rounded-2xl px-4 py-3 text-left text-sm font-medium text-coral hover:bg-coral/10"
                      onClick={() => {
                        setMenuOpen(false);
                        clearSession();
                        navigate("/");
                      }}
                      type="button"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link className="rounded-full px-4 py-2 font-medium text-ink/75 transition hover:bg-white" to="/auth/login">
                Sign in
              </Link>
              <Link className="rounded-full bg-[#f57c00] px-5 py-2.5 font-semibold text-white transition hover:bg-[#e76f00]" to="/auth/register">
                Create blog
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

function MenuLink({ to, children, onClick }) {
  return (
    <Link
      className="flex items-center rounded-2xl px-4 py-3 text-sm font-medium text-ink/75 hover:bg-[#fff4e6]"
      to={to}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export default Header;
