import { DeviceMobileIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@repo/ui/components/ui/toggle-group';
import { THEME_VALUES, useTheme, type Theme } from '../providers/theme-provider';
import { Item, ItemContent } from '@repo/ui/components/ui/item';

export const ThemePicker = () => {
    const {theme, setTheme} = useTheme();

    return (
        <Item variant="muted">
            <ItemContent>
                <ToggleGroup
                    value={[theme]}
                    onValueChange={(value) => setTheme((value[0] ?? 'system') as Theme)}
                    variant="outline"
                    className="w-full justify-center"
                >
                    {THEME_VALUES.map((scheme) => {
                        return (
                            <ToggleGroupItem
                                key={scheme}
                                value={scheme}
                                aria-label={scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                                className="flex flex-1 size-16 flex-col items-center justify-center"
                            >
                                <span className="text-2xl leading-none font-light">
                                    {scheme === 'light' && <SunIcon />}
                                    {scheme === 'dark' && <MoonIcon />}
                                    {scheme === 'system' && <DeviceMobileIcon />}
                                </span>
                                <span className="text-xs">
                                    {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                                </span>
                            </ToggleGroupItem>
                        );
                    })}
                </ToggleGroup>
            </ItemContent>
        </Item>
    );
};
