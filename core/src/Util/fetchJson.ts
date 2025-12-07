import { Logger } from './Logger';

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const data = await fetch(url, options);
    const json = await data.json();
    return json as T;
  } catch (error) {
    Logger.error(error);
    throw error;
  }
}
