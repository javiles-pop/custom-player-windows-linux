export interface BezelCompensation {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export function getLayoutOptions(outputs: VideoModeScreenConfig[]): { value: string }[] {
  const layouts: { value: string }[] = [];

  const enabledOutputs = outputs.filter((output) => output.enabled).length;

  if (enabledOutputs === 1) {
    return [{ value: '1x1' }];
  }

  for (let rows = 1; rows <= enabledOutputs; rows++) {
    for (let cols = 1; cols <= enabledOutputs; cols++) {
      const total = rows * cols;
      if (total === enabledOutputs && enabledOutputs >= 2 && enabledOutputs <= 4) {
        layouts.push({ value: `${cols}x${rows}` });
      }
    }
  }
  return layouts;
}

export function getEstimatedPosition(
  index: number,
  layout: string,
  nativeResolution: string,
  bezelComp?: BezelCompensation,
  transform?: 'normal' | '90' | '180' | '270' // Add rotation parameter
): { x: number; y: number } {
  // estimate based on the current resolution of the active screen, the index, and the layout.
  if (!layout) {
    return { x: 0, y: 0 };
  }
  const [nativeWidth, nativeHeight] = nativeResolution.split('x').map(Number);

  // Default screen dimensions (we could get actual dimensions if available)
  const defaultWidth = nativeWidth || 1920;
  const defaultHeight = nativeHeight || 1080;
  const [cols, rows] = layout.split('x').map(Number);

  if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) {
    return { x: 0, y: 0 };
  }

  const row = Math.floor(index / cols);
  const col = index % cols;

  // Calculate position with bezel compensation
  // Only account for bezels between screens, not on outside edges
  const bezelLeft = bezelComp?.left || 0;
  const bezelRight = bezelComp?.right || 0;
  const bezelTop = bezelComp?.top || 0;
  const bezelBottom = bezelComp?.bottom || 0;

  // For x position: Only add bezels for columns that are not at the edge (col > 0)
  // Each interior column needs to account for the bezels of all previous columns
  const x = col * defaultWidth + (col > 0 ? col * (bezelLeft + bezelRight) : 0);

  // For y position: Only add bezels for rows that are not at the edge (row > 0)
  // Each interior row needs to account for the bezels of all previous rows
  const y = row * defaultHeight + (row > 0 ? row * (bezelTop + bezelBottom) : 0);

  // Adjust position based on rotation
  if (transform) {
    // For 90 or 270 degree rotations, width and height are swapped
    const isRotated90or270 = transform === '90' || transform === '270';
    const effectiveWidth = isRotated90or270 ? defaultHeight : defaultWidth;
    const effectiveHeight = isRotated90or270 ? defaultWidth : defaultHeight;

    // Adjust position based on rotation
    const adjustedX = col * effectiveWidth + (col > 0 ? col * (bezelLeft + bezelRight) : 0);
    const adjustedY = row * effectiveHeight + (row > 0 ? row * (bezelTop + bezelBottom) : 0);

    return { x: adjustedX, y: adjustedY };
  }

  return { x, y };
}

export function extractLayoutFromConfig(config: VideoModeScreenConfig[]): string {
  // use the screenX and screenY properties to determine the layout.
  const enabledOutputs = config.filter((output) => output.enabled);

  if (enabledOutputs.length <= 1) {
    return '1x1';
  }

  // Find unique X and Y positions to determine columns and rows
  const uniqueXPositions = new Set<number>();
  const uniqueYPositions = new Set<number>();

  enabledOutputs.forEach((output) => {
    uniqueXPositions.add(output.screenX);
    uniqueYPositions.add(output.screenY);
  });

  const columns = uniqueXPositions.size;
  const rows = uniqueYPositions.size;

  // Verify that rows × columns equals the number of enabled outputs
  if (rows * columns === enabledOutputs.length) {
    return `${columns}x${rows}`;
  }

  // As a fallback, try to determine a reasonable layout based on positions
  if (enabledOutputs.length >= 2 && enabledOutputs.length <= 4) {
    // If screens are arranged horizontally
    if (uniqueYPositions.size === 1) {
      return `${enabledOutputs.length}x1`;
    }
    // If screens are arranged vertically
    if (uniqueXPositions.size === 1) {
      return `1x${enabledOutputs.length}`;
    }
    // For 4 screens in a grid
    if (enabledOutputs.length === 4) {
      return '2x2';
    }
  }

  return '1x1';
}
