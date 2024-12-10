const API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;
const BASE_URL = 'https://api.perplexity.ai';
let currentRequest: AbortController | null = null;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2,
  backoff = 500
): Promise<Response> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    // Cancel any pending request
    if (currentRequest) {
      currentRequest.abort();
    }

    // Create new abort controller for this request
    currentRequest = new AbortController();
    
    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        ...headers
      },
      signal: currentRequest.signal
    };

    const response = await fetch(url, fetchOptions);
    currentRequest = null;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      if (response.status === 401) {
        throw new Error('Invalid API key');
      }
      if (response.status === 403) {
        throw new Error('API access forbidden');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      
      throw new Error(`API request failed: ${errorText}`);
    }
    
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request cancelled');
    }
    
    if (retries === 0) throw error;
    await delay(backoff);
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  }
}

export { API_KEY, BASE_URL };