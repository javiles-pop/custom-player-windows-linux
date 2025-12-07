import { ShadowResolution } from '@core/constants';
import { Logger } from './Logger';

/**
 * Maps a shadow resolution value to a specific device resolution format
 * @param shadowResolution Resolution value from the shadow
 * @param bestResolution Best resolution available from the device
 * @returns A string in the format "widthxheightxfrequency" or the best resolution if Auto is selected
 */
export const mapShadowResolutionToDevice = (
  shadowResolution?: string,
  bestResolution?: string
): { width: number; height: number; frequency: number } => {
  Logger.debug(`[DISPLAY] Mapping shadow resolution ${shadowResolution} to device resolution`);
  // If no resolution is provided, default to FHD
  if (!shadowResolution) {
    return { width: 1920, height: 1080, frequency: 60 };
  }

  // Default frequency for all resolutions
  const defaultFrequency = 60;

  // If bestResolution is provided and we're using AUTO, parse the best resolution
  if (shadowResolution === ShadowResolution.AUTO && bestResolution) {
    const [bestWidth, bestHeight, bestFreq] = bestResolution.replace('@', 'x').split('x').map(Number);
    return { width: bestWidth, height: bestHeight, frequency: bestFreq || defaultFrequency };
  }

  // Handle predefined resolutions
  switch (shadowResolution) {
    case ShadowResolution.UHD:
      return { width: 3840, height: 2160, frequency: defaultFrequency };
    case ShadowResolution.FHD:
      return { width: 1920, height: 1080, frequency: defaultFrequency };
    case ShadowResolution.HD:
      return { width: 1280, height: 720, frequency: defaultFrequency };
    case ShadowResolution['1024x768']:
      return { width: 1024, height: 768, frequency: defaultFrequency };
    case ShadowResolution.CUSTOM:
      // For custom, we should return the current resolution
      if (bestResolution) {
        const [currentWidth, currentHeight, currentFreq] = bestResolution.replace('@', 'x').split('x').map(Number);
        return { width: currentWidth, height: currentHeight, frequency: currentFreq || defaultFrequency };
      }
      // If no current resolution, default to FHD
      return { width: 1920, height: 1080, frequency: defaultFrequency };
    default:
      // Check if the resolution is in the format "widthxheight"
      if (shadowResolution.includes('x')) {
        const [width, height] = shadowResolution.split('x').map(Number);
        if (!isNaN(width) && !isNaN(height)) {
          return { width, height, frequency: defaultFrequency };
        }
      }

      // Default to 1080p if we can't parse the value
      Logger.warn(`[DISPLAY] Unknown resolution format: ${shadowResolution}, defaulting to 1080p`);
      return { width: 1920, height: 1080, frequency: defaultFrequency };
  }
};

/**
 * Maps a device resolution to a shadow resolution value
 * @param width Screen width
 * @param height Screen height
 * @returns The corresponding shadow resolution value
 */
export const mapDeviceResolutionToShadow = (width: number, height: number, best: string): string => {
  const [bestW, bestH] = best.replace('@', 'x').split('x').map(Number);
  if (bestW === width && bestH === height) {
    return ShadowResolution.AUTO;
  }
  // Check for standard resolutions
  if (width === 3840 && height === 2160) {
    return ShadowResolution.UHD;
  } else if (width === 1920 && height === 1080) {
    return ShadowResolution.FHD;
  } else if (width === 1280 && height === 720) {
    return ShadowResolution.HD;
  } else if (width === 1024 && height === 768) {
    return ShadowResolution['1024x768'];
  }

  // For any other resolution, return a custom format
  return ShadowResolution.CUSTOM;
};
