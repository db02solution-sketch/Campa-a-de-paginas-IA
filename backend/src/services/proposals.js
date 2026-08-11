export function scoreInterest(campaign, interestKey) {
  const level = (campaign.interest_levels || []).find((i) => i.key === interestKey);
  return level?.score ?? 1;
}

export function recommendPackage(campaign, interestKey) {
  const score = scoreInterest(campaign, interestKey);
  const packages = [...(campaign.packages || [])].sort(
    (a, b) => b.min_score - a.min_score
  );
  const match = packages.find((p) => score >= p.min_score) || packages[packages.length - 1];
  return { package: match, score };
}

export function buildProposalMessage({ campaign, lead, pkg, numbers = [] }) {
  const destination =
    (campaign.destinations || []).find((d) => d.key === lead.destination)?.label ||
    lead.destination ||
    'tu destino favorito';

  const numbersText =
    numbers.length > 0
      ? `Números apartados: ${numbers.join(', ')}.`
      : 'Los números se asignan al confirmar tu paquete (aleatorio o a tu elección estilo Lotería Nacional).';

  return [
    `Hola ${lead.full_name.split(' ')[0]}, gracias por tu interés en ${campaign.brand_name}.`,
    `Según tu nivel de interés, te proponemos el ${pkg.name}: ${pkg.tickets} boleto(s) por $${pkg.price} ${campaign.currency}.`,
    `Destino de interés: ${destination}.`,
    pkg.description ? `${pkg.description}.` : '',
    numbersText,
    `Un asesor te contactará por WhatsApp para confirmar disponibilidad y formas de pago.`,
    `Respuesta estimada: menos de ${(campaign.stats?.response_hours ?? 24)} horas.`
  ]
    .filter(Boolean)
    .join(' ');
}