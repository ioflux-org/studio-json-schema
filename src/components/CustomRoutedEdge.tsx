import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
export default function CustomRoutedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  // Simple hash function to generate a pseudo-random number from the edge ID
  const hash = id.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  // Creates 7 distinct lanes (-3 to 3), each 15px apart
  const laneIndex = (Math.abs(hash) % 7) - 3;
  const laneOffset = laneIndex * 15;

  // Calculate the custom X center point for the vertical segment of the edge
  const customCenterX = (sourceX + targetX) / 2 + laneOffset;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    centerX: customCenterX,
  });

  return (
    <BaseEdge 
      path={edgePath} 
      markerEnd={markerEnd} 
      style={style} 
    />
  );
}
