import { randomUUID } from 'crypto';

const seedCampaign = {
  id: '22222222-2222-2222-2222-222222222222',
  client_id: '11111111-1111-1111-1111-111111111111',
  slug: 'rifas-viajes',
  title: 'Rifas de Viajes | Participa y gana tu próximo destino',
  headline: 'Gana el viaje que llevas años posponiendo',
  subtitle:
    'Rifamos viajes todo incluido para dos personas. Regístrate, elige tu destino favorito y un asesor te acompaña por WhatsApp durante todo el proceso.',
  hero_image_url:
    'https://rifasviajesdeotromundo.lovable.app/assets/hero-viaje-BHT9csOA.jpg',
  brand_name: 'Rifas de Viajes',
  whatsapp_number: '5216142515875',
  status: 'open',
  number_mode: 'both',
  number_min: 1,
  number_max: 60000,
  number_digits: 5,
  ticket_price: 99,
  currency: 'MXN',
  destinations: [
    { key: 'cancun', label: 'Cancún / Riviera Maya' },
    { key: 'cabos', label: 'Los Cabos' },
    { key: 'vallarta', label: 'Puerto Vallarta' },
    { key: 'europa', label: 'Europa (París · Roma · Madrid)' },
    { key: 'crucero', label: 'Crucero por el Caribe' },
    { key: 'indefinido', label: 'Aún no lo decido' }
  ],
  channels: [
    { key: 'facebook', label: 'Facebook' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'ads', label: 'Anuncio digital' },
    { key: 'referral', label: 'Recomendación' }
  ],
  interest_levels: [
    { key: 'buy_now', label: 'Quiero mis boletos ya', score: 5 },
    { key: 'ready_today', label: 'Listo para comprar hoy', score: 5 },
    { key: 'details', label: 'Me interesa, quiero detalles', score: 3 },
    { key: 'soon', label: 'Compro en los próximos días', score: 4 },
    { key: 'exploring', label: 'Solo estoy explorando', score: 1 },
    { key: 'info', label: 'Quiero información general', score: 2 }
  ],
  packages: [
    {
      key: 'starter',
      name: 'Paquete Inicial',
      tickets: 1,
      price: 99,
      min_score: 1,
      description: '1 boleto para participar en el sorteo'
    },
    {
      key: 'chance',
      name: 'Más Oportunidades',
      tickets: 3,
      price: 249,
      min_score: 2,
      description: '3 boletos con mejor probabilidad'
    },
    {
      key: 'pro',
      name: 'Paquete Pro',
      tickets: 5,
      price: 399,
      min_score: 3,
      description: '5 boletos + seguimiento prioritario'
    },
    {
      key: 'vip',
      name: 'Paquete VIP',
      tickets: 10,
      price: 699,
      min_score: 4,
      description: '10 boletos + asesoría personalizada por WhatsApp'
    }
  ],
  stats: { participants: 8400, response_hours: 24, trips_delivered: 12 },
  theme: {
    accent: '#0d9488',
    bg_from: '#042f2e',
    bg_to: '#0f766e',
    font_display: 'Fraunces',
    font_body: 'Manrope'
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

function padNumber(value, digits) {
  return String(value).padStart(digits, '0');
}

function buildSeedNumbers(campaign, count = 120) {
  const used = new Set();
  const numbers = [];
  while (numbers.length < count) {
    const value =
      Math.floor(Math.random() * (campaign.number_max - campaign.number_min + 1)) +
      campaign.number_min;
    if (used.has(value)) continue;
    used.add(value);
    numbers.push({
      id: randomUUID(),
      campaign_id: campaign.id,
      number_value: value,
      number_label: padNumber(value, campaign.number_digits),
      status: 'available',
      lead_id: null,
      reserved_at: null,
      sold_at: null,
      created_at: new Date().toISOString()
    });
  }
  return numbers.sort((a, b) => a.number_value - b.number_value);
}

export const memory = {
  clients: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Viajes de Otro Mundo',
      contact_name: 'Asesor comercial',
      contact_email: null,
      contact_whatsapp: '5216142515875',
      company_type: 'rifas',
      notes: 'Cliente piloto',
      created_at: new Date().toISOString()
    }
  ],
  campaigns: [seedCampaign],
  raffle_numbers: buildSeedNumbers(seedCampaign),
  leads: [],
  proposals: [],
  agency_inquiries: [],
  admin_users: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@localhost',
      role: 'super_admin',
      permissions: {
        campaigns: { read: true, write: true, delete: true },
        leads: { read: true, write: true, delete: true },
        proposals: { read: true, write: true, delete: true },
        admin_users: { read: true, write: true, delete: true },
        clients: { read: true, write: true, delete: true }
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
};

export { padNumber };