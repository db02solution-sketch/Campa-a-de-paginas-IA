<script>
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { api, waLink } from '$lib/api.js';
  import LeadForm from '$lib/components/LeadForm.svelte';

  let campaign = $state(null);
  let error = $state('');
  let loading = $state(true);

  onMount(async () => {
    try {
      const slug = page.params.slug;
      const data = await api.getCampaign(slug);
      campaign = data.campaign;
      if (campaign?.theme) {
        document.documentElement.style.setProperty(
          '--accent',
          campaign.theme.accent || '#14b8a6'
        );
        document.documentElement.style.setProperty(
          '--bg-from',
          campaign.theme.bg_from || '#042f2e'
        );
        document.documentElement.style.setProperty(
          '--bg-to',
          campaign.theme.bg_to || '#0f766e'
        );
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>{campaign?.title || 'Campaña de rifa'}</title>
</svelte:head>

{#if loading}
  <main class="state">Cargando campaña...</main>
{:else if error}
  <main class="state">{error}</main>
{:else if campaign}
  <main class="campaign">
    <section
      class="hero"
      style={`--hero: url('${campaign.hero_image_url || ''}'); background-image: linear-gradient(120deg, rgba(4,47,46,.82), rgba(15,118,110,.55)), var(--hero);`}
    >
      <div class="container hero-content">
        <span class="pill">Sorteo {campaign.status === 'open' ? 'abierto' : campaign.status}</span>
        <p class="brand">{campaign.brand_name}</p>
        <h1>{campaign.headline}</h1>
        <p class="subtitle">{campaign.subtitle}</p>
        <div class="stats">
          <div>
            <strong>+{(campaign.stats?.participants || 0).toLocaleString('es-MX')}</strong>
            <span>participantes registrados</span>
          </div>
          <div>
            <strong>{campaign.stats?.response_hours || 24} h</strong>
            <span>tiempo de respuesta</span>
          </div>
          <div>
            <strong>{campaign.stats?.trips_delivered || 0}</strong>
            <span>viajes entregados</span>
          </div>
        </div>
        <a class="btn btn-primary" href="#registro">Quiero participar</a>
      </div>
    </section>

    <section class="container block">
      <LeadForm {campaign} />
    </section>

    <section class="container why">
      <h2>Por qué participar con nosotros</h2>
      <div class="why-grid">
        <article>
          <h3>Boletos desde ${campaign.ticket_price}</h3>
          <p>Participa con una aportación mínima y multiplica tus oportunidades con paquetes.</p>
        </article>
        <article>
          <h3>Sorteos transparentes</h3>
          <p>
            Números estilo Lotería Nacional
            ({String(campaign.number_min).padStart(campaign.number_digits, '0')}–
            {String(campaign.number_max).padStart(campaign.number_digits, '0')})
            con folio verificable.
          </p>
        </article>
        <article>
          <h3>Viaje todo incluido</h3>
          <p>Vuelos, hospedaje y traslados para dos personas, sin gastos escondidos.</p>
        </article>
      </div>
    </section>

    <section class="container steps">
      <h2>Así de simple funciona</h2>
      <ol>
        <li>
          <strong>01 · Registra tus datos</strong>
          <span>Un minuto y quedas en la lista de participantes.</span>
        </li>
        <li>
          <strong>02 · Recibe tu WhatsApp</strong>
          <span>Te enviamos boletos, fechas y formas de pago.</span>
        </li>
        <li>
          <strong>03 · Participa en el sorteo</strong>
          <span>Sigue la transmisión en vivo y revisa tu folio.</span>
        </li>
      </ol>
    </section>

    <section class="cta">
      <div class="container">
        <h2>¿Listo para apartar tus boletos?</h2>
        <p>Los lugares se cierran cuando se agotan los boletos del sorteo en curso.</p>
        <div class="cta-actions">
          <a class="btn btn-primary" href="#registro">Registrarme ahora</a>
          <a
            class="btn btn-ghost"
            href={waLink(
              campaign.whatsapp_number,
              `Hola, vi la página de ${campaign.brand_name} y quiero más información.`
            )}
            target="_blank"
            rel="noreferrer">Contáctanos por WhatsApp</a
          >
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="container">
        <p>© {new Date().getFullYear()} {campaign.brand_name}. Todos los derechos reservados.</p>
        <p>Atención de lunes a sábado, 9:00 a 20:00 h</p>
      </div>
    </footer>
  </main>
{/if}

<style>
  .state {
    min-height: 100vh;
    display: grid;
    place-items: center;
    color: white;
    background: #042f2e;
  }

  .campaign {
    color: #f4fffb;
    background: linear-gradient(180deg, #031716, #073833 40%, #0b4a43);
  }

  .hero {
    min-height: 100vh;
    background-size: cover;
    background-position: center;
    display: grid;
    align-items: end;
    padding: 5rem 0 3.5rem;
  }

  .brand {
    font-family: var(--font-display);
    font-size: clamp(2rem, 5vw, 3.4rem);
    margin: 1rem 0 0.35rem;
    letter-spacing: -0.02em;
  }

  h1 {
    font-family: var(--font-display);
    font-size: clamp(1.6rem, 3.5vw, 2.5rem);
    max-width: 16ch;
    margin: 0 0 0.8rem;
    line-height: 1.15;
  }

  .subtitle {
    max-width: 38rem;
    line-height: 1.6;
    opacity: 0.92;
  }

  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 1.4rem;
    margin: 1.6rem 0;
  }

  .stats strong {
    display: block;
    font-size: 1.5rem;
  }

  .stats span {
    opacity: 0.8;
    font-size: 0.9rem;
  }

  .block {
    margin-top: -3rem;
    position: relative;
    z-index: 2;
    padding-bottom: 2rem;
  }

  .why,
  .steps {
    padding: 2.5rem 0;
  }

  .why h2,
  .steps h2,
  .cta h2 {
    font-family: var(--font-display);
    font-size: clamp(1.7rem, 3vw, 2.3rem);
  }

  .why-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .why-grid article {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 18px;
    padding: 1.1rem;
  }

  .why-grid h3 {
    margin-top: 0;
  }

  .steps ol {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 0.9rem;
  }

  .steps li {
    display: grid;
    gap: 0.25rem;
    padding: 1rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }

  .cta {
    padding: 3rem 0;
    background: rgba(0, 0, 0, 0.18);
  }

  .cta-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
  }

  .footer {
    padding: 1.5rem 0 2.5rem;
    opacity: 0.8;
    font-size: 0.92rem;
  }

  @media (max-width: 860px) {
    .why-grid {
      grid-template-columns: 1fr;
    }
  }
</style>