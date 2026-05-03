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
    : "U";

  return (
    <header className="relative z-50 border-b border-ink/10 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 overflow-visible px-4 py-4 ">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink/10">
            <img
              src="/ink-feather.png"
              alt="Prashant Diaries logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <p className="font-display text-2xl font-semibold"><i>Prashant Diaries</i></p>
            {/* <p className="text-xs uppercase tracking-[0.3em] text-ink/50">MERN x Tailwind</p> */}
          </div>
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link className="rounded-full px-4 py-2 hover:bg-ink/5" to="/">
            Explore
          </Link>
          {user ? (
            <Link className="rounded-full px-4 py-2 hover:bg-ink/5" to="/editor">
              Write
            </Link>
          ) : null}
          {user ? (
            <Link className="rounded-full px-4 py-2 hover:bg-ink/5" to="/dashboard">
              Dashboard
            </Link>
          ) : null}
          {user ? (
            <div className="relative z-50" ref={menuRef}>
              <button
                className="flex items-center gap-3 rounded-full border border-ink/10 bg-white px-2 py-2 shadow-sm transition hover:bg-ink/5"
                onClick={() => setMenuOpen((current) => !current)}
                type="button"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-bold text-sand">
                  {initials}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="max-w-32 truncate text-sm font-semibold">{user.name}</p>
                  {/* <p className="max-w-32 truncate text-xs text-ink/50">@{user.username}</p> */}
                </div>
                <svg className="h-4 w-4 text-ink/60" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {menuOpen ? (
                <div className="absolute right-0 top-14 z-[100] w-72 rounded-[1.5rem] border border-ink/10 bg-white p-3 shadow-card">
                  <div className="rounded-[1.2rem] bg-smoke px-4 py-3">
                    <p className="font-semibold">{user.name}</p>
                    {/* <p className="text-sm text-ink/55">@{user.username}</p> */}
                    {/* <p className="mt-1 truncate text-sm text-ink/55">{user.email}</p> */}
                  </div>

                  <div className="mt-3 space-y-1">
                    <Link
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium hover:bg-ink/5"
                      to={`/authors/${user.username}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <MenuIcon>
                        <path d="M10 2a4 4 0 100 8 4 4 0 000-8zm-6 14a6 6 0 1112 0v1H4v-1z" />
                      </MenuIcon>
                      User profile
                    </Link>
                    <Link
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium hover:bg-ink/5"
                      to="/dashboard#profile-settings"
                      onClick={() => setMenuOpen(false)}
                    >
                      <MenuIcon>
                        <path d="M10 3a1 1 0 01.95.68l.33 1a5.97 5.97 0 011.38.57l.96-.48a1 1 0 011.2.22l1.12 1.12a1 1 0 01.22 1.2l-.48.96c.24.44.43.9.57 1.38l1 .33a1 1 0 01.68.95v1.58a1 1 0 01-.68.95l-1 .33a5.97 5.97 0 01-.57 1.38l.48.96a1 1 0 01-.22 1.2l-1.12 1.12a1 1 0 01-1.2.22l-.96-.48a5.97 5.97 0 01-1.38.57l-.33 1a1 1 0 01-.95.68H9.21a1 1 0 01-.95-.68l-.33-1a5.97 5.97 0 01-1.38-.57l-.96.48a1 1 0 01-1.2-.22L3.27 15.9a1 1 0 01-.22-1.2l.48-.96a5.97 5.97 0 01-.57-1.38l-1-.33a1 1 0 01-.68-.95V9.5a1 1 0 01.68-.95l1-.33c.14-.48.33-.94.57-1.38l-.48-.96a1 1 0 01.22-1.2l1.12-1.12a1 1 0 011.2-.22l.96.48c.44-.24.9-.43 1.38-.57l.33-1a1 1 0 01.95-.68H10zm0 5a2 2 0 100 4 2 2 0 000-4z" />
                      </MenuIcon>
                      Update profile
                    </Link>
                    <Link
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium hover:bg-ink/5"
                      to="/change-password"
                      onClick={() => setMenuOpen(false)}
                    >
                      <MenuIcon>
                        <path d="M6 8V6a4 4 0 118 0v2h1a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V9a1 1 0 011-1h1zm2 0h4V6a2 2 0 10-4 0v2zm2 3a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z" />
                      </MenuIcon>
                      Change password
                    </Link>
                  </div>

                  <div className="mt-3 border-t border-ink/10 pt-3">
                    <button
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-coral hover:bg-coral/10"
                      onClick={() => {
                        setMenuOpen(false);
                        clearSession();
                        navigate("/");
                      }}
                      type="button"
                    >
                      <MenuIcon className="text-coral">
                        <path d="M10 2a1 1 0 011 1v5h-2V4H5v12h4v-4h2v5a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1h6zm4.3 4.3L19 11l-4.7 4.7-1.4-1.4 2.3-2.3H8v-2h7.2l-2.3-2.3 1.4-1.4z" />
                      </MenuIcon>
                      Logout
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <Link className="rounded-full bg-ink px-4 py-2 text-sand" to="/auth/login">
              Login / Register
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function MenuIcon({ children, className = "text-ink/65" }) {
  return (
    <svg className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      {children}
    </svg>
  );
}

export default Header;
