function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fff1de] via-[#fff8ef] to-white">
      <div className="rounded-[2.2rem] border border-[#f57c00]/10 bg-white px-8 py-7 text-center shadow-card">
        <p className="text-xs uppercase tracking-[0.3em] text-[#f57c00]/60">Loading</p>
        <h1 className="mt-2 font-display text-4xl text-[#f57c00]">Preparing Blogger Platform</h1>
        <p className="mt-3 text-sm text-ink/60">Getting your stories, dashboard, and publishing tools ready.</p>
      </div>
    </div>
  );
}

export default LoadingScreen;
