import type { AST } from "@hyperjump/json-schema/experimental";

const DEF_KEY  = "https://json-schema.org/keyword/definitions"; // legacy
const DEFS_KEY = "https://json-schema.org/keyword/$defs";
const REF_KEY  = "https://json-schema.org/keyword/$ref";

/**
 * Recursively collects all $ref URIs within an AST subtree that point to
 * one of the known sibling $defs URIs.
 *
 * Uses a visited set to safely handle circular references.
 */
const findSiblingRefs = (
    ast: AST,
    uri: string,
    siblingUris: Set<string>,
    visited: Set<string> = new Set()
): string[] => {
    if (visited.has(uri)) return [];
    visited.add(uri);

    const refs: string[] = [];
    const node = ast[uri];
    if (!node || typeof node === "boolean") return refs;

    for (const [handlerName, , value] of node as [string, string, unknown][]) {
        if (handlerName === REF_KEY && typeof value === "string" && siblingUris.has(value)) {
            refs.push(value);
        }
        // Recurse into child schemas referenced by applicator keywords
        if (typeof value === "string" && ast[value] && !siblingUris.has(value)) {
            refs.push(...findSiblingRefs(ast, value, siblingUris, visited));
        } else if (Array.isArray(value)) {
            for (const item of value) {
                if (typeof item === "string" && ast[item]) {
                    refs.push(...findSiblingRefs(ast, item, siblingUris, visited));
                }
            }
        }
    }
    return refs;
};

/**
 * Topologically sorts the $defs URI array using Kahn's algorithm (BFS).
 *
 * Ensures that if definition A references definition B via $ref, B is
 * rendered before A — producing a clean left-to-right graph layout with
 * no spurious back-edges from definitions rendered out of dependency order.
 *
 * Cycle handling: definitions involved in cycles are appended in their
 * original declaration order. processAST already handles cycles safely via
 * the renderedNodes Map (back-edge creation instead of node duplication).
 *
 * @param uris  The $defs keyword value: a string[] of schema URIs
 * @param ast   The full compiled AST for scanning inter-definition $refs
 * @returns     Sorted string[] with dependencies before dependents
 */
const topologicalSortDefs = (uris: string[], ast: AST): string[] => {
    if (uris.length <= 1) return uris;

    // Extract a short name from a URI for deterministic tie-breaking
    // e.g. "http://example.com/schema#/$defs/address" → "address"
    const extractName = (uri: string): string => uri.split("/").pop() ?? uri;

    const siblingUris = new Set(uris);

    // Build adjacency list: graph[uriA] = [uriB] means "render A before B"
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    for (const uri of uris) { graph.set(uri, []); inDegree.set(uri, 0); }

    for (const uri of uris) {
        for (const refUri of findSiblingRefs(ast, uri, siblingUris)) {
            if (refUri !== uri) {
                // uri depends on refUri → refUri must come first
                graph.get(refUri)!.push(uri);
                inDegree.set(uri, (inDegree.get(uri) || 0) + 1);
            }
        }
    }

    // Kahn's BFS — seed with zero-in-degree URIs, sorted by name for determinism
    const queue = uris
        .filter(u => inDegree.get(u) === 0)
        .sort((a, b) => extractName(a).localeCompare(extractName(b)));
    const sorted: string[] = [];

    while (queue.length > 0) {
        const current = queue.shift()!;
        sorted.push(current);
        for (const dep of graph.get(current) || []) {
            const newDeg = (inDegree.get(dep) || 0) - 1;
            inDegree.set(dep, newDeg);
            if (newDeg === 0) {
                const name = extractName(dep);
                const idx = queue.findIndex(u => extractName(u) > name);
                if (idx === -1) queue.push(dep);
                else queue.splice(idx, 0, dep);
            }
        }
    }

    // Append any cyclic nodes in their original declaration order
    const sortedSet = new Set(sorted);
    for (const uri of uris) {
        if (!sortedSet.has(uri)) sorted.push(uri);
    }

    return sorted;
};

export const sortAST = (ast: AST) => {
    const sortedAst: AST = {} as AST;

    for (const key of Object.keys(ast)) {
        const value = ast[key];

        if (Array.isArray(value)) {
            // Move $defs / definitions to front so processAST renders them first
            sortedAst[key] = [...value].sort((a, b) => {
                const aIsDefs = a[0] === DEF_KEY || a[0] === DEFS_KEY;
                const bIsDefs = b[0] === DEF_KEY || b[0] === DEFS_KEY;
                if (aIsDefs && !bIsDefs) return -1;
                if (!aIsDefs && bIsDefs) return 1;
                return 0;
            });

            // Topologically sort the URIs within the $defs value array
            for (const keyword of sortedAst[key] as [string, string, unknown][]) {
                if (keyword[0] === DEFS_KEY && Array.isArray(keyword[2])) {
                    keyword[2] = topologicalSortDefs(keyword[2] as string[], ast);
                }
            }
        } else {
            // boolean or meta sections (metaData, plugins)
            sortedAst[key] = value;
        }
    }
    return sortedAst;
};
