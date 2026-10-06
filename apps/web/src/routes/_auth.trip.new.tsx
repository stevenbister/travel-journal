import { CaretLeftIcon } from '@phosphor-icons/react';
import { createFileRoute, useRouter } from '@tanstack/react-router';

import { Button } from '@repo/ui/components/ui/button';

import { CreateTripForm } from '../components/trips/create-trip-form';

export const Route = createFileRoute('/_auth/trip/new')({
    component: NewTripRoute,
});

function NewTripRoute() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-4 h-full">
            <header className="flex items-center gap-4 pb-4 border-b">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.history.back()}
                >
                    <CaretLeftIcon />
                    <span className="sr-only">Back</span>
                </Button>
                <h1>New trip</h1>
            </header>

            <CreateTripForm />
        </div>
    );
}
