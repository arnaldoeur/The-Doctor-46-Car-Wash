const apiEndpoint = import.meta.env.VITE_APP_API_ENDPOINT || '/api/index.php';
const apiTimeoutMs = 20000;

type ApiEnvelope<T> = {
 success: boolean;
 data: T;
 message?: string;
};

export async function apiRequest<T>(action: string, body?: unknown): Promise<T> {
 const controller = new AbortController();
 const timeoutId = window.setTimeout(() => controller.abort(), apiTimeoutMs);
 let response: Response;

 try {
 response = await fetch(`${apiEndpoint}?action=${encodeURIComponent(action)}`, {
 method: 'POST',
 credentials: 'include',
 signal: controller.signal,
 headers: {
 'Content-Type': 'application/json',
 Accept: 'application/json',
 },
 body: body === undefined ? '{}' : JSON.stringify(body),
 });
 } catch (error) {
 if (error instanceof DOMException && error.name === 'AbortError') {
 throw new Error('A API MySQL demorou demasiado a responder. Tente novamente.');
 }

 throw error;
 } finally {
 window.clearTimeout(timeoutId);
 }

 let payload: ApiEnvelope<T> | null = null;

 try {
 payload = (await response.json()) as ApiEnvelope<T>;
 } catch {
 payload = null;
 }

 if (!response.ok || !payload?.success) {
 throw new Error(payload?.message || 'Nao foi possivel comunicar com a API MySQL.');
 }

 return payload.data;
}
