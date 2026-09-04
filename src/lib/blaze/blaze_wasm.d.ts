type BlazeWasmModuleFactory = (opts?: {
  locateFile?: (path: string) => string;
}) => Promise<{ compileSchema: (schemaText: string) => string }>;

declare const factory: BlazeWasmModuleFactory;
export default factory;
