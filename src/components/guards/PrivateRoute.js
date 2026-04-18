import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />;
    }

    return children ? children : <Outlet />;
};

export default PrivateRoute;
