import { SiteHeader } from "~/components/SiteHeader";

export default function ModelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="validator-page min-h-screen flex flex-col">
      <SiteHeader subtitle current="models" />
      <main className="flex-1 container mx-auto px-6 py-8 max-w-page">
        {children}
      </main>
    </div>
  );
}
