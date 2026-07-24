import type { AST } from "@hyperjump/json-schema/experimental";

type KeywordTuple = [string, string, unknown];
type ASTNodeValue = KeywordTuple[];

const findDependencies = (
    node: ASTNodeValue,
    currentKey: string,
    validKeysSet: Set<string>
): Set<string> => {
    const deps = new Set<string>();

    const traverse = (obj: unknown) => {
        if (typeof obj === "string" && validKeysSet.has(obj) && obj !== currentKey) {
            deps.add(obj);
        } else if (Array.isArray(obj)) {
            obj.forEach(traverse);
        } else if (obj !== null && typeof obj === "object") {
            Object.values(obj).forEach(traverse);
        }
    };

    node.forEach(([, , compiledKeywordValue]) => {
        traverse(compiledKeywordValue);
    });

    return deps;
};

export const sortAST = (ast: AST) => {
    const DEF_KEY = "https://json-schema.org/keyword/definitions";

    const astKeys = Object.keys(ast).filter(k => k !== "metaData" && k !== "plugins");
    const validKeysSet = new Set(astKeys);

    const adjList: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};

    astKeys.forEach(k => {
        adjList[k] = [];
        inDegree[k] = 0;
    });

    astKeys.forEach(key => {
        const value = (ast as Record<string, ASTNodeValue>)[key];
        const deps = findDependencies(value, key, validKeysSet);
        deps.forEach(dep => {
            if (!adjList[dep].includes(key)) {
                adjList[dep].push(key);
                inDegree[key]++;
            }
        });
    });

    const queue: string[] = [];
    astKeys.forEach(k => { if (inDegree[k] === 0) queue.push(k); });

    const topologicalOrder: string[] = [];
    while (queue.length > 0) {
        const u = queue.shift()!;
        topologicalOrder.push(u);
        adjList[u].forEach(v => {
            inDegree[v]--;
            if (inDegree[v] === 0) queue.push(v);
        });
    }
    astKeys.forEach(k => { if (inDegree[k] > 0) topologicalOrder.push(k); });

    const orderIndex = new Map<string, number>(
        topologicalOrder.map((key, i) => [key, i])
    );

    const sortedAst: AST = {} as AST;
    if (ast.metaData) sortedAst.metaData = ast.metaData;
    if (ast.plugins) sortedAst.plugins = ast.plugins;

    for (const key of Object.keys(ast)) {
        if (key === "metaData" || key === "plugins") continue;
        const nodeKeywords = (ast as Record<string, ASTNodeValue>)[key];
        if (!Array.isArray(nodeKeywords)) {
            (sortedAst as Record<string, ASTNodeValue>)[key] = nodeKeywords;
            continue;
        }

        (sortedAst as Record<string, ASTNodeValue>)[key] = nodeKeywords
            .map(([keywordUri, keywordLocationUri, compiledKeywordValue]): KeywordTuple => {
                if (
                    Array.isArray(compiledKeywordValue) &&
                    compiledKeywordValue.every(v => typeof v === "string" && validKeysSet.has(v))
                ) {
                    const sorted = [...compiledKeywordValue].sort(
                        (a, b) =>
                            (orderIndex.get(a as string) ?? Infinity) -
                            (orderIndex.get(b as string) ?? Infinity)
                    );
                    return [keywordUri, keywordLocationUri, sorted];
                }
                return [keywordUri, keywordLocationUri, compiledKeywordValue];
            })
            .sort((a, b) => {
                const aIsDefs = a[0] === DEF_KEY;
                const bIsDefs = b[0] === DEF_KEY;
                if (aIsDefs && !bIsDefs) return -1;
                if (!aIsDefs && bIsDefs) return 1;
                return 0;
            });
    }

    return sortedAst;
}