import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react";

const LANE_GAP = 15;
const MAX_LANES = 7;

export default function CustomRoutedEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {

  const siblingIndex = (data as { siblingIndex?: number })?.siblingIndex ?? 0;

  const wrapped = siblingIndex % MAX_LANES;
  const half = Math.floor(MAX_LANES / 2);
  const laneIndex = wrapped <= half ? wrapped : -(MAX_LANES - wrapped);

  const laneOffset = laneIndex * LANE_GAP;
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
