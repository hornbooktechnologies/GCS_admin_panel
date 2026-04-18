import React from "react";
import { cn } from "../../../lib/utils/utils";
import AppSidebar from "./AppSidebar";
import Navbar from "../navbar/Navbar";
import { useLayout } from "../../../context/LayoutContext";

const SidebarWrapper = ({ children }) => {
  const { isOpen } = useLayout();

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden p-0 md:p-4 md:gap-4">
      {/* Mesh Gradient Background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundColor: "#f8fafc",
          backgroundImage: `
            radial-gradient(at 0% 0%, hsla(253, 16%, 7%, 0) 0, transparent 50%), 
            radial-gradient(at 50% 0%, hsla(215, 39%, 30%, 0) 0, transparent 50%), 
            radial-gradient(at 100% 0%, hsla(210, 49%, 30%, 0) 0, transparent 50%), 
            radial-gradient(at 0% 50%, hsla(210, 78%, 85%, 1) 0, transparent 50%), 
            radial-gradient(at 100% 50%, hsla(217, 85%, 90%, 1) 0, transparent 50%)
          `,
        }}
      />

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Page Content aligned perfectly with Header Left Edge */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden mt-4 pl-4 md:pl-0 pr-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SidebarWrapper;
