import { strFromU8, strToU8, unzlibSync, zlibSync } from "fflate";

const SHARE_SCHEMA_PARAM = "schema";
const LOCAL_SCHEMA_STORAGE_KEY = "ioflux.schema.editor.content";

const toBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const fromBase64Url = (value: string) => {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  const binary = atob(base64);
  const out = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }

  return out;
};

export const encodeSchemaToShareURL = (schema: unknown, href = window.location.href) => {
  const json = JSON.stringify(schema);
  const compressed = zlibSync(strToU8(json));
  const payload = toBase64Url(compressed);

  const url = new URL(href);
  url.searchParams.set(SHARE_SCHEMA_PARAM, payload);

  return url.toString();
};

export const decodeSchemaFromShareURL = (href = window.location.href): unknown | null => {
  try {
    const encoded = new URL(href).searchParams.get(SHARE_SCHEMA_PARAM);
    if (!encoded) return null;

    const bytes = fromBase64Url(encoded);
    const json = strFromU8(unzlibSync(bytes));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const saveSchemaToLocalStorage = (schema: unknown) => {
  localStorage.setItem(LOCAL_SCHEMA_STORAGE_KEY, JSON.stringify(schema, null, 2));
};

const loadSchemaFromLocalStorage = (): unknown | null => {
  const raw = localStorage.getItem(LOCAL_SCHEMA_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const loadInitialSchema = (defaultSchema: unknown) => {
  const schemaFromUrl = decodeSchemaFromShareURL();
  if (schemaFromUrl !== null) {
    saveSchemaToLocalStorage(schemaFromUrl);
    return schemaFromUrl;
  }

  const schemaFromLocalStorage = loadSchemaFromLocalStorage();
  if (schemaFromLocalStorage !== null) {
    return schemaFromLocalStorage;
  }

  return defaultSchema;
};
