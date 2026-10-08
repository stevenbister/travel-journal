import { type TargetAndTransition, type Transition, stagger } from 'motion';

export const SPRING_TRANSITION: Transition = {
    type: 'spring',
    duration: 0.3,
    bounce: 0,
};

export const BUTTON_SCALE: TargetAndTransition = { scale: 0.9 };

export const HIDE_SHOW_CONTAINER = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            delayChildren: stagger(0.1),
        },
    },
} as const;

export const HIDE_SHOW_ITEM = {
    hidden: { y: 50, opacity: 0, transition: { y: { stiffness: 1000 } } },
    show: {
        y: 0,
        opacity: 1,
        transition: { y: { stiffness: 1000, velocity: -100 } },
    },
} as const;
