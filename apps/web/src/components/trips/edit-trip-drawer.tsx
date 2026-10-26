import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerPrimitive,
    DrawerTitle,
} from '@repo/ui/components/ui/drawer';

import { EditTripForm } from './edit-trip-form';

export const TripActionDrawerHandler = DrawerPrimitive.createHandle();

type EditTripDrawerProps = {
    tripId: string;
    title: string;
    description?: string;
    open: boolean;
    onOpenChange: (_open: boolean) => void;
    onSubmit: () => void;
};

export const EditTripDrawer = ({
    open,
    onOpenChange,
    title,
    description,
    tripId,
    onSubmit,
}: EditTripDrawerProps) => (
    <Drawer
        open={open}
        onOpenChange={onOpenChange}
        handle={TripActionDrawerHandler}
    >
        <DrawerContent>
            <DrawerHeader>
                <DrawerTitle className="text-balance">{title}</DrawerTitle>
                <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            <div className="container">
                <EditTripForm tripId={tripId!} onSubmit={onSubmit} />
            </div>
        </DrawerContent>
    </Drawer>
);
