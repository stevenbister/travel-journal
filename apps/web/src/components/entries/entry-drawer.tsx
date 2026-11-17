import { useEffect, useRef, useState } from 'react';

import { Card, CardContent } from '@repo/ui/components/ui/card';
import {
    Carousel,
    type CarouselApi,
    CarouselContent,
    CarouselItem,
} from '@repo/ui/components/ui/carousel';
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
} from '@repo/ui/components/ui/drawer';

import type { Entry } from '../../lib/dexie/types';
import { EntryDetails } from './entry-details';

type EntryDrawerProps = {
    entries: Entry[];
    entryId: string;
    onActiveEntryChange: (_entryId: string) => void;
    trigger?: React.ReactElement;
    isOpen: boolean;
    setIsOpen: (_isOpen: boolean) => void;
};

export const EntryDrawer = ({
    entries,
    entryId,
    onActiveEntryChange,
    trigger,
    isOpen,
    setIsOpen,
}: EntryDrawerProps) => {
    const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

    const activeIndex = Math.max(
        entries.findIndex((entry) => entry.id === entryId),
        0
    );

    // Jump to the focused slide without animation on mount, then animate
    // whenever the focused entry changes elsewhere (e.g. a pin click).
    const hasInitializedRef = useRef(false);

    useEffect(() => {
        if (!carouselApi) return;

        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true;
            carouselApi.scrollTo(activeIndex, true);
            return;
        }

        if (carouselApi.selectedScrollSnap() !== activeIndex) {
            carouselApi.scrollTo(activeIndex);
        }
    }, [carouselApi, activeIndex]);

    // Report swipes to the parent so it can move the map focus. A latest-ref
    // keeps the embla listener stable across renders.
    const onSelectRef = useRef<(_api: CarouselApi) => void>(() => {});

    useEffect(() => {
        onSelectRef.current = (api) => {
            const entry = entries[api!.selectedScrollSnap()];
            if (entry && entry.id !== entryId) {
                onActiveEntryChange(entry.id);
            }
        };
    });

    useEffect(() => {
        if (!carouselApi) return;

        const handleSelect = () => onSelectRef.current(carouselApi);

        carouselApi.on('select', handleSelect);
        return () => {
            carouselApi.off('select', handleSelect);
        };
    }, [carouselApi]);

    if (entries.length === 0) {
        return null;
    }

    return (
        <Drawer
            modal={false}
            disablePointerDismissal
            open={isOpen}
            onOpenChange={setIsOpen}
        >
            {trigger ? (
                <DrawerTrigger
                    className="aria-expanded:text-primary transition-colors"
                    render={trigger}
                />
            ) : null}

            <DrawerContent>
                <Card>
                    <CardContent>
                        <Carousel
                            setApi={setCarouselApi}
                            opts={{ watchDrag: entries.length > 1 }}
                            className="w-full"
                            // Let the carousel own horizontal gestures: the
                            // drawer's touch pipeline claims touchmoves and
                            // would otherwise break embla's drag tracking.
                            data-base-ui-swipe-ignore="true"
                        >
                            <CarouselContent className="ml-0 touch-pan-y select-none">
                                {entries.map((entry) => (
                                    <CarouselItem
                                        key={entry.id}
                                        className="pl-0"
                                    >
                                        <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                                            <EntryDetails
                                                entry={entry}
                                                dateType="date"
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>

                            {entries.length > 1 ? (
                                <p className="text-muted-foreground text-xs tabular-nums text-center">
                                    {activeIndex + 1} / {entries.length}
                                </p>
                            ) : null}
                        </Carousel>
                    </CardContent>
                </Card>
            </DrawerContent>
        </Drawer>
    );
};
