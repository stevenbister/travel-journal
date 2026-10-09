export const Section = ({
    heading,
    children,
}: {
    heading?: string;
    children: React.ReactNode;
}) => (
    <section className="flex flex-col gap-3">
        {heading ? (
            <h2 className="font-sans text-muted-foreground text-sm font-medium ">
                {heading}
            </h2>
        ) : null}
        {children}
    </section>
);
