import {
    DotsThreeIcon,
    PencilSimpleIcon,
    TrashIcon,
} from '@phosphor-icons/react';
import * as React from 'react';

import { Button } from '@repo/ui/components/ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerPrimitive,
    DrawerTrigger,
} from '@repo/ui/components/ui/drawer';

import { ConfirmationDrawerHandler } from '../confirmation-drawer/confirmation-drawer';

type ActionDropdownProps = {
    onEdit: () => void;
    onDelete: () => void;
    editDrawerHandle: DrawerPrimitive.Handle<unknown>;
};

export const ActionDropdown = ({
    onEdit,
    onDelete,
    editDrawerHandle,
}: ActionDropdownProps) => {
    const actionDrawerHandle = React.useMemo(
        () => DrawerPrimitive.createHandle(),
        []
    );

    return (
        <Drawer handle={actionDrawerHandle}>
            <DrawerTrigger render={<Button variant="outline" size="icon" />}>
                <DotsThreeIcon weight="bold" />
                <span className="sr-only">Options</span>
            </DrawerTrigger>
            <DrawerContent>
                <div className="container flex flex-col gap-4">
                    <Button
                        onClick={() => {
                            actionDrawerHandle.close();
                            onEdit();
                        }}
                        variant="secondary"
                        className="w-full"
                        render={<DrawerTrigger handle={editDrawerHandle} />}
                    >
                        <PencilSimpleIcon /> Edit
                    </Button>

                    <Button
                        onClick={() => {
                            actionDrawerHandle.close();
                            onDelete();
                        }}
                        variant="destructive"
                        className="w-full"
                        render={
                            <DrawerTrigger handle={ConfirmationDrawerHandler} />
                        }
                    >
                        <TrashIcon /> Delete
                    </Button>

                    <DrawerClose render={<Button variant="outline" />}>
                        Cancel
                    </DrawerClose>
                </div>
            </DrawerContent>
        </Drawer>
    );
};
