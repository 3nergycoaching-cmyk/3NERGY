import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-row h-screen overflow-hidden bg-[#f7f5f3]"
      style={{ display: "flex", flexDirection: "row", height: "100dvh", width: "100%", overflow: "hidden" }}
    >
      <Sidebar />
      <main
        className="flex-1 min-h-0 min-w-0 overflow-y-auto"
        style={{ flex: "1 1 0%", minHeight: 0, minWidth: 0, overflowY: "auto" }}
      >
        {children}
      </main>
    </div>
  );
}
