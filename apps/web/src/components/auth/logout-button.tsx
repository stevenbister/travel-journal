import { useNavigate } from '@tanstack/react-router';

import { authClient } from '@repo/core/auth/client';

import { Button } from '@repo/ui/components/ui/button';

import { genericErrorToast } from '../../lib/generic-error-toast';

export const LogoutButton = () => {
    const navigate = useNavigate();
    const handleLogout = async () => {
        try {
            await authClient.signOut({
                fetchOptions: {
                    onSuccess: () =>
                        navigate({ to: '/login', search: { redirect: '/' } }),
                },
            });
        } catch (error) {
            genericErrorToast();
            console.error('Logout failed', error);
        }
    };

    return <Button onClick={handleLogout}>Logout</Button>;
};
