export default function ModelsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="container mx-auto px-6 py-8 max-w-page">{children}</div>
    </main>
  );
}
