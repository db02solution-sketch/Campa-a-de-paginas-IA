import { randomUUID } from 'crypto';
import { getStore, supabase, useMemory } from './lib/supabase.js';

export async function getCampaignBySlug(slug) {
  if (useMemory) {
    return getStore().campaigns.find((c) => c.slug === slug) || null;
  }
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCampaignById(id) {
  if (useMemory) {
    return getStore().campaigns.find((c) => c.id === id) || null;
  }
  const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listCampaigns() {
  if (useMemory) return getStore().campaigns;
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createCampaign(payload) {
  if (useMemory) {
    const store = getStore();
    const campaign = {
      id: randomUUID(),
      client_id: payload.client_id || null,
      slug: payload.slug,
      title: payload.title,
      headline: payload.headline,
      subtitle: payload.subtitle || '',
      hero_image_url: payload.hero_image_url || null,
      brand_name: payload.brand_name || 'Nueva Rifa',
      whatsapp_number: payload.whatsapp_number || null,
      status: payload.status || 'draft',
      number_mode: payload.number_mode || 'both',
      number_min: payload.number_min ?? 1,
      number_max: payload.number_max ?? 60000,
      number_digits: payload.number_digits ?? 5,
      ticket_price: payload.ticket_price ?? 99,
      currency: payload.currency || 'MXN',
      destinations: payload.destinations || [],
      channels: payload.channels || [],
      interest_levels: payload.interest_levels || [],
      packages: payload.packages || [],
      stats: payload.stats || {},
      theme: payload.theme || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.campaigns.push(campaign);
    return campaign;
  }

  const { data, error } = await supabase.from('campaigns').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateCampaign(id, patch) {
  if (useMemory) {
    const store = getStore();
    const idx = store.campaigns.findIndex((c) => c.id === id);
    if (idx < 0) return null;
    store.campaigns[idx] = {
      ...store.campaigns[idx],
      ...patch,
      updated_at: new Date().toISOString()
    };
    return store.campaigns[idx];
  }

  const { data, error } = await supabase
    .from('campaigns')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}