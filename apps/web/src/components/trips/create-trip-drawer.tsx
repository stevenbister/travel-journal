import { PlusIcon } from '@phosphor-icons/react';

import { Button } from '@repo/ui/components/ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@repo/ui/components/ui/drawer';
import { useIsMobile } from '@repo/ui/hooks/use-mobile';
import { cn } from '@repo/ui/lib/utils';

import { CreateTripForm } from './create-trip-form';

export const CreateTripDrawer = () => {
    const isMobile = useIsMobile();

    return (
        <Drawer
            swipeDirection={isMobile ? 'down' : 'right'}
            showSwipeHandle={isMobile}
        >
            <DrawerTrigger
                render={
                    <Button
                        size={isMobile ? 'icon-lg' : 'lg'}
                        className={cn(
                            'bg-accent text-foreground hover:bg-accent/80',
                            isMobile &&
                                'rounded-full size-13 drop-shadow-sm drop-shadow-accent/50 -translate-y-5'
                        )}
                    />
                }
            >
                <PlusIcon weight="bold" className="size-5" />
                <span className={cn(isMobile && 'sr-only')}>
                    Create a new trip
                </span>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader className="pb-4">
                    <DrawerTitle>New Trip</DrawerTitle>
                    <DrawerDescription>
                        Fill out the details for your new trip.
                    </DrawerDescription>
                </DrawerHeader>

                <div className="container-x flex flex-col gap-4 h-full overflow-auto pb-12">
                    <CreateTripForm />

                    <DrawerClose render={<Button variant="outline" />}>
                        Cancel
                    </DrawerClose>
                </div>
            </DrawerContent>
        </Drawer>
    );
};
