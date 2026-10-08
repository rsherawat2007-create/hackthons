import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CompareDock } from "@/components/CompareDock";
import { UpgradeModal } from "@/components/UpgradeModal";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <CompareDock />
      <UpgradeModal />
      <Footer />
    </div>
  );
}
