import { PlusIcon } from '@phosphor-icons/react';
import * as React from 'react';

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

import { CreateEntryForm } from './create-entry-form';

export const CreateEntryDrawer = () => {
    const isMobile = useIsMobile();
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <Drawer
            swipeDirection={isMobile ? 'down' : 'right'}
            showSwipeHandle={isMobile}
            open={isOpen}
            onOpenChange={setIsOpen}
        >
            <DrawerTrigger
                render={
                    <Button
                        size={isMobile ? 'icon-lg' : 'lg'}
                        className="fixed bottom-4 inset-e-4 bg-accent text-foreground hover:bg-accent/80 rounded-full size-13 drop-shadow-sm drop-shadow-accent/50"
                    />
                }
            >
                <PlusIcon weight="bold" className="size-5" />
                <span className={cn(isMobile && 'sr-only')}>
                    Create a new entry
                </span>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader className="pb-4">
                    <DrawerTitle>New Entry</DrawerTitle>
                    <DrawerDescription>
                        Fill out the details for your new entry.
                    </DrawerDescription>
                </DrawerHeader>

                <div className="container-x flex flex-col gap-4 h-full overflow-auto pb-12">
                    <CreateEntryForm onSubmitSuccess={() => setIsOpen(false)} />

                    <DrawerClose render={<Button variant="outline" />}>
                        Cancel
                    </DrawerClose>
                </div>
            </DrawerContent>
        </Drawer>
    );
};
