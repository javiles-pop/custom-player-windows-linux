/** This is not a guaranteed function for all urls. It checks the 90% use-case rules and assumes
 * that the url will be verified to work (200 response code) at some point after this runs.
 * this is purely to prevent typos by the user in the ui.
 **/
export const isValidURLFormat = (url?: string): boolean => {
  return url
    ? !!url.match(
        /(https?|ftp|file|ntp):\/\/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi
      ) || url.includes('localhost')
    : false;
};

/** compares proper semantic version numbers to see if the new one matches the old one. may not work in
 *  some cases where the versions do not follow the Major.Minor.Patch version scheme. Returns true if
 * the new version is greater than the current version.
 */
export function semverIsGreater(currentVersion: string, newVersion: string): boolean {
  const currentVersionArray = currentVersion.split('.').map((str) => parseInt(str));
  const newVersionArray = newVersion.split('.').map((str) => parseInt(str));

  // take shorter length array if different.
  const minLen = Math.min(currentVersionArray.length, newVersionArray.length);
  for (let i = 0; i < minLen; ++i) {
    // we can return a result early if we have a mismatch in each iteration.
    if (currentVersionArray[i] > newVersionArray[i]) return false;
    if (currentVersionArray[i] < newVersionArray[i]) return true;
  }

  // same version or invalid semver formats.
  return !!(currentVersionArray.length - newVersionArray.length);
}

export function semverIsGreaterOrEqual(currentVersion: string, newVersion: string): boolean {
  if (currentVersion === newVersion) return true;
  return semverIsGreater(currentVersion, newVersion);
}

// NOTE: This is not a feature complete function. Add cases as needed.
export const pluralize = (str: string, qty: number) => {
  // zero or multiple.
  if (qty !== 1) {
    if (str.substring(str.length - 1, str.length - 3) !== 'y') {
      return str + 's';
    } else {
      return str.substring(-1) + 'ies';
    }
  }
  // singular
  return str;
};

export function isValidIPV4(testString: string): boolean {
  return !!testString.match(/^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/);
}
