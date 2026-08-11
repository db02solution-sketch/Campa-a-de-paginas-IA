import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/admin.js';
import {
  listCampaigns,
  createCampaign,
  updateCampaign,
  getCampaignById
} from '../services/campaigns.js';
import { listLeads, listProposals, listAgencyInquiries } from '../services/leads.js';
import { generateNumberPool, assignNumbers } from '../services/numbers.js';
import { getStore, useMemory } from '../lib/supabase.js';
import { recommendPackage, buildProposalMessage } from '../services/proposals.js';
import { supabase } from '../lib/supabase.js';
import {
  listAdmins,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  createInitialAdmin
} from '../services/admin.js';

const router = Router();
router.use(requireAdmin);

router.get('/health-detail', (_req, res) => {
  res.json({
    ok: true,
    storage: useMemory ? 'memory' : 'supabase',
    admin: true
  });
});

router.get('/campaigns', async (_req, res) => {
  try {
    const campaigns = await listCampaigns();
    res.json({ campaigns });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/campaigns', async (req, res) => {
  try {
    const schema = z.object({
      slug: z.string().min(2),
      title: z.string().min(2),
      headline: z.string().min(2),
      subtitle: z.string().optional(),
      brand_name: z.string().optional(),
      whatsapp_number: z.string().optional(),
      status: z.enum(['draft', 'open', 'closed']).optional(),
      number_mode: z.enum(['random', 'pick', 'both']).optional(),
      number_min: z.number().int().positive().optional(),
      number_max: z.number().int().positive().optional(),
      number_digits: z.number().int().min(3).max(6).optional(),
      ticket_price: z.number().positive().optional(),
      destinations: z.array(z.any()).optional(),
      channels: z.array(z.any()).optional(),
      interest_levels: z.array(z.any()).optional(),
      packages: z.array(z.any()).optional(),
      theme: z.record(z.any()).optional(),
      stats: z.record(z.any()).optional(),
      hero_image_url: z.string().url().optional().or(z.literal(''))
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() });
    }
    const campaign = await createCampaign(parsed.data);
    res.status(201).json({ campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/campaigns/:id', async (req, res) => {
  try {
    const campaign = await updateCampaign(req.params.id, req.body);
    if (!campaign) return res.status(404).json({ error: 'No encontrada' });
    res.json({ campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/campaigns/:id/numbers/generate', async (req, res) => {
  try {
    const campaign = await getCampaignById(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'No encontrada' });
    const count = Number(req.body.count || 200);
    const numbers = await generateNumberPool(campaign, count);
    res.json({ generated_target: count, sample: numbers.slice(0, 20), total_sample: numbers.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/leads', async (req, res) => {
  try {
    const leads = await listLeads(req.query.campaign_id);
    res.json({ leads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/proposals', async (req, res) => {
  try {
    const proposals = await listProposals(req.query.campaign_id);
    res.json({ proposals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/leads/:id/assign-numbers', async (req, res) => {
  try {
    const mode = req.body.mode || 'random';
    const preferred = req.body.numbers || [];
    let lead;
    let campaign;

    if (useMemory) {
      lead = getStore().leads.find((l) => l.id === req.params.id);
      if (!lead) return res.status(404).json({ error: 'Lead no encontrado' });
      campaign = getStore().campaigns.find((c) => c.id === lead.campaign_id);
    } else {
      const { data: leadData, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', req.params.id)
        .maybeSingle();
      if (error) throw error;
      if (!leadData) return res.status(404).json({ error: 'Lead no encontrado' });
      lead = leadData;
      campaign = await getCampaignById(lead.campaign_id);
    }

    const { package: pkg } = recommendPackage(campaign, lead.interest_level);
    const assigned = await assignNumbers({
      campaign,
      leadId: lead.id,
      qty: Number(req.body.qty || pkg.tickets),
      mode,
      preferredLabels: preferred
    });

    const labels = assigned.map((n) => n.number_label);
    const message = buildProposalMessage({ campaign, lead, pkg, numbers: labels });

    if (useMemory) {
      const proposal = getStore().proposals.find((p) => p.lead_id === lead.id);
      if (proposal) {
        proposal.selected_numbers = labels;
        proposal.number_assignment = mode;
        proposal.message = message;
        proposal.status = 'sent';
        proposal.updated_at = new Date().toISOString();
      }
    } else {
      await supabase
        .from('proposals')
        .update({
          selected_numbers: labels,
          number_assignment: mode,
          message,
          status: 'sent',
          updated_at: new Date().toISOString()
        })
        .eq('lead_id', lead.id);
    }

    res.json({ ok: true, numbers: labels });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.get('/agency/inquiries', async (_req, res) => {
  try {
    const inquiries = await listAgencyInquiries();
    res.json({ inquiries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dashboard', async (_req, res) => {
  try {
    const [campaigns, leads, proposals, inquiries] = await Promise.all([
      listCampaigns(),
      listLeads(),
      listProposals(),
      listAgencyInquiries()
    ]);
    res.json({
      stats: {
        campaigns: campaigns.length,
        open_campaigns: campaigns.filter((c) => c.status === 'open').length,
        leads: leads.length,
        proposals: proposals.length,
        agency_inquiries: inquiries.length
      },
      recent_leads: leads.slice(0, 8),
      recent_proposals: proposals.slice(0, 8),
      recent_inquiries: inquiries.slice(0, 8)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin user management routes
router.get('/admins', async (_req, res) => {
  try {
    const admins = await listAdmins();
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/admins', async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      role: z.enum(['admin', 'super_admin']).optional(),
      permissions: z.record(z.any()).optional(),
      is_active: z.boolean().optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() });
    }
    const admin = await createAdminUser(parsed.data);
    res.status(201).json({ admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/admins/:id', async (req, res) => {
  try {
    const admin = await updateAdminUser(req.params.id, req.body);
    if (!admin) return res.status(404).json({ error: 'Admin no encontrado' });
    res.json({ admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/admins/:id', async (req, res) => {
  try {
    const deleted = await deleteAdminUser(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Admin no encontrado' });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/setup-initial-admin', async (_req, res) => {
  try {
    const admin = await createInitialAdmin();
    res.json({ admin, message: 'Admin inicial creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;