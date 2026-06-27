import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <TopAppBar />
      <main className="pt-16 pb-24 px-4 md:px-6 max-w-6xl mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
