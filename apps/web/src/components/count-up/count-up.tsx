import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import * as React from 'react';

type CountUpProps = {
    to: number;
    duration?: number;
    className?: string;
};

export function CountUp({ to, duration = 0.7, className }: CountUpProps) {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));

    React.useEffect(() => {
        const controls = animate(count, to, {
            duration,
            ease: 'easeOut',
        });
        return () => controls.stop();
    }, [count, to, duration]);

    return <motion.span className={className}>{rounded}</motion.span>;
}
