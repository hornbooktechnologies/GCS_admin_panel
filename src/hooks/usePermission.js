import { useAuthStore } from "../context/AuthContext";
import { hasPermission } from "../lib/utils/permissions";

const usePermission = () => {
  const { user } = useAuthStore();

  return {
    can: (moduleKey, action = "list") => hasPermission(user, moduleKey, action),
    user,
  };
};

export default usePermission;
