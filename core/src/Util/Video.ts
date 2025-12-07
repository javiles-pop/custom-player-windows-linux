export function BSdoesUpscaleVideo(model: string): boolean {
  const matchResult = model.match(/([a-zA-Z]+)(\d+)/);
  const modelFamily = matchResult ? matchResult[1] : '';
  if (modelFamily === 'XT' || modelFamily === 'XC') {
    return false;
  }
  return true;
}
