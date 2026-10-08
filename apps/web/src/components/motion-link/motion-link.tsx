import { type LinkComponent, createLink } from '@tanstack/react-router';
import { type HTMLMotionProps, motion } from 'motion/react';
import * as React from 'react';

import { BUTTON_SCALE } from '@repo/ui/constants/animation';

const MotionAnchor = React.forwardRef<HTMLAnchorElement, HTMLMotionProps<'a'>>(
    (props, ref) => <motion.a ref={ref} whileTap={BUTTON_SCALE} {...props} />
);
MotionAnchor.displayName = 'MotionAnchor';

export const MotionLink: LinkComponent<typeof MotionAnchor> =
    createLink(MotionAnchor);
