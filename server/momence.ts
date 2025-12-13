type MomenceAuthResponse = {
  access_token: string;
  refresh_token?: string;
  refreshToken?: string;
  token_type?: string;
  expires_in?: number;
};

export type MomenceMember = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  phone?: string;
  pictureUrl?: string;
};

export type MomenceMemberDetails = MomenceMember & Record<string, any>;

export type MomenceSession = {
  id: string;
  name?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  durationInMinutes?: number;
  teacher?: { id?: string; firstName?: string; lastName?: string; email?: string; pictureUrl?: string };
  [key: string]: any;
};

class MomenceAPI {
  private accessToken = '';
  private refreshToken = '';
  private accessTokenExpiresAtMs = 0;

  private readonly baseURL: string;
  private readonly authToken: string;
  private readonly username: string;
  private readonly password: string;

  constructor() {
    this.baseURL = process.env.MOMENCE_API_BASE_URL || 'https://api.momence.com/api/v2';
    this.authToken = process.env.MOMENCE_AUTH_TOKEN || '';
    this.username = process.env.MOMENCE_USERNAME || '';
    this.password = process.env.MOMENCE_PASSWORD || '';

    if (!this.authToken || !this.username || !this.password) {
      // Do not log secrets; just signal availability.
      console.warn('Momence API: Missing environment variables. Momence features disabled.');
    }
  }

  isConfigured(): boolean {
    return Boolean(this.authToken && this.username && this.password);
  }

  private isAccessTokenValid(): boolean {
    if (!this.accessToken) return false;
    if (!this.accessTokenExpiresAtMs) return true;
    // Refresh a bit early.
    return Date.now() < this.accessTokenExpiresAtMs - 15_000;
  }

