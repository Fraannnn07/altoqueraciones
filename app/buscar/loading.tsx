// Se muestra al instante mientras el servidor busca (el formulario lo precarga al quedar visible).
export default function SearchLoading() {
  return (
    <div className="pb-16" aria-busy="true">
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <p className="font-display text-3xl font-bold text-gray-900">Buscando…</p>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-black/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
