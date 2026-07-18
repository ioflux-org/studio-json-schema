export const getKeywordDocLink = (keywordLabel: string) => {
  const base = "https://www.learnjsonschema.com/2020-12";
  const map: Record<string, string> = {
    // core
    $id: `${base}/core/id/`,
    $schema: `${base}/core/schema/`,
    $ref: `${base}/core/ref/`,
    $comment: `${base}/core/comment/`,
    $defs: `${base}/core/defs/`,
    $anchor: `${base}/core/anchor/`,
    $dynamicAnchor: `${base}/core/dynamicanchor/`,
    $dynamicRef: `${base}/core/dynamicref/`,
    $vocabulary: `${base}/core/vocabulary/`,

    // applicator
    additionalProperties: `${base}/applicator/additionalproperties/`,
    allOf: `${base}/applicator/allof/`,
    anyOf: `${base}/applicator/anyof/`,
    contains: `${base}/applicator/contains/`,
    dependentSchemas: `${base}/applicator/dependentschemas/`,
    else: `${base}/applicator/else/`,
    if: `${base}/applicator/if/`,
    items: `${base}/applicator/items/`,
    not: `${base}/applicator/not/`,
    oneOf: `${base}/applicator/oneof/`,
    patternProperties: `${base}/applicator/patternproperties/`,
    prefixItems: `${base}/applicator/prefixitems/`,
    properties: `${base}/applicator/properties/`,
    propertyNames: `${base}/applicator/propertynames/`,
    then: `${base}/applicator/then/`,

    // unevaluated
    unevaluatedItems: `${base}/unevaluated/unevaluateditems/`,
    unevaluatedProperties: `${base}/unevaluated/unevaluatedproperties/`,

    // validation
    const: `${base}/validation/const/`,
    dependentRequired: `${base}/validation/dependentrequired/`,
    enum: `${base}/validation/enum/`,
    exclusiveMaximum: `${base}/validation/exclusivemaximum/`,
    exclusiveMinimum: `${base}/validation/exclusiveminimum/`,
    maxContains: `${base}/validation/maxcontains/`,
    maximum: `${base}/validation/maximum/`,
    maxItems: `${base}/validation/maxitems/`,
    maxLength: `${base}/validation/maxlength/`,
    maxProperties: `${base}/validation/maxproperties/`,
    minContains: `${base}/validation/mincontains/`,
    minimum: `${base}/validation/minimum/`,
    minItems: `${base}/validation/minitems/`,
    minLength: `${base}/validation/minlength/`,
    minProperties: `${base}/validation/minproperties/`,
    multipleOf: `${base}/validation/multipleof/`,
    pattern: `${base}/validation/pattern/`,
    required: `${base}/validation/required/`,
    type: `${base}/validation/type/`,
    uniqueItems: `${base}/validation/uniqueitems/`,
  };

  return map[keywordLabel] || `${base}/`;
};
