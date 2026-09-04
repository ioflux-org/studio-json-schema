export declare class Blaze {
  constructor(template: unknown);
  validate(
    instance: unknown,
    callback?: (
      type: "pre" | "post",
      valid: boolean,
      instruction: unknown[],
      evaluatePath: string,
      instanceLocation: string,
      annotation: unknown
    ) => void
  ): boolean;
}

export declare function describe(
  valid: boolean,
  instruction: unknown[],
  evaluatePath: string,
  instanceLocation: string,
  instance: unknown,
  annotation: unknown
): string;
