import { DeviceMobileIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';

import { Card, CardContent } from '@repo/ui/components/ui/card';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@repo/ui/components/ui/toggle-group';

import {
    THEME_VALUES,
    type Theme,
    useTheme,
} from '../providers/theme-provider';

export const ThemePicker = () => {
    const { theme, setTheme } = useTheme();

    return (
        <Card size="sm">
            <CardContent>
                <ToggleGroup
                    value={[theme]}
                    onValueChange={(value) =>
                        setTheme((value[0] ?? 'system') as Theme)
                    }
                    variant="outline"
                    className="w-full justify-center"
                >
                    {THEME_VALUES.map((scheme) => {
                        return (
                            <ToggleGroupItem
                                key={scheme}
                                value={scheme}
                                aria-label={
                                    scheme.charAt(0).toUpperCase() +
                                    scheme.slice(1)
                                }
                                className="flex flex-1 size-16 flex-col items-center justify-center"
                            >
                                <span className="text-2xl leading-none font-light">
                                    {scheme === 'light' && <SunIcon />}
                                    {scheme === 'dark' && <MoonIcon />}
                                    {scheme === 'system' && (
                                        <DeviceMobileIcon />
                                    )}
                                </span>
                                <span className="text-xs">
                                    {scheme.charAt(0).toUpperCase() +
                                        scheme.slice(1)}
                                </span>
                            </ToggleGroupItem>
                        );
                    })}
                </ToggleGroup>
            </CardContent>
        </Card>
    );
};
