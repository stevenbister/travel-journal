import { CaretLeftIcon } from '@phosphor-icons/react';
import { useRouter } from '@tanstack/react-router';

import { Button } from '@repo/ui/components/ui/button';

export const BackButton = () => {
    const router = useRouter();

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={() => router.history.back()}
        >
            <CaretLeftIcon />
            <span className="sr-only">Back</span>
        </Button>
    );
};