  private async authenticate(): Promise<boolean> {
    if (!this.isConfigured()) return false;

    const response = await fetch(`${this.baseURL}/auth/token`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: `Basic ${this.authToken}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: this.username,
        password: this.password,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Momence authentication failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as MomenceAuthResponse;
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token || data.refreshToken || '';

    if (typeof data.expires_in === 'number') {
      this.accessTokenExpiresAtMs = Date.now() + data.expires_in * 1000;
    } else {
      this.accessTokenExpiresAtMs = 0;
    }

    return Boolean(this.accessToken);
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    if (!this.refreshToken) return false;

    const response = await fetch(`${this.baseURL}/auth/token`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: `Basic ${this.authToken}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as MomenceAuthResponse;
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token || data.refreshToken || this.refreshToken;

    if (typeof data.expires_in === 'number') {
      this.accessTokenExpiresAtMs = Date.now() + data.expires_in * 1000;
    } else {
      this.accessTokenExpiresAtMs = 0;
    }

    return Boolean(this.accessToken);
  }

  private async ensureAccessToken(): Promise<void> {
    if (!this.isConfigured()) throw new Error('Momence is not configured');

    if (this.isAccessTokenValid()) return;

    if (!this.accessToken) {
      await this.authenticate();
      return;
    }

    const refreshed = await this.refreshAccessToken();
    if (refreshed) return;

    await this.authenticate();
  }

  private async authedGetJson(url: string): Promise<any | null> {
    if (!this.isConfigured()) return null;
    await this.ensureAccessToken();

    const doFetch = async (): Promise<Response> => {
      return fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${this.accessToken}`,
        },
      });
    };

    let response = await doFetch();
    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) await this.authenticate();
      response = await doFetch();
    }

    if (!response.ok) return null;
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  async searchCustomers(query: string): Promise<MomenceMember[]> {
    if (!this.isConfigured()) return [];
    const q = String(query || '').trim();
    if (q.length < 2) return [];

    await this.ensureAccessToken();

    const searchUrl = `${this.baseURL}/host/members?page=0&pageSize=100&sortOrder=ASC&sortBy=firstName&query=${encodeURIComponent(q)}`;

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) return this.searchCustomers(q);
      await this.authenticate();
      return this.searchCustomers(q);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Momence customer search failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as any;
    return (data?.payload || []) as MomenceMember[];
  }

  async getCustomerById(memberId: string): Promise<MomenceMemberDetails | null> {
    if (!this.isConfigured()) return null;
    const id = String(memberId || '').trim();
    if (!id) return null;

    await this.ensureAccessToken();

    const memberResponse = await fetch(`${this.baseURL}/host/members/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (memberResponse.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) return this.getCustomerById(id);
      await this.authenticate();
      return this.getCustomerById(id);
    }

    if (!memberResponse.ok) {
      return null;
    }

    const member = (await memberResponse.json()) as MomenceMemberDetails;

    // Best-effort enrichment: active memberships + recent sessions booked.
    // Momence payload shapes can vary; attempt a few plausible endpoints.
    const pickFirst = async (urls: string[]) => {
      for (const url of urls) {
        const json = await this.authedGetJson(url);
        if (json) return json;
      }
      return null;
    };

    const unwrapPayload = (json: any) => (json && typeof json === 'object' && 'payload' in json ? (json as any).payload : json);

    const [membershipsJson, bookingsJson] = await Promise.all([
      pickFirst([
        `${this.baseURL}/host/members/${encodeURIComponent(id)}/memberships`,
        `${this.baseURL}/host/members/${encodeURIComponent(id)}/membership`,
        `${this.baseURL}/host/members/${encodeURIComponent(id)}/active-memberships`,
        `${this.baseURL}/host/memberships?memberId=${encodeURIComponent(id)}&page=0&pageSize=50`,
      ]),
      pickFirst([
        `${this.baseURL}/host/members/${encodeURIComponent(id)}/bookings?page=0&pageSize=20&sortOrder=DESC&sortBy=startsAt`,
        `${this.baseURL}/host/members/${encodeURIComponent(id)}/sessions?page=0&pageSize=20&sortOrder=DESC&sortBy=startsAt`,
        `${this.baseURL}/host/bookings?memberId=${encodeURIComponent(id)}&page=0&pageSize=20&sortOrder=DESC&sortBy=startsAt`,
      ]),
    ]);

    const memberships = unwrapPayload(membershipsJson);
    if (Array.isArray(memberships)) {
      (member as any).activeMemberships = memberships;
    }

    const bookings = unwrapPayload(bookingsJson);
    if (Array.isArray(bookings)) {
      (member as any).recentSessionsBooked = bookings;
    }

    return member;
  }

  async searchSessionsByName(query: string, maxPages = 2): Promise<MomenceSession[]> {
    if (!this.isConfigured()) return [];
    const q = String(query || '').trim();
    if (q.length < 2) return [];

    await this.ensureAccessToken();

    // Momence sessions endpoint doesn’t clearly expose server-side search in our current knowledge,
    // so do a light client-side filter over a small number of pages.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startsBefore = `${tomorrow.toISOString().split('.')[0]}Z`;

    const all: MomenceSession[] = [];
    for (let page = 0; page < maxPages; page++) {
      const url = `${this.baseURL}/host/sessions?page=${page}&pageSize=200&sortOrder=DESC&sortBy=startsAt&includeCancelled=false&startsBefore=${encodeURIComponent(startsBefore)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (response.status === 401) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) return this.searchSessionsByName(q, maxPages);
        await this.authenticate();
        return this.searchSessionsByName(q, maxPages);
      }

      if (!response.ok) break;

      const data = (await response.json()) as any;
      const payload = (data?.payload || []) as MomenceSession[];
      all.push(...payload);
      if (payload.length < 200) break;
    }

    const lower = q.toLowerCase();
    return all.filter((s) => String(s?.name || '').toLowerCase().includes(lower));
  }

  async getSessionById(sessionId: string): Promise<MomenceSession | null> {
    if (!this.isConfigured()) return null;
    const id = String(sessionId || '').trim();
    if (!id) return null;

    await this.ensureAccessToken();

    const response = await fetch(`${this.baseURL}/host/sessions/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) return this.getSessionById(id);
      await this.authenticate();
      return this.getSessionById(id);
    }

    if (!response.ok) return null;
    return (await response.json()) as MomenceSession;
  }
}

export const momence = new MomenceAPI();
