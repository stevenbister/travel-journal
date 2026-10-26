import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerPrimitive,
    DrawerTitle,
} from '@repo/ui/components/ui/drawer';

import { EditEntryForm } from './edit-entry-form';

export const EditEntryDrawerHandler = DrawerPrimitive.createHandle();

type EditEntryDrawerProps = {
    entryId: string;
    title: string;
    description?: string;
    open: boolean;
    onOpenChange: (_open: boolean) => void;
    onSubmit: () => void;
};

export const EditEntryDrawer = ({
    open,
    onOpenChange,
    title,
    description,
    entryId,
    onSubmit,
}: EditEntryDrawerProps) => (
    <Drawer
        open={open}
        onOpenChange={onOpenChange}
        handle={EditEntryDrawerHandler}
    >
        <DrawerContent>
            <DrawerHeader>
                <DrawerTitle className="text-balance">{title}</DrawerTitle>
                <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            <div className="container">
                <EditEntryForm entryId={entryId} onSubmit={onSubmit} />
            </div>
        </DrawerContent>
    </Drawer>
);
