import { InfoIcon, MapTrifoldIcon } from '@phosphor-icons/react';

import { authClient } from '@repo/core/auth/client';

import { Alert, AlertDescription } from '@repo/ui/components/ui/alert';
import { Button } from '@repo/ui/components/ui/button';
import { toast } from '@repo/ui/components/ui/toast';

import { flushPendingSignOut } from '../../lib/auth/session';
import { genericErrorToast } from '../../lib/generic-error-toast';
import { checkIsOnline } from '../../lib/online/check-is-online';

export const LoginForm = () => {
    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        await flushPendingSignOut();

        const isOnline = await checkIsOnline();
        if (!isOnline) {
            return toast.add({
                title: 'Network error',
                description:
                    'You are currently offline. Please check your network connection.',
                type: 'error',
                timeout: 0,
            });
        }

        try {
            await authClient.signIn.social({
                provider: 'google',
                callbackURL: '/',
            });
        } catch (error) {
            genericErrorToast();
            console.error('Login failed', error);
        }
    };

    return (
        <div className="flex flex-col gap-6 justify-between min-h-svh p-8 md:p-10 w-full max-w-md">
            <div className="flex flex-col flex-1 items-center justify-center gap-4 text-center">
                <div className="flex items-center justify-center rounded-2xl p-3 bg-primary text-background">
                    <MapTrifoldIcon
                        size={32}
                        weight="duotone"
                        aria-hidden="true"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">Travel Journal</h1>
                    <p className="text-muted-foreground">
                        A place to document your travels.
                    </p>
                </div>
            </div>

            <div className="flex flex-col flex-1 justify-end gap-6">
                <Button variant="outline" size="lg" onClick={handleClick}>
                    <svg viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 01-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0012 24z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.27 14.28a7.2 7.2 0 010-4.56v-3.1H1.27a12 12 0 000 10.76z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 4.76c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.23 0 12 0A12 12 0 001.27 6.62l4 3.1C6.22 6.87 8.87 4.76 12 4.76z"
                        />
                    </svg>
                    Continue with Google
                </Button>

                <Alert>
                    <InfoIcon />
                    <AlertDescription>
                        Travel Log is invite-only. Sign in with the Google
                        account that has been invited.
                    </AlertDescription>
                </Alert>

                <p className="text-muted-foreground text-sm text-center">
                    Travel Journal v0.1.0
                </p>
            </div>
        </div>
    );
};
