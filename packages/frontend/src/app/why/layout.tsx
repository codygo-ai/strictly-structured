import { SiteHeader } from "~/components/SiteHeader";

export default function WhyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="validator-page min-h-screen flex flex-col">
      <SiteHeader subtitle current="why" />
      <main className="flex-1 container mx-auto px-6 py-8 max-w-3xl">
        {children}
      </main>
    </div>
  );
}
