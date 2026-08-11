<script>
  import { api, waLink } from '$lib/api.js';

  let { campaign } = $props();

  let form = $state({
    full_name: '',
    whatsapp: '',
    email: '',
    city: '',
    destination: '',
    channel: '',
    interest_level: '',
    consent: false,
    number_mode: 'random',
    preferred_numbers: [],
    auto_assign_numbers: false
  });

  let available = $state([]);
  let search = $state('');
  let loading = $state(false);
  let loadingNumbers = $state(false);
  let result = $state(null);
  let error = $state('');

  async function loadNumbers() {
    if (campaign.number_mode === 'random') return;
    loadingNumbers = true;
    error = '';
    try {
      const data = await api.getNumbers(campaign.slug, {
        limit: '60',
        search: search || undefined
      });
      available = data.numbers || [];
    } catch (err) {
      error = err.message;
    } finally {
      loadingNumbers = false;
    }
  }

  function toggleNumber(label) {
    if (form.preferred_numbers.includes(label)) {
      form.preferred_numbers = form.preferred_numbers.filter((n) => n !== label);
    } else {
      form.preferred_numbers = [...form.preferred_numbers, label];
    }
  }

  $effect(() => {
    if (form.number_mode === 'pick') {
      form.auto_assign_numbers = true;
    }
  });

  $effect(() => {
    if (form.number_mode === 'pick') {
      void loadNumbers();
    }
  });

  async function submit(e) {
    e.preventDefault();
    loading = true;
    error = '';
    result = null;
    try {
      const payload = {
        ...form,
        preferred_numbers:
          form.number_mode === 'pick' ? form.preferred_numbers : undefined,
        auto_assign_numbers:
          form.number_mode === 'pick' ? true : form.auto_assign_numbers
      };
      result = await api.createLead(campaign.slug, payload);
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<section class="form-wrap" id="registro">
  <div class="head">
    <h2>Aparta tu lugar en la rifa</h2>
    <p>Déjanos tus datos y te enviamos boletos disponibles y fechas por WhatsApp.</p>
  </div>

  {#if result}
    <div class="notice success">
      <h3>¡Registro listo!</h3>
      <p>{result.proposal.message}</p>
      <p>
        <strong>{result.proposal.package_name}</strong> ·
        {result.proposal.ticket_qty} boleto(s) · ${result.proposal.total_price}
        {result.proposal.currency}
      </p>
      {#if result.proposal.selected_numbers?.length}
        <p>Números: {result.proposal.selected_numbers.join(', ')}</p>
      {/if}
      <a
        class="btn btn-primary"
        href={waLink(
          campaign.whatsapp_number,
          `Hola, me registré en ${campaign.brand_name}. Mi propuesta es ${result.proposal.package_name}.`
        )}
        target="_blank"
        rel="noreferrer">Continuar por WhatsApp</a
      >
    </div>
  {:else}
    <form onsubmit={submit}>
      <div class="grid">
        <div class="field">
          <label for="full_name">Nombre completo</label>
          <input id="full_name" bind:value={form.full_name} required />
        </div>
        <div class="field">
          <label for="whatsapp">WhatsApp</label>
          <input id="whatsapp" bind:value={form.whatsapp} required />
        </div>
        <div class="field">
          <label for="email">Correo electrónico</label>
          <input id="email" type="email" bind:value={form.email} />
        </div>
        <div class="field">
          <label for="city">Ciudad</label>
          <input id="city" bind:value={form.city} />
        </div>
        <div class="field">
          <label for="destination">Viaje de interés</label>
          <select id="destination" bind:value={form.destination} required>
            <option value="">Elige un destino</option>
            {#each campaign.destinations || [] as d}
              <option value={d.key}>{d.label}</option>
            {/each}
          </select>
        </div>
        <div class="field">
          <label for="channel">¿Dónde nos viste?</label>
          <select id="channel" bind:value={form.channel} required>
            <option value="">Selecciona un canal</option>
            {#each campaign.channels || [] as c}
              <option value={c.key}>{c.label}</option>
            {/each}
          </select>
        </div>
        <div class="field full">
          <label for="interest">Nivel de interés</label>
          <select id="interest" bind:value={form.interest_level} required>
            <option value="">Selecciona</option>
            {#each campaign.interest_levels || [] as i}
              <option value={i.key}>{i.label}</option>
            {/each}
          </select>
        </div>
      </div>

      {#if campaign.number_mode !== 'random'}
        <fieldset class="numbers">
          <legend>Números de rifa (Lotería Nacional)</legend>
          <p class="hint">
            Rango {String(campaign.number_min).padStart(campaign.number_digits, '0')}–
            {String(campaign.number_max).padStart(campaign.number_digits, '0')}. Puedes pedir
            asignación aleatoria o elegir de los disponibles.
          </p>
          <div class="mode">
            <label>
              <input type="radio" bind:group={form.number_mode} value="random" />
              Asignar aleatorio al confirmar
            </label>
            <label>
              <input type="radio" bind:group={form.number_mode} value="pick" />
              Elegir de los disponibles
            </label>
          </div>

          {#if form.number_mode === 'pick'}
            <div class="search-row">
              <input
                placeholder="Buscar terminación o número"
                bind:value={search}
                onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), loadNumbers())}
              />
              <button type="button" class="btn btn-ghost dark" onclick={loadNumbers}>
                {loadingNumbers ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            <div class="number-grid">
              {#each available as n}
                <button
                  type="button"
                  class:selected={form.preferred_numbers.includes(n.label)}
                  onclick={() => toggleNumber(n.label)}
                >
                  {n.label}
                </button>
              {/each}
            </div>
            {#if form.preferred_numbers.length}
              <p class="selected-list">
                Seleccionados: {form.preferred_numbers.join(', ')}
              </p>
            {/if}
          {/if}
        </fieldset>
      {/if}

      <label class="consent">
        <input type="checkbox" bind:checked={form.consent} required />
        Autorizo recibir información sobre rifas y promociones de viaje por WhatsApp, correo o
        llamada.
      </label>

      {#if error}
        <p class="notice error">{error}</p>
      {/if}

      <button class="btn btn-primary" type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Quiero participar'}
      </button>
    </form>
  {/if}
</section>

<style>
  .form-wrap {
    background: white;
    color: var(--ink);
    border-radius: 28px;
    padding: 1.5rem;
    box-shadow: var(--shadow);
  }

  .head h2 {
    font-family: var(--font-display);
    margin: 0 0 0.35rem;
  }

  .head p {
    margin: 0 0 1.2rem;
    opacity: 0.8;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.9rem;
  }

  .full {
    grid-column: 1 / -1;
  }

  .numbers {
    margin: 1.1rem 0;
    border: 1px solid #d7e5e1;
    border-radius: 16px;
    padding: 1rem;
  }

  .hint {
    margin: 0.2rem 0 0.8rem;
    font-size: 0.9rem;
    opacity: 0.8;
  }

  .mode {
    display: grid;
    gap: 0.45rem;
    margin-bottom: 0.8rem;
  }

  .search-row {
    display: flex;
    gap: 0.6rem;
    margin-bottom: 0.8rem;
  }

  .search-row input {
    flex: 1;
    border: 1px solid #d7e5e1;
    border-radius: 12px;
    padding: 0.75rem 0.9rem;
  }

  .btn.dark {
    color: var(--ink);
    background: #e8f7f4;
    border: 1px solid #cce9e2;
  }

  .number-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
    gap: 0.45rem;
  }

  .number-grid button {
    border: 1px solid #cfe3de;
    background: #f7fbfa;
    border-radius: 10px;
    padding: 0.55rem 0.3rem;
    font-weight: 700;
    cursor: pointer;
  }

  .number-grid button.selected {
    background: var(--accent);
    border-color: var(--accent);
    color: #042f2e;
  }

  .selected-list {
    margin: 0.75rem 0 0;
    font-weight: 600;
  }

  .consent {
    display: flex;
    gap: 0.6rem;
    align-items: flex-start;
    margin: 1rem 0;
    font-size: 0.92rem;
  }

  .success h3 {
    margin-top: 0;
  }

  @media (max-width: 720px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>