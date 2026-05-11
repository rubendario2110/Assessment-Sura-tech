import { TimeoutError } from "../domain/errors.js";

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  dependencyName: string,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    const err = e as Error;
    if (err?.name === "AbortError") {
      throw new TimeoutError(`Request to dependency "${dependencyName}" exceeded ${timeoutMs}ms`);
    }
    throw e;
  } finally {
    clearTimeout(id);
  }
}
