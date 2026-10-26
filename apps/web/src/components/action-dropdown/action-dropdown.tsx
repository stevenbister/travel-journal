import {
    DotsThreeIcon,
    PencilSimpleIcon,
    TrashIcon,
} from '@phosphor-icons/react';

import { Button } from '@repo/ui/components/ui/button';
import {
    type DrawerPrimitive,
    DrawerTrigger,
} from '@repo/ui/components/ui/drawer';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu';

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
}: ActionDropdownProps) => (
    <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
            <DotsThreeIcon weight="bold" />
            <span className="sr-only">Options</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuGroup>
                <DropdownMenuItem
                    onSelect={onEdit}
                    nativeButton
                    render={
                        <DrawerTrigger
                            handle={editDrawerHandle}
                            className="w-full"
                        />
                    }
                >
                    <PencilSimpleIcon /> Edit
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="text-destructive"
                    onSelect={onDelete}
                    nativeButton
                    render={
                        <DrawerTrigger
                            handle={ConfirmationDrawerHandler}
                            className="w-full"
                        />
                    }
                >
                    <TrashIcon /> Delete
                </DropdownMenuItem>
            </DropdownMenuGroup>
        </DropdownMenuContent>
    </DropdownMenu>
);
