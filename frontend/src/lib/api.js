function isLocalHost(url) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

function getApiUrl() {
  const configured = (import.meta.env.VITE_API_URL || '').trim();

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const onLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (!onLocalhost) {
      if (configured && !isLocalHost(configured)) {
        return configured.replace(/\/$/, '');
      }
      return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    }
  }

  if (configured) return configured.replace(/\/$/, '');
  return 'http://localhost:3001';
}

async function request(path, options = {}) {
  const res = await fetch(`${getApiUrl()}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error de servidor');
  }
  return data;
}

export const api = {
  health: () => request('/api/health'),
  getCampaign: (slug) => request(`/api/campaigns/${slug}`),
  getNumbers: (slug, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/campaigns/${slug}/numbers${qs ? `?${qs}` : ''}`);
  },
  createLead: (slug, body) =>
    request(`/api/campaigns/${slug}/leads`, {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  createInquiry: (body) =>
    request('/api/agency/inquiries', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  admin: {
    dashboard: (token) =>
      request('/api/admin/dashboard', { headers: { 'x-admin-token': token } }),
    campaigns: (token) =>
      request('/api/admin/campaigns', { headers: { 'x-admin-token': token } }),
    leads: (token, campaignId) =>
      request(`/api/admin/leads${campaignId ? `?campaign_id=${campaignId}` : ''}`, {
        headers: { 'x-admin-token': token }
      }),
    proposals: (token, campaignId) =>
      request(`/api/admin/proposals${campaignId ? `?campaign_id=${campaignId}` : ''}`, {
        headers: { 'x-admin-token': token }
      }),
    inquiries: (token) =>
      request('/api/admin/agency/inquiries', {
        headers: { 'x-admin-token': token }
      }),
    createCampaign: (token, body) =>
      request('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'x-admin-token': token },
        body: JSON.stringify(body)
      }),
    generateNumbers: (token, campaignId, count = 200) =>
      request(`/api/admin/campaigns/${campaignId}/numbers/generate`, {
        method: 'POST',
        headers: { 'x-admin-token': token },
        body: JSON.stringify({ count })
      })
  }
};

export function waLink(number, text) {
  const n = String(number || '').replace(/\D/g, '');
  return `https://wa.me/${n}?text=${encodeURIComponent(text || '')}`;
}