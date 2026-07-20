import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageTransition } from "@/components/layout/PageTransition";
import { ParticleBackground } from "@/components/ui/ParticleBackground";

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
    <div className="min-h-screen bg-background text-on-background relative">
      <ParticleBackground />
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className="floating-hex"
          style={{ top: "12%", left: "8%", animationDelay: "0s", animationDuration: "7s" }}
        />
        <div
          className="floating-hex"
          style={{ bottom: "18%", right: "10%", animationDelay: "3s", animationDuration: "9s", width: "70px", height: "80px" }}
        />
        <div
          className="floating-hex"
          style={{ top: "40%", right: "5%", animationDelay: "1.5s", animationDuration: "6s", width: "50px", height: "57px" }}
        />
        <div
          className="circuit-node-bg"
          style={{ top: "20%", left: "15%", animationDelay: "0s" }}
        />
        <div
          className="circuit-node-bg"
          style={{ bottom: "25%", right: "12%", animationDelay: "1.5s" }}
        />
        <div
          className="circuit-node-bg"
          style={{ top: "60%", left: "80%", animationDelay: "0.8s" }}
        />
        <div
          className="bg-ring-orange"
          style={{ width: "500px", height: "500px", opacity: 0.3 }}
        />
        <div
          className="bg-ring-orange"
          style={{
            width: "700px",
            height: "700px",
            borderStyle: "dashed",
            opacity: 0.15,
            animation: "ringSpin 50s linear infinite",
          }}
        />
      </div>
      <TopAppBar />
      <main className="pt-16 pb-24 px-4 md:px-6 max-w-6xl mx-auto relative z-10">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
    </div>
  );
}
