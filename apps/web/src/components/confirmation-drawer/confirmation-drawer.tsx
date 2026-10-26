import { Button } from '@repo/ui/components/ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerPrimitive,
    DrawerTitle,
} from '@repo/ui/components/ui/drawer';

export const ConfirmationDrawerHandler = DrawerPrimitive.createHandle();

type ConfirmationDrawerProps = {
    title: string;
    description?: string;
    open: boolean;
    onOpenChange: (_open: boolean) => void;
    onConfirm: () => void;
};

export const ConfirmationDrawer = ({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
}: ConfirmationDrawerProps) => (
    <Drawer
        open={open}
        onOpenChange={onOpenChange}
        handle={ConfirmationDrawerHandler}
    >
        <DrawerContent>
            <DrawerHeader>
                <DrawerTitle className="text-balance">{title}</DrawerTitle>
                <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            <div className="container"></div>
            <DrawerFooter>
                <Button variant="destructive" onClick={onConfirm}>
                    Delete
                </Button>
                <DrawerClose render={<Button variant="outline" />}>
                    Cancel
                </DrawerClose>
            </DrawerFooter>
        </DrawerContent>
    </Drawer>
);
