import { type Icon } from '@phosphor-icons/react';
import { motion } from 'motion/react';

import {
    HIDE_SHOW_CONTAINER,
    HIDE_SHOW_ITEM,
} from '@repo/ui/constants/animation';
import { cn } from '@repo/ui/lib/utils';

import { IconBox } from '../icon-box/icon-box';

const MotionIconBox = motion.create(IconBox);

type EmptyProps = {
    size?: 'default' | 'sm';
    heading: string;
    description?: string;
    Icon?: Icon;
    className?: string;
    CTA?: React.ReactNode;
};

export const Empty = ({
    size = 'default',
    heading,
    description,
    Icon,
    className,
    CTA,
}: EmptyProps) => {
    return (
        <motion.section
            className={cn(
                'flex flex-col flex-1 items-center justify-center text-center gap-4 p-4',
                className
            )}
            variants={HIDE_SHOW_CONTAINER}
            initial="hidden"
            animate="show"
        >
            <MotionIconBox size={size} Icon={Icon} variants={HIDE_SHOW_ITEM} />

            <motion.div variants={HIDE_SHOW_ITEM}>
                <h2>{heading}</h2>

                <p className="text-muted-foreground text-sm text-balance">
                    {description}
                </p>
            </motion.div>

            {CTA}
        </motion.section>
    );
};
