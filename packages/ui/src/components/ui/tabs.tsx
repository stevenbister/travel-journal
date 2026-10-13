import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { cn } from 'cn';

function Tabs({
    className,
    orientation = 'horizontal',
    ...props
}: TabsPrimitive.Root.Props) {
    return (
        <TabsPrimitive.Root
            data-slot="tabs"
            data-orientation={orientation}
            className={cn(
                'group/tabs flex gap-3 data-horizontal:flex-col',
                className
            )}
            {...props}
        />
    );
}

function TabsList({ className, children, ...props }: TabsPrimitive.List.Props) {
    return (
        <TabsPrimitive.List
            data-slot="tabs-list"
            className={cn(
                'relative inline-flex w-fit items-center justify-center gap-1 bg-transparent p-[3px] text-muted-foreground group-data-horizontal/tabs:h-12 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col',
                className
            )}
            {...props}
        >
            {children}
            <TabsIndicator />
        </TabsPrimitive.List>
    );
}

function TabsIndicator({ className, ...props }: TabsPrimitive.Indicator.Props) {
    return (
        <TabsPrimitive.Indicator
            data-slot="tabs-indicator"
            className={cn(
                'pointer-events-none absolute bg-accent transition-[translate,width,height] duration-200 ease-out motion-reduce:transition-none',
                // horizontal
                'group-data-horizontal/tabs:bottom-0 group-data-horizontal/tabs:left-0 group-data-horizontal/tabs:h-0.5 group-data-horizontal/tabs:w-(--active-tab-width) group-data-horizontal/tabs:translate-x-(--active-tab-left)',
                // vertical
                'group-data-vertical/tabs:top-0 group-data-vertical/tabs:right-0 group-data-vertical/tabs:h-(--active-tab-height) group-data-vertical/tabs:w-0.5 group-data-vertical/tabs:translate-y-(--active-tab-top)',
                className
            )}
            {...props}
        />
    );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
    return (
        <TabsPrimitive.Tab
            data-slot="tabs-trigger"
            className={cn(
                "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent bg-transparent p-2 text-sm font-medium whitespace-nowrap text-foreground/60 transition-colors group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground data-active:text-foreground dark:data-active:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className
            )}
            {...props}
        />
    );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
    return (
        <TabsPrimitive.Panel
            data-slot="tabs-content"
            className={cn('flex-1 text-sm outline-none', className)}
            {...props}
        />
    );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
