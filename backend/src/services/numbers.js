import { randomUUID } from 'crypto';
import { getStore, supabase, useMemory } from '../lib/supabase.js';
import { padNumber } from '../store/memory.js';

export function formatNumber(value, digits) {
  return padNumber(value, digits);
}

async function listAvailable(campaignId, { limit = 40, search } = {}) {
  if (useMemory) {
    const store = getStore();
    let rows = store.raffle_numbers.filter(
      (n) => n.campaign_id === campaignId && n.status === 'available'
    );
    if (search) {
      const q = String(search).replace(/\D/g, '');
      rows = rows.filter((n) => n.number_label.includes(q));
    }
    return rows.slice(0, limit);
  }

  let query = supabase
    .from('raffle_numbers')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'available')
    .order('number_value', { ascending: true })
    .limit(limit);

  if (search) {
    const q = String(search).replace(/\D/g, '');
    if (q) query = query.ilike('number_label', `%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function ensureAvailablePool(campaign, minAvailable = 30) {
  if (useMemory) {
    const store = getStore();
    const available = store.raffle_numbers.filter(
      (n) => n.campaign_id === campaign.id && n.status === 'available'
    ).length;
    if (available >= minAvailable) return;

    const existing = new Set(
      store.raffle_numbers
        .filter((n) => n.campaign_id === campaign.id)
        .map((n) => n.number_value)
    );
    let guard = 0;
    while (
      store.raffle_numbers.filter(
        (n) => n.campaign_id === campaign.id && n.status === 'available'
      ).length < minAvailable &&
      guard < 5000
    ) {
      guard += 1;
      const value =
        Math.floor(Math.random() * (campaign.number_max - campaign.number_min + 1)) +
        campaign.number_min;
      if (existing.has(value)) continue;
      existing.add(value);
      store.raffle_numbers.push({
        id: randomUUID(),
        campaign_id: campaign.id,
        number_value: value,
        number_label: formatNumber(value, campaign.number_digits),
        status: 'available',
        lead_id: null,
        reserved_at: null,
        sold_at: null,
        created_at: new Date().toISOString()
      });
    }
    store.raffle_numbers.sort((a, b) => a.number_value - b.number_value);
    return;
  }

  const { count, error } = await supabase
    .from('raffle_numbers')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id)
    .eq('status', 'available');
  if (error) throw error;
  if ((count || 0) >= minAvailable) return;

  const needed = minAvailable - (count || 0);
  const { data: existingRows, error: existingError } = await supabase
    .from('raffle_numbers')
    .select('number_value')
    .eq('campaign_id', campaign.id);
  if (existingError) throw existingError;

  const existing = new Set((existingRows || []).map((r) => r.number_value));
  const inserts = [];
  let guard = 0;
  while (inserts.length < needed && guard < 20000) {
    guard += 1;
    const value =
      Math.floor(Math.random() * (campaign.number_max - campaign.number_min + 1)) +
      campaign.number_min;
    if (existing.has(value)) continue;
    existing.add(value);
    inserts.push({
      campaign_id: campaign.id,
      number_value: value,
      number_label: formatNumber(value, campaign.number_digits),
      status: 'available'
    });
  }

  if (inserts.length) {
    const { error: insertError } = await supabase.from('raffle_numbers').insert(inserts);
    if (insertError) throw insertError;
  }
}

export async function getAvailableNumbers(campaign, options = {}) {
  await ensureAvailablePool(campaign);
  return listAvailable(campaign.id, options);
}

export async function assignNumbers({
  campaign,
  leadId,
  qty,
  mode = 'random',
  preferredLabels = []
}) {
  await ensureAvailablePool(campaign, Math.max(30, qty * 3));

  if (useMemory) {
    const store = getStore();
    let selected = [];

    if (mode === 'pick' && preferredLabels.length) {
      const wanted = preferredLabels.map((l) =>
        formatNumber(Number(String(l).replace(/\D/g, '')), campaign.number_digits)
      );
      selected = store.raffle_numbers.filter(
        (n) =>
          n.campaign_id === campaign.id &&
          n.status === 'available' &&
          wanted.includes(n.number_label)
      );
      if (selected.length !== wanted.length) {
        const missing = wanted.filter(
          (w) => !selected.some((s) => s.number_label === w)
        );
        const err = new Error(`Números no disponibles: ${missing.join(', ')}`);
        err.status = 409;
        throw err;
      }
    } else {
      const pool = store.raffle_numbers.filter(
        (n) => n.campaign_id === campaign.id && n.status === 'available'
      );
      for (let i = pool.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      selected = pool.slice(0, qty);
      if (selected.length < qty) {
        const err = new Error('No hay suficientes números disponibles');
        err.status = 409;
        throw err;
      }
    }

    const now = new Date().toISOString();
    for (const row of selected) {
      row.status = 'reserved';
      row.lead_id = leadId;
      row.reserved_at = now;
    }
    return selected;
  }

  if (mode === 'pick' && preferredLabels.length) {
    const wanted = preferredLabels.map((l) =>
      formatNumber(Number(String(l).replace(/\D/g, '')), campaign.number_digits)
    );
    const { data, error } = await supabase
      .from('raffle_numbers')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('status', 'available')
      .in('number_label', wanted);
    if (error) throw error;
    if ((data || []).length !== wanted.length) {
      const found = new Set((data || []).map((d) => d.number_label));
      const missing = wanted.filter((w) => !found.has(w));
      const err = new Error(`Números no disponibles: ${missing.join(', ')}`);
      err.status = 409;
      throw err;
    }

    const ids = data.map((d) => d.id);
    const { data: updated, error: updateError } = await supabase
      .from('raffle_numbers')
      .update({
        status: 'reserved',
        lead_id: leadId,
        reserved_at: new Date().toISOString()
      })
      .in('id', ids)
      .eq('status', 'available')
      .select('*');
    if (updateError) throw updateError;
    if ((updated || []).length !== wanted.length) {
      const err = new Error('Algunos números ya fueron tomados. Intenta de nuevo.');
      err.status = 409;
      throw err;
    }
    return updated;
  }

  const { data: pool, error } = await supabase
    .from('raffle_numbers')
    .select('*')
    .eq('campaign_id', campaign.id)
    .eq('status', 'available')
    .limit(Math.max(qty * 5, 40));
  if (error) throw error;

  const shuffled = [...(pool || [])].sort(() => Math.random() - 0.5).slice(0, qty);
  if (shuffled.length < qty) {
    const err = new Error('No hay suficientes números disponibles');
    err.status = 409;
    throw err;
  }

  const ids = shuffled.map((d) => d.id);
  const { data: updated, error: updateError } = await supabase
    .from('raffle_numbers')
    .update({
      status: 'reserved',
      lead_id: leadId,
      reserved_at: new Date().toISOString()
    })
    .in('id', ids)
    .eq('status', 'available')
    .select('*');
  if (updateError) throw updateError;
  if ((updated || []).length < qty) {
    const err = new Error('Conflicto al asignar números. Intenta de nuevo.');
    err.status = 409;
    throw err;
  }
  return updated;
}

export async function generateNumberPool(campaign, count = 200) {
  await ensureAvailablePool(campaign, count);
  return getAvailableNumbers(campaign, { limit: Math.min(count, 100) });
}