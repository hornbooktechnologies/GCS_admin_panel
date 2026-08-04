import React from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../../context/AuthContext";
import { hasPermission } from "../../lib/utils/permissions";
import { getRouteAction, routePermissions } from "./routePermissions";

const PermissionGate = ({ children }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const permission = routePermissions.find((item) =>
    item.exact
      ? location.pathname === item.prefix
      : location.pathname.startsWith(item.prefix),
  );

  if (!permission) return children;

  const action = getRouteAction(location.pathname, permission.action);
  if (hasPermission(user, permission.moduleKey, action)) {
    return children;
  }

  return (
    <div className="rounded-lg border border-white/60 bg-white/80 p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
      <p className="mt-2 text-sm text-slate-500">
        You do not have permission to access this module.
      </p>
    </div>
  );
};

export default PermissionGate;
