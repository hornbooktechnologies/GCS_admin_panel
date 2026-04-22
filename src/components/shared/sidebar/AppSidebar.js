import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import { cn } from "../../../lib/utils/utils";
import { MenuItems } from "../../../lib/utils/menu";
import { useAuthStore } from "../../../context/AuthContext";
import { hasPermission } from "../../../lib/utils/permissions";
import useMedia from "../../../hooks/useMedia";
import { useLayout } from "../../../context/LayoutContext";
import useToast from "../../../hooks/useToast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";

const AppSidebar = () => {
  const { isOpen, setIsOpen } = useLayout();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { getIconUrl } = useMedia();
  const navigate = useNavigate();
  const { showSuccessToast } = useToast();
  const [expandedGroup, setExpandedGroup] = useState(null);

  // Filter menu items based on user role
  const visibleItems = useMemo(
    () =>
      MenuItems.filter((item) => {
        if (item.moduleKey && !hasPermission(user, item.moduleKey, "list")) {
          return false;
        }
        return !item.allowedRoles || item.allowedRoles.includes(user?.role) || Boolean(user?.permissions);
      }).map((item) => ({
        ...item,
        children: item.children?.filter((child) => {
          if (child.moduleKey && !hasPermission(user, child.moduleKey, "list")) {
            return false;
          }
          return !child.allowedRoles || child.allowedRoles.includes(user?.role) || Boolean(user?.permissions);
        }),
      })),
    [user?.role],
  );

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
    showSuccessToast("Logged out successfully");
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const toggleGroup = (title) => {
    setExpandedGroup((current) => (current === title ? null : title));
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "transition-all duration-300 z-40 flex flex-col",
          "bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl",
          // Mobile: Fixed overlay | Desktop: Relative in-flow
          "fixed top-4 left-4 h-[calc(100dvh-2rem)] md:relative md:h-full md:top-0 md:left-0",
          isOpen
            ? "translate-x-0 w-[240px] md:w-[260px] rounded-3xl"
            : "-translate-x-[calc(100%+20px)] md:translate-x-0 md:w-20 rounded-3xl",
        )}
      >
        {/* Logo Header synced with Navbar height */}
        <Link
          to="/"
          className={cn(
            "flex items-center transition-all duration-300 cursor-pointer overflow-hidden",
            isOpen ? "h-[72px] px-8 justify-start" : "h-[72px] justify-center w-full"
          )}
        >
          <div className={cn("transition-all duration-500", isOpen ? "flex" : "hidden md:flex opacity-0 scale-0 w-0")}>
            <img
              src={getIconUrl("Logo-dark.png")}
              alt="GCS Hospital CRM"
              className="w-[120px] h-auto"
            />
          </div>
          <div className={cn("transition-all duration-500", !isOpen ? "flex" : "hidden md:flex opacity-0 scale-0 w-0")}>
            <img
              src={getIconUrl("favicon.png")}
              alt="GCS Hospital"
              className="w-10 h-10 object-contain rounded-lg"
            />
          </div>
        </Link>

        {/* Menu Items */}
        <nav className="px-4 py-4 flex-1 overflow-y-auto">
          <ul className="space-y-1.5">
            {visibleItems.map((item) => {
              const isActive =
                location.pathname === item.url ||
                (item.url !== "/" &&
                  location.pathname.startsWith(`${item.url}/`));
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedGroup === item.title;
              const Icon = item.icon;

              const handleNavClick = () => {
                if (window.innerWidth < 768) {
                  setIsOpen(false);
                }
              };

              return (
                <li key={item.title}>
                  <TooltipProvider disableHoverableContent>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (!isOpen) {
                                setIsOpen(true);
                                return;
                              }
                              toggleGroup(item.title);
                            }}
                            className={cn(
                              "flex items-center transition-all duration-300 group relative",
                              isOpen
                                ? "justify-start px-5 py-3.5 gap-3 rounded-2xl w-full"
                                : "justify-center w-12 h-12 mx-auto rounded-full",
                              isActive
                                ? "bg-primary text-white shadow-xl shadow-primary/30"
                                : "text-slate-500 hover:bg-white hover:text-primary hover:shadow-md",
                            )}
                          >
                            <Icon
                              className={cn(
                                "transition-all duration-300 shrink-0",
                                isActive
                                  ? "text-white scale-110"
                                  : "text-slate-500 group-hover:text-primary group-hover:scale-110",
                              )}
                              size={isOpen ? 20 : 22}
                            />
                            <span
                              className={cn(
                                "text-sm transition-all duration-300 whitespace-nowrap overflow-hidden transition-[width,opacity]",
                                isOpen ? "w-auto opacity-100 ml-0" : "w-0 opacity-0 ml-0 invisible md:visible",
                                isActive ? "font-bold tracking-tight" : "font-medium",
                              )}
                            >
                              {item.title}
                            </span>
                            {isOpen ? (
                              <ChevronDown
                                className={cn(
                                  "ml-auto h-4 w-4 transition-transform duration-200",
                                  isExpanded ? "rotate-180" : "",
                                )}
                              />
                            ) : null}
                            {!isOpen && isActive && (
                              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-sm animate-in fade-in slide-in-from-left-2" />
                            )}
                          </button>
                        ) : (
                          <Link
                            to={item.url}
                            onClick={handleNavClick}
                            className={cn(
                              "flex items-center transition-all duration-300 group relative",
                              isOpen
                                ? "justify-start px-5 py-3.5 gap-3 rounded-2xl w-full"
                                : "justify-center w-12 h-12 mx-auto rounded-full",
                              isActive
                                ? "bg-primary text-white shadow-xl shadow-primary/30"
                                : "text-slate-500 hover:bg-white hover:text-primary hover:shadow-md",
                            )}
                          >
                            <Icon
                              className={cn(
                                "transition-all duration-300 shrink-0",
                                isActive
                                  ? "text-white scale-110"
                                  : "text-slate-500 group-hover:text-primary group-hover:scale-110",
                              )}
                              size={isOpen ? 20 : 22}
                            />
                            <span
                              className={cn(
                                "text-sm transition-all duration-300 whitespace-nowrap overflow-hidden transition-[width,opacity]",
                                isOpen ? "w-auto opacity-100 ml-0" : "w-0 opacity-0 ml-0 invisible md:visible",
                                isActive ? "font-bold tracking-tight" : "font-medium",
                              )}
                            >
                              {item.title}
                            </span>
                            {!isOpen && isActive && (
                              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-sm animate-in fade-in slide-in-from-left-2" />
                            )}
                          </Link>
                        )}
                      </TooltipTrigger>
                      {!isOpen && (
                        <TooltipContent side="right" sideOffset={12} className="bg-primary border-none text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xl">
                          <p>{item.title}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  {hasChildren && isOpen && isExpanded ? (
                    <ul className="mt-1 space-y-1 pl-4">
                      {item.children.map((child) => {
                        const childIsActive =
                          location.pathname === child.url ||
                          location.pathname.startsWith(`${child.url}/`);
                        return (
                          <li key={child.title}>
                            <Link
                              to={child.url}
                              onClick={handleNavClick}
                              className={cn(
                                "flex items-center rounded-xl px-4 py-2.5 text-sm transition-all duration-200",
                                childIsActive
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "text-slate-500 hover:bg-white hover:text-primary",
                              )}
                            >
                              <span className="truncate">{child.title}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>
        {/* Logout Button at Bottom */}
        <div className="px-4 py-4 mt-auto">
          <TooltipProvider disableHoverableContent>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className={cn(
                    "flex items-center transition-all duration-300 group relative",
                    isOpen
                      ? "justify-start px-5 py-3 gap-3 rounded-2xl w-full"
                      : "justify-center w-12 h-12 mx-auto rounded-full",
                    "text-primary hover:text-red-600 hover:bg-red-50 hover:shadow-sm",
                  )}
                >
                  <LogOut
                    className="text-primary group-hover:text-red-600 transition-all duration-300 shrink-0 group-hover:scale-110"
                    size={isOpen ? 20 : 22}
                  />
                  <span className={cn(
                    "font-semibold text-sm transition-all duration-300 whitespace-nowrap overflow-hidden transition-[width,opacity]",
                    isOpen ? "w-auto opacity-100" : "w-0 opacity-0 invisible md:visible"
                  )}>
                    Log Out
                  </span>
                </button>
              </TooltipTrigger>
              {!isOpen && (
                <TooltipContent side="right" sideOffset={12} className="bg-primary border-none text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xl">
                  Log Out
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default AppSidebar;
