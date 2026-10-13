export default function Loading() {
  return (
    <div className="ay-container grid  grid-cols-2 gap-3 px-4 py-8 md:grid-cols-4 md:px-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-[4/3] animate-pulse rounded-[3px] bg-border-light" />
      ))}
    </div>
  );
}
