import * as React from 'react';

// Refreshes "now" whenever the tab/app becomes visible again, so the
// current/upcoming/past grouping doesn't go stale if the app is left open.
export const useNow = () => {
    const [now, setNow] = React.useState(() => new Date().toISOString());

    React.useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                setNow(new Date().toISOString());
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        return () =>
            document.removeEventListener(
                'visibilitychange',
                onVisibilityChange
            );
    }, []);

    return now;
};
