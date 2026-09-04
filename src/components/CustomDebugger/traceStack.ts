import type { TraceStep, TraceStepType } from "../../lib/blaze";

export type OpenFrame = {
  name: string;
  evaluatePath: string;
  pushIndex: number;
  status: TraceStepType;
};

export const getOpenFrames = (
  steps: TraceStep[],
  uptoIndex: number
): OpenFrame[] => {
  const stack: OpenFrame[] = [];

  for (let i = 0; i <= uptoIndex && i < steps.length; i++) {
    const step = steps[i];
    if (step.type === "push") {
      stack.push({
        name: step.name,
        evaluatePath: step.evaluatePath,
        pushIndex: i,
        status: "push",
      });
      continue;
    }

    const top = stack[stack.length - 1];
    const closesTop = top && top.evaluatePath === step.evaluatePath;
    if (!closesTop) continue;

    if (i === uptoIndex) {
      top.status = step.type;
    } else {
      stack.pop();
    }
  }

  return stack;
};
