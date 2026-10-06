import { CheckIcon } from '@phosphor-icons/react';
import { useLiveQuery } from 'dexie-react-hooks';
import React from 'react';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@repo/ui/components/ui/avatar';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@repo/ui/components/ui/toggle-group';
import { cn } from '@repo/ui/lib/utils';

import { useSession } from '../../lib/auth/use-session';
import { db } from '../../lib/dexie/db';
import type { User } from '../../lib/dexie/types';

export type UserPickerProps = {
    id: string;
    labelledBy: string;
    onChange: (selected: string[]) => void;
};

export const UserPicker = ({ id, labelledBy, onChange }: UserPickerProps) => {
    const { data: session } = useSession();
    const currentUserId = session?.user.id;

    const users = useLiveQuery(() => db.users.toArray());
    // Sort so current user is always first
    const sortedUsers = users?.toSorted((a, b) =>
        a.id === currentUserId ? -1 : b.id === currentUserId ? 1 : 0
    );

    // TODO: Skeleton
    if (!sortedUsers || !currentUserId) return null;

    return (
        <UsersToggle
            id={id}
            labelledBy={labelledBy}
            users={sortedUsers}
            currentUserId={currentUserId}
            onChange={onChange}
        />
    );
};

type UsersToggleProps = UserPickerProps & {
    users: User[];
    currentUserId: string;
};

const UsersToggle = ({
    id,
    labelledBy,
    users,
    currentUserId,
    onChange,
}: UsersToggleProps) => {
    const [selected, setSelected] = React.useState([currentUserId]);

    return (
        <ToggleGroup
            id={id}
            value={selected}
            onValueChange={(value) => {
                setSelected(value);
                onChange(value);
            }}
            variant="outline"
            size="lg"
            multiple
            aria-labelledby={labelledBy}
        >
            {users.map(({ id, name, image }) => {
                return (
                    <ToggleGroupItem key={id} value={id} className="gap-2">
                        <Avatar size="sm">
                            {image ? <AvatarImage src={image} /> : null}
                            <AvatarFallback
                                className={cn(name === 'Grace' && 'bg-primary')}
                            >
                                {name?.[0]}
                            </AvatarFallback>
                        </Avatar>

                        {name}

                        {selected.includes(id) && (
                            <CheckIcon weight="bold" className="text-primary" />
                        )}
                    </ToggleGroupItem>
                );
            })}
        </ToggleGroup>
    );
};
