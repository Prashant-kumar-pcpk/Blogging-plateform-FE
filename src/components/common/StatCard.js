function StatCard({ label, value }) {
  return (
    <div className="rounded-[1.5rem] bg-white/90 p-4 text-ink">
      <p className="text-xs uppercase tracking-[0.25em] text-ink/45">{label}</p>
      <p className="mt-3 font-display text-3xl">{value}</p>
    </div>
  );
}

export default StatCard;
