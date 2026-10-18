import {
    ToggleGroup,
    ToggleGroupItem,
} from '@repo/ui/components/ui/toggle-group';

export type BadgeSelectorProps = {
    items: string[];
    value: string[];
    onValueChange: (_value: string[]) => void;
};

export const BadgeSelector = ({
    items,
    value,
    onValueChange,
}: BadgeSelectorProps) => {
    return (
        <ToggleGroup
            value={value}
            onValueChange={onValueChange}
            variant="outline"
            className="overflow-x-auto w-full"
        >
            {items.map((item) => (
                <ToggleGroupItem key={item} value={item}>
                    {item}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    );
};
