function FilterPill({ active, children, onClick }) {
  return (
    <button
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-ink text-sand" : "bg-smoke text-ink hover:bg-ink/10"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export default FilterPill;
