// frontend/src/hooks/useToast.ts
import { useState, useCallback, useEffect } from 'react';

export const useToast = () => {
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; text: string; visible: boolean }>({
        type: 'info',
        text: '',
        visible: false,
    });

    const triggerToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', text: string) => {
        setToast({ type, text, visible: true });
    }, []);

    useEffect(() => {
        if (toast.visible) {
            const timer = setTimeout(() => {
                setToast((t) => ({ ...t, visible: false }));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.visible]);

    return { toast, triggerToast };
};