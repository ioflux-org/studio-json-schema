/**
 * Read design-token primitives from src/index.css so JS consumers
 * (Monaco themes, the graph palette) share the same source of truth as CSS.
 *
 * Primitives live on :root and are theme-independent, so they can be read
 * once and cached regardless of the active data-theme.
 */

const cache = new Map<string, string>();

const expandHexShorthand = (value: string): string => {
    if (!/^#[0-9a-fA-F]{3,4}$/.test(value)) return value;
    return `#${[...value.slice(1)].map((c) => c + c).join("")}`;
};

export const cssToken = (name: string): string => {
    let value = cache.get(name);
    if (value === undefined) {
        value = expandHexShorthand(
            getComputedStyle(document.documentElement).getPropertyValue(name).trim()
        );
        cache.set(name, value);
    }
    return value;
};

export type GraphPalette = {
    string: string;
    number: string;
    integer: string;
    boolean: string;
    array: string;
    object: string;
    null: string;
    booleanSchemaTrue: string;
    booleanSchemaFalse: string;
    reference: string;
    multiType: string;
    others: string;
};

let graphPaletteCache: GraphPalette | null = null;

/** Categorical node-type colors (CVD-validated — see index.css). */
export const graphPalette = (): GraphPalette => {
    graphPaletteCache ??= {
        string: cssToken("--graph-string"),
        number: cssToken("--graph-number"),
        integer: cssToken("--graph-number"),
        boolean: cssToken("--graph-boolean"),
        array: cssToken("--graph-array"),
        object: cssToken("--graph-object"),
        null: cssToken("--graph-null"),
        booleanSchemaTrue: cssToken("--graph-true"),
        booleanSchemaFalse: cssToken("--graph-false"),
        reference: cssToken("--graph-reference"),
        multiType: cssToken("--graph-multi"),
        others: cssToken("--graph-neutral"),
    };
    return graphPaletteCache;
};
