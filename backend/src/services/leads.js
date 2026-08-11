import { randomUUID } from 'crypto';
import { getStore, supabase, useMemory } from '../lib/supabase.js';
import { recommendPackage, buildProposalMessage } from './proposals.js';
import { assignNumbers } from './numbers.js';

export async function listLeads(campaignId) {
  if (useMemory) {
    const rows = getStore().leads;
    return campaignId ? rows.filter((l) => l.campaign_id === campaignId) : rows;
  }
  let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
  if (campaignId) query = query.eq('campaign_id', campaignId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createLeadWithProposal({
  campaign,
  leadInput,
  numberMode = 'random',
  preferredNumbers = [],
  autoAssignNumbers = false
}) {
  const { package: pkg, score } = recommendPackage(campaign, leadInput.interest_level);

  const leadPayload = {
    campaign_id: campaign.id,
    full_name: leadInput.full_name.trim(),
    whatsapp: leadInput.whatsapp.trim(),
    email: leadInput.email?.trim() || null,
    city: leadInput.city?.trim() || null,
    destination: leadInput.destination || null,
    channel: leadInput.channel || null,
    interest_level: leadInput.interest_level || null,
    consent: Boolean(leadInput.consent),
    status: 'new',
    metadata: { interest_score: score, recommended_package: pkg?.key || null }
  };

  let lead;
  if (useMemory) {
    lead = {
      id: randomUUID(),
      ...leadPayload,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    getStore().leads.unshift(lead);
  } else {
    const { data, error } = await supabase.from('leads').insert(leadPayload).select('*').single();
    if (error) throw error;
    lead = data;
  }

  let assigned = [];
  if (autoAssignNumbers && pkg) {
    assigned = await assignNumbers({
      campaign,
      leadId: lead.id,
      qty: pkg.tickets,
      mode: numberMode,
      preferredLabels: preferredNumbers
    });
  }

  const selectedLabels = assigned.map((n) => n.number_label);
  const message = buildProposalMessage({
    campaign,
    lead,
    pkg,
    numbers: selectedLabels
  });

  const proposalPayload = {
    lead_id: lead.id,
    campaign_id: campaign.id,
    package_key: pkg.key,
    package_name: pkg.name,
    ticket_qty: pkg.tickets,
    unit_price: Number(campaign.ticket_price),
    total_price: Number(pkg.price),
    currency: campaign.currency,
    number_assignment: assigned.length
      ? numberMode === 'pick'
        ? 'pick'
        : 'random'
      : 'pending',
    selected_numbers: selectedLabels,
    message,
    status: 'draft',
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString()
  };

  let proposal;
  if (useMemory) {
    proposal = {
      id: randomUUID(),
      ...proposalPayload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    getStore().proposals.unshift(proposal);
    lead.status = 'proposal_sent';
  } else {
    const { data, error } = await supabase
      .from('proposals')
      .insert(proposalPayload)
      .select('*')
      .single();
    if (error) throw error;
    proposal = data;
    await supabase.from('leads').update({ status: 'proposal_sent' }).eq('id', lead.id);
    lead.status = 'proposal_sent';
  }

  return { lead, proposal, recommended_package: pkg, assigned_numbers: selectedLabels };
}

export async function listProposals(campaignId) {
  if (useMemory) {
    const rows = getStore().proposals;
    return campaignId ? rows.filter((p) => p.campaign_id === campaignId) : rows;
  }
  let query = supabase.from('proposals').select('*').order('created_at', { ascending: false });
  if (campaignId) query = query.eq('campaign_id', campaignId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createAgencyInquiry(input) {
  const payload = {
    full_name: input.full_name.trim(),
    business_name: input.business_name?.trim() || null,
    whatsapp: input.whatsapp.trim(),
    email: input.email?.trim() || null,
    city: input.city?.trim() || null,
    service_interest: input.service_interest,
    goals: input.goals?.trim() || null,
    budget_range: input.budget_range || null,
    status: 'new'
  };

  if (useMemory) {
    const row = { id: randomUUID(), ...payload, created_at: new Date().toISOString() };
    getStore().agency_inquiries.unshift(row);
    return row;
  }

  const { data, error } = await supabase
    .from('agency_inquiries')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function listAgencyInquiries() {
  if (useMemory) return getStore().agency_inquiries;
  const { data, error } = await supabase
    .from('agency_inquiries')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}