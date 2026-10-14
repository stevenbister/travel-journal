import { Card, CardContent } from '@repo/ui/components/ui/card';
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
} from '@repo/ui/components/ui/drawer';
import { Skeleton } from '@repo/ui/components/ui/skeleton';

import { EntryDetails } from './entry-details';
import { useGetEntry } from './hooks/use-get-entry';

type EntryDrawerProps = {
    entryId: string;
    trigger: React.ReactElement;
    isOpen: boolean;
    setIsOpen: (_isOpen: boolean) => void;
};

export const EntryDrawer = ({
    entryId,
    trigger,
    isOpen,
    setIsOpen,
}: EntryDrawerProps) => {
    const { entry, isPending } = useGetEntry(entryId);

    if (!isPending && !entry) {
        return <div>Entry not found</div>;
    }

    return (
        <Drawer
            modal={false}
            disablePointerDismissal
            open={isOpen}
            onOpenChange={setIsOpen}
        >
            <DrawerTrigger
                className="aria-expanded:text-primary transition-colors"
                render={trigger}
            />

            <DrawerContent>
                <Card>
                    <CardContent className="grid grid-cols-[auto_1fr] gap-3 items-start">
                        {isPending ? (
                            <Skeleton className="h-6 w-full" />
                        ) : (
                            <EntryDetails entry={entry!} dateType="date" />
                        )}
                    </CardContent>
                </Card>
            </DrawerContent>
        </Drawer>
    );
};
