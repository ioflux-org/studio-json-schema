import { compressSync, decompressSync } from 'fflate';

function uint8ArrayToBase64URL(arr: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64URLToUint8Array(str: string): Uint8Array {
  const padding = (4 - (str.length % 4)) % 4;
  const padded = str + '='.repeat(padding);
  
  const standard = padded.replace(/-/g, '+').replace(/_/g, '/');
  
  const binary = atob(standard);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr;
}

export function encodeSchemaToURL(schemaText: string): string | null {
  try {
    if (!schemaText || schemaText.trim().length === 0) {
      return null;
    }
    
    const encoder = new TextEncoder();
    const bytes = encoder.encode(schemaText);

    const compressed = compressSync(bytes);
    
    const encoded = uint8ArrayToBase64URL(compressed);
    
    return `/schema/${encoded}`;
  } catch (error) {
    console.error('Failed to encode schema to URL:', error);
    return null;
  }
}

export function decodeSchemaFromURL(pathname: string): string | null {
  try {
    if (!pathname || !pathname.startsWith('/schema/')) {
      return null;
    }
    
    const encoded = pathname.substring('/schema/'.length);
    
    if (!encoded) {
      return null;
    }
    
    const compressed = base64URLToUint8Array(encoded);
    
    const decompressed = decompressSync(compressed);
    
    const decoder = new TextDecoder();
    const schemaText = decoder.decode(decompressed);
    
    if (!schemaText) {
      console.warn('Failed to decompress schema from URL');
      return null;
    }
    
    return schemaText;
  } catch (error) {
    console.error('Failed to decode schema from URL:', error);
    return null;
  }
}

export function hasSchemaInURL(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const pathname = window.location.pathname;

  return pathname.startsWith('/schema/') && pathname.length > '/schema/'.length;
}

export function getSchemaPathFromURL(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  
  return window.location.pathname;
}

export function updateURLWithSchema(schemaText: string): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    
    const encodedPath = encodeSchemaToURL(schemaText);
    
    if (encodedPath) {
      window.history.replaceState(null, '', encodedPath);
    }
  } catch (error) {
    console.error('Failed to update URL with schema:', error);
  }
}
