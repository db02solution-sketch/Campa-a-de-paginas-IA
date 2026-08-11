import { Router } from 'express';
import { z } from 'zod';
import { getCampaignBySlug } from '../services/campaigns.js';
import { createLeadWithProposal, createAgencyInquiry } from '../services/leads.js';
import { getAvailableNumbers } from '../services/numbers.js';

const router = Router();

const leadSchema = z.object({
  full_name: z.string().min(2),
  whatsapp: z.string().min(8),
  email: z.string().email().optional().or(z.literal('')),
  city: z.string().optional(),
  destination: z.string().optional(),
  channel: z.string().optional(),
  interest_level: z.string().optional(),
  consent: z.boolean(),
  number_mode: z.enum(['random', 'pick']).optional(),
  preferred_numbers: z.array(z.string()).optional(),
  auto_assign_numbers: z.boolean().optional()
});

const inquirySchema = z.object({
  full_name: z.string().min(2),
  business_name: z.string().optional(),
  whatsapp: z.string().min(8),
  email: z.string().email().optional().or(z.literal('')),
  city: z.string().optional(),
  service_interest: z.string().min(2),
  goals: z.string().optional(),
  budget_range: z.string().optional()
});

router.get('/campaigns/:slug', async (req, res) => {
  try {
    const campaign = await getCampaignBySlug(req.params.slug);
    if (!campaign || campaign.status === 'draft') {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }
    return res.json({ campaign });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/campaigns/:slug/numbers', async (req, res) => {
  try {
    const campaign = await getCampaignBySlug(req.params.slug);
    if (!campaign || campaign.status !== 'open') {
      return res.status(404).json({ error: 'Campaña no disponible' });
    }
    if (campaign.number_mode === 'random') {
      return res.status(400).json({
        error: 'Esta campaña solo asigna números aleatorios'
      });
    }
    const numbers = await getAvailableNumbers(campaign, {
      limit: Number(req.query.limit || 48),
      search: req.query.search
    });
    return res.json({
      numbers: numbers.map((n) => ({
        label: n.number_label,
        value: n.number_value
      })),
      meta: {
        min: campaign.number_min,
        max: campaign.number_max,
        digits: campaign.number_digits,
        mode: campaign.number_mode,
        note: 'Numeración configurable estilo Lotería Nacional (ej. Sorteo Mayor 00001-60000)'
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/campaigns/:slug/leads', async (req, res) => {
  try {
    const campaign = await getCampaignBySlug(req.params.slug);
    if (!campaign || campaign.status !== 'open') {
      return res.status(404).json({ error: 'Campaña no disponible' });
    }

    const parsed = leadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() });
    }
    if (!parsed.data.consent) {
      return res.status(400).json({ error: 'Debes autorizar el contacto' });
    }

    const numberMode = parsed.data.number_mode || 'random';
    if (numberMode === 'pick' && campaign.number_mode === 'random') {
      return res.status(400).json({ error: 'Esta campaña no permite elegir números' });
    }

    const result = await createLeadWithProposal({
      campaign,
      leadInput: parsed.data,
      numberMode,
      preferredNumbers: parsed.data.preferred_numbers || [],
      autoAssignNumbers: parsed.data.auto_assign_numbers ?? Boolean(parsed.data.preferred_numbers?.length)
    });

    return res.status(201).json({
      ok: true,
      lead_id: result.lead.id,
      proposal: {
        id: result.proposal.id,
        package_name: result.proposal.package_name,
        ticket_qty: result.proposal.ticket_qty,
        total_price: result.proposal.total_price,
        currency: result.proposal.currency,
        message: result.proposal.message,
        selected_numbers: result.proposal.selected_numbers,
        number_assignment: result.proposal.number_assignment
      }
    });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

router.post('/agency/inquiries', async (req, res) => {
  try {
    const parsed = inquirySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() });
    }
    const inquiry = await createAgencyInquiry(parsed.data);
    return res.status(201).json({ ok: true, inquiry_id: inquiry.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;