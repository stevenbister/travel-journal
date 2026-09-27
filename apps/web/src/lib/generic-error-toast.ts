import { toast } from '@repo/ui/components/ui/toast';

export const genericErrorToast = () => {
    return toast.add({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        type: 'error',
    });
};
