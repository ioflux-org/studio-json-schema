import type { GraphNode } from './processAST';

export type CollisionAlgorithmOptions = {
    maxIterations: number;
    overlapThreshold: number;
    margin: number;
};

export type CollisionAlgorithm = (
    nodes: GraphNode[],
    options: CollisionAlgorithmOptions,
) => GraphNode[];

type Box = {
    x: number;
    y: number;
    width: number;
    height: number;
    moved: boolean;
    node: GraphNode;
};

function getBoxesFromNodes(nodes: GraphNode[], margin: number = 0): Box[] {
    const boxes: Box[] = new Array(nodes.length);

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        boxes[i] = {
            x: node.position.x - margin,
            y: node.position.y - margin,
            width: (node.width ?? node.measured?.width ?? 0) + margin * 2,
            height: (node.height ?? node.measured?.height ?? 0) + margin * 2,
            node,
            moved: false,
        };
    }

    return boxes;
}

export const resolveCollisions: CollisionAlgorithm = (
    nodes,
    { maxIterations = 50, overlapThreshold = 0.5, margin = 0 },
) => {
    const boxes = getBoxesFromNodes(nodes, margin);

    const depthBuckets = new Map<number, Box[]>();
    for (const box of boxes) {
        const depth = box.node.depth;
        if (!depthBuckets.has(depth)) depthBuckets.set(depth, []);
        depthBuckets.get(depth)!.push(box);
    }

    function resolveBoxPairs(listA: Box[], listB: Box[], sameColumn: boolean): boolean {
        let moved = false;
        for (let i = 0; i < listA.length; i++) {
            for (let j = sameColumn ? i + 1 : 0; j < listB.length; j++) {
                const A = listA[i];
                const B = listB[j];

                // Calculate center positions
                const centerAX = A.x + A.width * 0.5;
                const centerAY = A.y + A.height * 0.5;
                const centerBX = B.x + B.width * 0.5;
                const centerBY = B.y + B.height * 0.5;

                // Calculate distance between centers
                const dx = centerAX - centerBX;
                const dy = centerAY - centerBY;

                // Calculate overlap along each axis
                const px = (A.width + B.width) * 0.5 - Math.abs(dx);
                const py = (A.height + B.height) * 0.5 - Math.abs(dy);

                // Check if there's significant vertical overlap
                if (px > overlapThreshold && py > overlapThreshold) {
                    moved = A.moved = B.moved = true;
                    const moveAmount = py * 0.5;
                    if (dy <= 0) {
                        // A is above B
                        A.y -= moveAmount;
                        B.y += moveAmount;
                    } else {
                        // A is below B
                        A.y += moveAmount;
                        B.y -= moveAmount;
                    }
                }
            }
        }
        return moved;
    }

    const sortedDepths = Array.from(depthBuckets.keys()).sort((a, b) => a - b);

    const bucketXRange = new Map<number, { minX: number; maxX: number }>();
    for (const depth of sortedDepths) {
        const bucketBoxes = depthBuckets.get(depth)!;
        const minX = Math.min(...bucketBoxes.map((b) => b.x));
        const maxX = Math.max(...bucketBoxes.map((b) => b.x + b.width));
        bucketXRange.set(depth, { minX, maxX });
    }

    for (let iter = 0; iter < maxIterations; iter++) {
        let moved = false;

        for (let i = 0; i < sortedDepths.length; i++) {
            const depthA = sortedDepths[i];
            const bucketA = depthBuckets.get(depthA)!;
            bucketA.sort((a, b) => a.y - b.y);

            if (resolveBoxPairs(bucketA, bucketA, true)) moved = true;
            for (let j = i + 1; j < sortedDepths.length; j++) {
                const depthB = sortedDepths[j];
                const rangeA = bucketXRange.get(depthA)!;
                const rangeB = bucketXRange.get(depthB)!;

                if (rangeA.maxX <= rangeB.minX || rangeB.maxX <= rangeA.minX) break;

                const bucketB = depthBuckets.get(depthB)!;
                bucketB.sort((a, b) => a.y - b.y);
                if (resolveBoxPairs(bucketA, bucketB, false)) moved = true;
            }
        }

        if (!moved) break;
    }

    const newNodes = boxes.map((box) => {
        if (box.moved) {
            return {
                ...box.node,
                position: {
                    x: box.node.position.x, // X is preserved
                    y: box.y + margin,
                },
            };
        }
        return box.node;
    });

    return newNodes;
};
