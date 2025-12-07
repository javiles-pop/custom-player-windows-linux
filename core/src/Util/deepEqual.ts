/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { ObjectKeys } from './Object';

// only supports objects and arrays
export function deepEqual(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }

    const keys = ObjectKeys(a);
    if (keys.length !== ObjectKeys(b).length) {
      return false;
    }
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        return false;
      }
      if (!deepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }
  return false;
}
