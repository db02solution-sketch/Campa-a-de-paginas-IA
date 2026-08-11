<script>
  import { api, waLink } from '$lib/api.js';

  let form = $state({
    full_name: '',
    business_name: '',
    whatsapp: '',
    email: '',
    city: '',
    service_interest: 'rifas',
    goals: '',
    budget_range: ''
  });
  let loading = $state(false);
  let message = $state('');
  let error = $state('');

  async function submit(e) {
    e.preventDefault();
    loading = true;
    message = '';
    error = '';
    try {
      await api.createInquiry(form);
      message =
        'Recibimos tu solicitud. Te enviaremos una propuesta personalizada según lo que necesitas.';
      form = {
        full_name: '',
        business_name: '',
        whatsapp: '',
        email: '',
        city: '',
        service_interest: 'rifas',
        goals: '',
        budget_range: ''
      };
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Plataforma de Rifas Moldeable | Agencia de Contenido</title>
</svelte:head>

<main class="home">
  <header class="hero">
    <div class="container hero-grid">
      <div>
        <p class="eyebrow">Agencia de contenido · Producto configurable</p>
        <h1>Una plataforma de rifas que se adapta a cada cliente</h1>
        <p class="lead">
          Captamos leads, generamos propuestas automáticas y gestionamos números de rifa
          (aleatorios o elegibles estilo Lotería Nacional). El caso piloto ya está listo.
        </p>
        <div class="actions">
          <a class="btn btn-primary" href="/c/rifas-viajes">Ver demo Rifas de Viajes</a>
          <a class="btn btn-ghost" href="/admin">Panel admin</a>
        </div>
      </div>
      <aside class="card">
        <h2>Qué incluye</h2>
        <ul>
          <li>Landing moldeable por campaña (marca, destinos, precios, tema)</li>
          <li>Formulario de contacto + scoring de interés</li>
          <li>Propuesta automática de paquetes de boletos</li>
          <li>Números aleatorios o selección 00001–60000</li>
          <li>Backend Node + Supabase (con modo demo en memoria)</li>
        </ul>
        <a
          class="btn btn-ghost"
          href={waLink('5216142515875', 'Hola, quiero una propuesta de página de rifas moldeable')}
          target="_blank"
          rel="noreferrer">Hablar por WhatsApp</a
        >
      </aside>
    </div>
  </header>

  <section class="section container" id="propuesta">
    <div class="section-head">
      <h2>Cuéntanos qué necesitas</h2>
      <p>Recabamos tus datos y armamos una propuesta según el tipo de rifa o contenido.</p>
    </div>

    <form class="inquiry" onsubmit={submit}>
      <div class="grid">
        <div class="field">
          <label for="full_name">Nombre completo</label>
          <input id="full_name" bind:value={form.full_name} required />
        </div>
        <div class="field">
          <label for="business_name">Negocio / marca</label>
          <input id="business_name" bind:value={form.business_name} />
        </div>
        <div class="field">
          <label for="whatsapp">WhatsApp</label>
          <input id="whatsapp" bind:value={form.whatsapp} required placeholder="521..." />
        </div>
        <div class="field">
          <label for="email">Correo</label>
          <input id="email" type="email" bind:value={form.email} />
        </div>
        <div class="field">
          <label for="city">Ciudad</label>
          <input id="city" bind:value={form.city} />
        </div>
        <div class="field">
          <label for="service_interest">¿Qué quieres lanzar?</label>
          <select id="service_interest" bind:value={form.service_interest}>
            <option value="rifas">Página de rifas (viajes u otro premio)</option>
            <option value="contenido">Contenido para redes + embudo</option>
            <option value="ambos">Rifa + contenido integral</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div class="field">
          <label for="budget_range">Presupuesto aproximado</label>
          <select id="budget_range" bind:value={form.budget_range}>
            <option value="">Selecciona</option>
            <option value="lt5k">Menos de $5,000</option>
            <option value="5_15k">$5,000 – $15,000</option>
            <option value="15_40k">$15,000 – $40,000</option>
            <option value="gt40k">Más de $40,000</option>
          </select>
        </div>
        <div class="field full">
          <label for="goals">¿Qué deseas lograr?</label>
          <textarea
            id="goals"
            bind:value={form.goals}
            placeholder="Ej. rifa de viajes con números de Lotería Nacional, captura de leads y seguimiento por WhatsApp"
          ></textarea>
        </div>
      </div>

      {#if message}
        <p class="notice">{message}</p>
      {/if}
      {#if error}
        <p class="notice error">{error}</p>
      {/if}

      <button class="btn btn-primary" type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Quiero mi propuesta'}
      </button>
    </form>
  </section>
</main>

<style>
  .home {
    min-height: 100vh;
    background:
      radial-gradient(circle at 20% 10%, rgba(45, 212, 191, 0.22), transparent 35%),
      linear-gradient(160deg, #031716, #0a3d39 55%, #082f2b);
    color: #f5fffc;
  }

  .hero {
    padding: 4.5rem 0 2rem;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: 1.3fr 0.9fr;
    gap: 2rem;
    align-items: start;
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.78rem;
    opacity: 0.8;
  }

  h1 {
    font-family: var(--font-display);
    font-size: clamp(2.4rem, 5vw, 4rem);
    line-height: 1.05;
    margin: 0.4rem 0 1rem;
  }

  .lead {
    font-size: 1.08rem;
    line-height: 1.6;
    max-width: 40rem;
    opacity: 0.92;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    margin-top: 1.5rem;
  }

  .card {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 24px;
    padding: 1.4rem;
    backdrop-filter: blur(8px);
  }

  .card h2 {
    margin-top: 0;
    font-family: var(--font-display);
  }

  .card ul {
    padding-left: 1.1rem;
    line-height: 1.7;
    opacity: 0.95;
  }

  .section {
    padding: 2rem 0 4.5rem;
  }

  .section-head h2 {
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 3vw, 2.4rem);
    margin-bottom: 0.4rem;
  }

  .section-head p {
    opacity: 0.85;
    margin-top: 0;
  }

  .inquiry {
    margin-top: 1.4rem;
    background: rgba(255, 255, 255, 0.96);
    color: var(--ink);
    border-radius: 24px;
    padding: 1.4rem;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .full {
    grid-column: 1 / -1;
  }

  @media (max-width: 860px) {
    .hero-grid,
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>