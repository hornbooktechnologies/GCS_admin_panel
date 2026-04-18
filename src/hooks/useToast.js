import { toast } from 'sonner';
import { useCallback, useMemo } from 'react';

const useToast = () => {
    const showSuccessToast = useCallback((message) => {
        toast.success(message);
    }, []);

    const showErrorToast = useCallback((message) => {
        toast.error(message);
    }, []);

    const showInfoToast = useCallback((message) => {
        toast.info(message);
    }, []);

    const showWarningToast = useCallback((message) => {
        toast.warning(message);
    }, []);

    return useMemo(() => ({
        showSuccessToast,
        showErrorToast,
        showInfoToast,
        showWarningToast,
    }), [showSuccessToast, showErrorToast, showInfoToast, showWarningToast]);
};

export default useToast;
