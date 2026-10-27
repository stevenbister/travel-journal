import { CaretLeftIcon } from '@phosphor-icons/react';
import { useRouter } from '@tanstack/react-router';

import { Button } from '@repo/ui/components/ui/button';

type BackButtonProps = {
    to?: string;
};

export const BackButton = ({ to }: BackButtonProps) => {
    const router = useRouter();

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={() =>
                to ? router.navigate({ to }) : router.history.back()
            }
        >
            <CaretLeftIcon />
            <span className="sr-only">Back</span>
        </Button>
    );
};
