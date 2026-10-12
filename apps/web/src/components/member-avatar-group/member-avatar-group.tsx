import {
    Avatar,
    AvatarFallback,
    AvatarGroup,
    AvatarImage,
} from '@repo/ui/components/ui/avatar';
import { cn } from '@repo/ui/lib/utils';

import type { User } from '../../lib/dexie/types';

type MemberAvatarGroupProps = {
    members: User[];
    className?: string;
};

export const MemberAvatarGroup = ({
    members,
    className,
}: MemberAvatarGroupProps) => {
    return (
        <AvatarGroup className={cn(className)}>
            {members.map(({ id, name, image }) => (
                <Avatar size="sm" key={id}>
                    {image ? <AvatarImage src={image} /> : null}
                    <AvatarFallback
                        className={cn(name === 'Grace' && 'bg-primary')}
                    >
                        {name?.[0]}
                    </AvatarFallback>
                </Avatar>
            ))}
        </AvatarGroup>
    );
};
