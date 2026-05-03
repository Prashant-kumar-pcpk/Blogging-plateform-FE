function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sand via-white to-mint">
      <div className="rounded-[2rem] bg-white px-8 py-6 text-center shadow-card">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Loading</p>
        <h1 className="mt-2 font-display text-4xl">Preparing Blogging-plateform</h1>
      </div>
    </div>
  );
}

export default LoadingScreen;
