import type { GraphNode } from './processAST';

export type CollisionAlgorithmOptions = {
    maxIterations: number;
    overlapThreshold: number;
    margin: number;
    direction?: "LR" | "TB";
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
    { maxIterations = 50, overlapThreshold = 0.5, margin = 0, direction = "LR" },
) => {
    const boxes = getBoxesFromNodes(nodes, margin);
    const isHorizontal = direction === "LR";
    console.log("[resolveCollisions] Running direction:", direction, "node count:", nodes.length);

    for (let iter = 0; iter <= maxIterations; iter++) {
        let moved = false;

        for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
                const A = boxes[i];
                const B = boxes[j];

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

                // Check if there's significant overlap
                if (px > overlapThreshold && py > overlapThreshold) {
                    moved = A.moved = B.moved = true;
                    console.log(`[resolveCollisions] Overlap between ${A.node.id} and ${B.node.id}. px: ${px}, py: ${py}`);

                    if (isHorizontal) {
                        // Resolve vertically (adjust Y, preserve X)
                        const dirY = dy >= 0 ? 1 : -1;
                        const moveAmount = py * 0.5;
                        A.y += moveAmount * dirY;
                        B.y -= moveAmount * dirY;
                    } else {
                        // Resolve horizontally (adjust X, preserve Y)
                        const dirX = dx >= 0 ? 1 : -1;
                        const moveAmount = px * 0.5;
                        A.x += moveAmount * dirX;
                        B.x -= moveAmount * dirX;
                    }
                }
            }
        }

        if (!moved) break;
    }

    const newNodes = boxes.map((box) => {
        if (box.moved) {
            console.log(`[resolveCollisions] Moved node ${box.node.id} to x: ${isHorizontal ? box.node.position.x : box.x + margin}, y: ${isHorizontal ? box.y + margin : box.node.position.y}`);
            return {
                ...box.node,
                position: {
                    x: isHorizontal ? box.node.position.x : box.x + margin,
                    y: isHorizontal ? box.y + margin : box.node.position.y,
                },
            };
        }
        return box.node;
    });

    return newNodes;
};
