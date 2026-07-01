import type { AST } from "@hyperjump/json-schema/experimental";

export const sortAST = (ast: AST) => {
    const DEF_KEY = "https://json-schema.org/keyword/definitions";

    const sortedAst: AST = {} as AST;
    
    const astKeys = Object.keys(ast).filter(k => k !== "metaData" && k !== "plugins");
    const validKeysSet = new Set(astKeys);

    const adjList: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    
    astKeys.forEach(k => {
        adjList[k] = [];
        inDegree[k] = 0;
    });

    const findDependencies = (node: any, currentKey: string): string[] => {
        const deps = new Set<string>();
        const traverse = (obj: any) => {
            if (typeof obj === "string" && validKeysSet.has(obj) && obj !== currentKey) {
                deps.add(obj);
            } else if (Array.isArray(obj)) {
                obj.forEach(traverse);
            } else if (obj !== null && typeof obj === "object") {
                Object.values(obj).forEach(traverse);
            }
        };
        
        if (Array.isArray(node)) {
            node.forEach(keywordTuple => {
                if (keywordTuple.length >= 3) {
                    traverse(keywordTuple[2]);
                }
            });
        }
        return Array.from(deps);
    };

    astKeys.forEach(key => {
        const value = (ast as any)[key];
        const deps = findDependencies(value, key);
        deps.forEach(dep => {
            if (!adjList[dep].includes(key)) {
                adjList[dep].push(key);
                inDegree[key]++;
            }
        });
    });

    const queue: string[] = [];
    astKeys.forEach(k => {
        if (inDegree[k] === 0) queue.push(k);
    });

    const topologicalOrder: string[] = [];
    
    while (queue.length > 0) {
        const u = queue.shift()!;
        topologicalOrder.push(u);

        adjList[u].forEach(v => {
            inDegree[v]--;
            if (inDegree[v] === 0) {
                queue.push(v);
            }
        });
    }

    astKeys.forEach(k => {
        if (inDegree[k] > 0) {
            topologicalOrder.push(k);
        }
    });

    if (ast.metaData) sortedAst.metaData = ast.metaData;
    if (ast.plugins) sortedAst.plugins = ast.plugins;

    topologicalOrder.forEach(key => {
        const value = (ast as any)[key];
        if (Array.isArray(value)) {
            (sortedAst as any)[key] = [...value].sort((a, b) => {
                const aIsDefs = a[0] === DEF_KEY;
                const bIsDefs = b[0] === DEF_KEY;
                if (aIsDefs && !bIsDefs) return -1;
                if (!aIsDefs && bIsDefs) return 1;
                return 0;
            });
        } else {
            (sortedAst as any)[key] = value;
        }
    });

    return sortedAst;
}