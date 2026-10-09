import { motion } from 'motion/react';

import {
    HIDE_SHOW_CONTAINER,
    HIDE_SHOW_ITEM,
} from '@repo/ui/constants/animation';

export const Section = ({
    heading,
    children,
}: {
    heading?: string;
    children: React.ReactNode;
}) => (
    <motion.section
        className="flex flex-col gap-3"
        variants={HIDE_SHOW_CONTAINER}
        initial="hidden"
        animate="show"
    >
        {heading ? (
            <motion.h2
                className="font-sans text-muted-foreground text-sm font-medium "
                variants={HIDE_SHOW_ITEM}
            >
                {heading}
            </motion.h2>
        ) : null}

        <motion.div variants={HIDE_SHOW_ITEM}>{children}</motion.div>
    </motion.section>
);
