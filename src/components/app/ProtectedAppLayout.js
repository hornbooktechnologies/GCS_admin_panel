import React from "react";
import { Outlet } from "react-router-dom";
import PrivateRoute from "../guards/PrivateRoute";
import SidebarWrapper from "../shared/sidebar/SidebarWrapper";
import PermissionGate from "./PermissionGate";

const ProtectedAppLayout = () => (
  <PrivateRoute>
    <SidebarWrapper>
      <PermissionGate>
        <Outlet />
      </PermissionGate>
    </SidebarWrapper>
  </PrivateRoute>
);

export default ProtectedAppLayout;
