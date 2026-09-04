// Blaze's `evaluatePath` follows the JSON Schema spec's evaluation-path
// format: crossing a `$ref` inserts the literal token "$ref" into the path,
// then continues with the *referenced* schema's own relative path — so the
// raw evaluatePath does not line up 1:1 with where that keyword physically
// sits in the pasted schema text. This walks the same path against the
// parsed schema, following any `$ref` it crosses, to recover the pointer
// that actually matches a position computeJsonPositions recorded.

const unescapeToken = (token: string): string =>
  token.replace(/~1/g, "/").replace(/~0/g, "~");

const escapeToken = (token: string): string =>
  token.replace(/~/g, "~0").replace(/\//g, "~1");

const splitPointer = (pointer: string): string[] =>
  pointer === "" ? [] : pointer.slice(1).split("/");

/**
 * Resolves an evaluatePath (which may contain "$ref" hops) to the actual
 * JSON pointer of the referenced keyword within `schema`. Returns null when
 * the path can't be followed — e.g. it crosses a `$ref` to another document,
 * or a token doesn't exist in the parsed schema.
 */
export const resolveEvaluatePath = (
  schema: unknown,
  evaluatePath: string
): string | null => {
  const tokens = splitPointer(evaluatePath);
  let node: unknown = schema;
  const resolvedTokens: string[] = [];

  for (const rawToken of tokens) {
    if (
      rawToken === "$ref" &&
      node &&
      typeof node === "object" &&
      typeof (node as Record<string, unknown>).$ref === "string"
    ) {
      const target = (node as Record<string, unknown>).$ref as string;
      if (!target.startsWith("#")) return null; // external document, can't follow
      const fragment = decodeURIComponent(target.slice(1));

      // A $ref hop starts over from the document root — discard everything
      // accumulated so far, it's not part of the physical path any more.
      node = schema;
      resolvedTokens.length = 0;
      const fragmentTokens = splitPointer(fragment);
      for (const fragmentToken of fragmentTokens) {
        if (node === null || typeof node !== "object") return null;
        const key = unescapeToken(fragmentToken);
        node = (node as Record<string, unknown>)[key];
        resolvedTokens.push(escapeToken(key));
      }
      continue;
    }

    if (node === null || typeof node !== "object") return null;
    const key = unescapeToken(rawToken);
    node = (node as Record<string, unknown>)[key];
    resolvedTokens.push(escapeToken(key));
  }

  return resolvedTokens.length === 0 ? "" : "/" + resolvedTokens.join("/");
};
