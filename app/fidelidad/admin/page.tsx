import type { Metadata } from "next";
import PanelLocal from "./PanelLocal";

export const metadata: Metadata = { title: "Sellos | Panel del local", robots: { index: false } };

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-6">
      <PanelLocal />
    </div>
  );
}
