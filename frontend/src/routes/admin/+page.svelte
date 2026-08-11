<script>
  import { api } from '$lib/api.js';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  // Importaciones dinámicas para evitar problemas de SSR
  let processPDFFile = $state(null);
  let simulateCredentialProcessing = $state(null);
  let pdfLoaded = $state(false);
  
  onMount(async () => {
    if (browser) {
      try {
        const pdfExtractor = await import('$lib/pdfExtractor.js');
        processPDFFile = pdfExtractor.processPDFFile;
        simulateCredentialProcessing = pdfExtractor.simulateCredentialProcessing;
        pdfLoaded = true;
      } catch (error) {
        console.error('Error loading PDF extractor:', error);
      }
    }
  });

  let token = $state(
    typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''
  );
  let dashboard = $state(null);
  let campaigns = $state([]);
  let leads = $state([]);
  let proposals = $state([]);
  let inquiries = $state([]);
  let error = $state('');
  let loading = $state(false);
  let tab = $state('resumen');
  
  // PDF extraction state
  let pdfFile = $state(null);
  let pdfProcessing = $state(false);
  let pdfResult = $state(null);
  let pdfError = $state('');

  let newCampaign = $state({
    slug: '',
    title: '',
    headline: '',
    brand_name: '',
    whatsapp_number: '',
    status: 'open',
    number_mode: 'both',
    number_min: 1,
    number_max: 60000,
    number_digits: 5,
    ticket_price: 99,
    subtitle: ''
  });

  async function loadAll() {
    if (!token) {
      error = 'Ingresa el token admin';
      return;
    }
    loading = true;
    error = '';
    try {
      localStorage.setItem('admin_token', token);
      const [d, c, l, p, i] = await Promise.all([
        api.admin.dashboard(token),
        api.admin.campaigns(token),
        api.admin.leads(token),
        api.admin.proposals(token),
        api.admin.inquiries(token)
      ]);
      dashboard = d;
      campaigns = c.campaigns || [];
      leads = l.leads || [];
      proposals = p.proposals || [];
      inquiries = i.inquiries || [];
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function createCampaign(e) {
    e.preventDefault();
    try {
      await api.admin.createCampaign(token, {
        ...newCampaign,
        destinations: [
          { key: 'premio', label: 'Premio principal' },
          { key: 'indefinido', label: 'Aún no lo decido' }
        ],
        channels: [
          { key: 'facebook', label: 'Facebook' },
          { key: 'instagram', label: 'Instagram' },
          { key: 'whatsapp', label: 'WhatsApp' }
        ],
        interest_levels: [
          { key: 'buy_now', label: 'Quiero mis boletos ya', score: 5 },
          { key: 'details', label: 'Quiero detalles', score: 3 },
          { key: 'exploring', label: 'Solo exploro', score: 1 }
        ],
        packages: [
          {
            key: 'starter',
            name: 'Paquete Inicial',
            tickets: 1,
            price: Number(newCampaign.ticket_price),
            min_score: 1,
            description: '1 boleto'
          },
          {
            key: 'pro',
            name: 'Paquete Pro',
            tickets: 5,
            price: Number(newCampaign.ticket_price) * 4,
            min_score: 3,
            description: '5 boletos'
          }
        ]
      });
      newCampaign.slug = '';
      newCampaign.title = '';
      newCampaign.headline = '';
      await loadAll();
      tab = 'campañas';
    } catch (err) {
      error = err.message;
    }
  }

  async function generateNumbers(campaignId) {
    try {
      await api.admin.generateNumbers(token, campaignId, 200);
      error = '';
      alert('Pool de números generado / reforzado');
    } catch (err) {
      error = err.message;
    }
  }

  function handlePDFUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      pdfFile = file;
      pdfError = '';
      pdfResult = null;
    } else {
      pdfError = 'Por favor selecciona un archivo PDF válido';
      pdfFile = null;
    }
  }

  async function processPDF() {
    if (!pdfFile) return;
    
    pdfProcessing = true;
    pdfError = '';
    pdfResult = null;
    
    try {
      console.log('Starting PDF processing...');
      console.log('PDF file:', pdfFile.name, pdfFile.type, pdfFile.size);
      console.log('PDF extractor loaded:', !!processPDFFile);
      
      if (!processPDFFile) {
        throw new Error('PDF extractor not loaded yet');
      }
      
      const result = await processPDFFile(pdfFile);
      console.log('PDF processing result:', result);
      
      if (result.success) {
        pdfResult = result.data;
        console.log('PDF data extracted successfully:', pdfResult);
      } else {
        pdfError = result.error;
        console.error('PDF processing failed:', result.error);
      }
    } catch (err) {
      pdfError = err.message;
      console.error('PDF processing error:', err);
    } finally {
      pdfProcessing = false;
    }
  }

  function simulatePDF() {
    pdfProcessing = true;
    pdfError = '';
    pdfResult = null;
    
    try {
      if (!simulateCredentialProcessing) {
        throw new Error('PDF extractor not loaded yet');
      }
      const result = simulateCredentialProcessing();
      if (result.success) {
        pdfResult = result.data;
        pdfFile = { name: result.filename };
      } else {
        pdfError = result.error;
      }
    } catch (err) {
      pdfError = err.message;
    } finally {
      pdfProcessing = false;
    }
  }

  function resetPDF() {
    pdfFile = null;
    pdfResult = null;
    pdfError = '';
  }
</script>

<svelte:head>
  <title>Admin · Plataforma de Rifas</title>
</svelte:head>

<main class="admin">
  <div class="container">
    <header>
      <div>
        <p class="eyebrow">Panel interno</p>
        <h1>Operación de campañas</h1>
      </div>
      <a href="/">← Inicio</a>
    </header>

    <section class="auth">
      <div class="field">
        <label for="token">Admin token</label>
        <input id="token" bind:value={token} placeholder="dev-admin-token o tu ADMIN_TOKEN" />
      </div>
      <button class="btn btn-primary" onclick={loadAll} disabled={loading}>
        {loading ? 'Cargando...' : 'Entrar / refrescar'}
      </button>
    </section>

    {#if error}
      <p class="notice error">{error}</p>
    {/if}

    {#if dashboard}
      <nav class="tabs">
        {#each ['resumen', 'campañas', 'leads', 'propuestas', 'agencia'] as t}
          <button class:active={tab === t} onclick={() => (tab = t)}>{t}</button>
        {/each}
      </nav>

      {#if tab === 'resumen'}
        <div class="stats">
          <article><strong>{dashboard.stats.campaigns}</strong><span>Campañas</span></article>
          <article><strong>{dashboard.stats.leads}</strong><span>Leads</span></article>
          <article><strong>{dashboard.stats.proposals}</strong><span>Propuestas</span></article>
          <article
            ><strong>{dashboard.stats.agency_inquiries}</strong><span>Solicitudes agencia</span
            ></article
          >
        </div>
      {/if}

      {#if tab === 'campañas'}
        <form class="create" onsubmit={createCampaign}>
          <h2>Nueva campaña moldeable</h2>
          <div class="grid">
            <div class="field">
              <label for="slug">Slug</label>
              <input id="slug" bind:value={newCampaign.slug} required placeholder="rifa-autos" />
            </div>
            <div class="field">
              <label for="brand">Marca</label>
              <input id="brand" bind:value={newCampaign.brand_name} required />
            </div>
            <div class="field">
              <label for="title">Título SEO</label>
              <input id="title" bind:value={newCampaign.title} required />
            </div>
            <div class="field">
              <label for="headline">Headline</label>
              <input id="headline" bind:value={newCampaign.headline} required />
            </div>
            <div class="field">
              <label for="wa">WhatsApp</label>
              <input id="wa" bind:value={newCampaign.whatsapp_number} />
            </div>
            <div class="field">
              <label for="price">Precio boleto</label>
              <input id="price" type="number" bind:value={newCampaign.ticket_price} />
            </div>
            <div class="field">
              <label for="mode">Modo números</label>
              <select id="mode" bind:value={newCampaign.number_mode}>
                <option value="both">Aleatorio + elegir</option>
                <option value="random">Solo aleatorio</option>
                <option value="pick">Solo elegir</option>
              </select>
            </div>
            <div class="field">
              <label for="maxn">Máx. número (LN)</label>
              <input id="maxn" type="number" bind:value={newCampaign.number_max} />
            </div>
          </div>
          <button class="btn btn-primary" type="submit">Crear campaña</button>
        </form>

        <div class="list">
          {#each campaigns as c}
            <article>
              <div>
                <h3>{c.brand_name}</h3>
                <p>/{c.slug} · {c.status} · modo {c.number_mode}</p>
              </div>
              <div class="row-actions">
                <a class="btn btn-ghost" href={`/c/${c.slug}`}>Ver landing</a>
                <button class="btn btn-primary" onclick={() => generateNumbers(c.id)}
                  >Generar números</button
                >
              </div>
            </article>
          {/each}
        </div>
      {/if}

      {#if tab === 'leads'}
        <!-- PDF Extraction Section -->
        <div class="pdf-section">
          <h2>Extraer datos de PDF</h2>
          <div class="pdf-upload">
            <div class="field">
              <label for="pdf-file">Seleccionar PDF</label>
              <input 
                id="pdf-file" 
                type="file" 
                accept=".pdf" 
                onchange={handlePDFUpload} 
                disabled={pdfProcessing}
              />
            </div>
            {#if pdfFile}
              <div class="pdf-actions">
                <button 
                  class="btn btn-primary" 
                  onclick={processPDF} 
                  disabled={pdfProcessing || !processPDFFile}
                >
                  {pdfProcessing ? 'Procesando...' : 'Extraer datos'}
                </button>
                <button class="btn btn-ghost" onclick={resetPDF}>Cancelar</button>
              </div>
            {/if}
          </div>
          
          <div class="pdf-simulation">
            <p>¿No tienes un PDF? <button class="btn-link" onclick={simulatePDF} disabled={!simulateCredentialProcessing}>Simular procesamiento de credencial electoral</button></p>
          </div>
          
          {#if pdfError}
            <p class="notice error">{pdfError}</p>
          {/if}
          
          {#if pdfResult}
            <div class="pdf-results">
              <h3>Datos extraídos:</h3>
              <div class="data-grid">
                <div class="data-item">
                  <strong>Nombre completo:</strong>
                  <span>{pdfResult.nombre_completo || 'No encontrado'}</span>
                </div>
                <div class="data-item">
                  <strong>RFC:</strong>
                  <span>{pdfResult.rfc || 'No encontrado'}</span>
                </div>
                <div class="data-item">
                  <strong>CURP:</strong>
                  <span>{pdfResult.curp || 'No encontrado'}</span>
                </div>
                <div class="data-item">
                  <strong>Lugar de nacimiento:</strong>
                  <span>{pdfResult.lugar_nacimiento || 'No encontrado'}</span>
                </div>
                <div class="data-item">
                  <strong>Edad:</strong>
                  <span>{pdfResult.edad ? pdfResult.edad + ' años' : 'No encontrado'}</span>
                </div>
              </div>
            </div>
          {/if}
        </div>

        <div class="table">
          {#each leads as lead}
            <article>
              <strong>{lead.full_name}</strong>
              <span>{lead.whatsapp} · {lead.city || 's/c'}</span>
              <span>{lead.interest_level || '-'} · {lead.status}</span>
            </article>
          {:else}
            <p>Sin leads aún.</p>
          {/each}
        </div>
      {/if}

      {#if tab === 'propuestas'}
        <div class="table">
          {#each proposals as p}
            <article>
              <strong>{p.package_name}</strong>
              <span>${p.total_price} {p.currency} · {p.ticket_qty} boletos</span>
              <span
                >{p.number_assignment}
                {p.selected_numbers?.length ? `· ${p.selected_numbers.join(', ')}` : ''}</span
              >
              <p>{p.message}</p>
            </article>
          {:else}
            <p>Sin propuestas aún.</p>
          {/each}
        </div>
      {/if}

      {#if tab === 'agencia'}
        <div class="table">
          {#each inquiries as i}
            <article>
              <strong>{i.full_name}</strong>
              <span>{i.business_name || 'Sin negocio'} · {i.service_interest}</span>
              <span>{i.whatsapp} · {i.budget_range || 'presupuesto n/d'}</span>
              <p>{i.goals || 'Sin detalle'}</p>
            </article>
          {:else}
            <p>Sin solicitudes de agencia.</p>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</main>

<style>
  .admin {
    min-height: 100vh;
    background: linear-gradient(180deg, #f3efe6, #e7f3ef);
    color: var(--ink);
    padding: 2rem 0 3rem;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 1rem;
    margin-bottom: 1.2rem;
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.75rem;
    opacity: 0.7;
    margin: 0;
  }

  h1,
  h2,
  h3 {
    font-family: var(--font-display);
  }

  h1 {
    margin: 0.2rem 0 0;
  }

  .auth {
    display: flex;
    gap: 0.8rem;
    align-items: end;
    margin-bottom: 1rem;
  }

  .auth .field {
    flex: 1;
  }

  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin: 1rem 0;
  }

  .tabs button {
    border: 1px solid #c9ddd7;
    background: white;
    border-radius: 999px;
    padding: 0.45rem 0.9rem;
    text-transform: capitalize;
    cursor: pointer;
  }

  .tabs button.active {
    background: #0f766e;
    color: white;
    border-color: #0f766e;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.8rem;
  }

  .stats article,
  .list article,
  .table article,
  .create {
    background: white;
    border-radius: 16px;
    padding: 1rem;
    border: 1px solid #d9e7e2;
  }

  .stats strong {
    display: block;
    font-size: 1.7rem;
  }

  .create {
    margin-bottom: 1rem;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem;
    margin-bottom: 0.9rem;
  }

  .list,
  .table {
    display: grid;
    gap: 0.7rem;
  }

  .list article {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
  }

  .row-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .btn-ghost {
    color: var(--ink);
    background: #eef7f4;
    border: 1px solid #d3e6e0;
  }

  .table article {
    display: grid;
    gap: 0.25rem;
  }

  .table span,
  .list p {
    opacity: 0.75;
    font-size: 0.92rem;
  }

  .pdf-section {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    border: 1px solid #d9e7e2;
    margin-bottom: 1.5rem;
  }

  .pdf-section h2 {
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .pdf-upload {
    display: flex;
    gap: 1rem;
    align-items: end;
    margin-bottom: 1rem;
  }

  .pdf-upload .field {
    flex: 1;
  }

  .pdf-actions {
    display: flex;
    gap: 0.5rem;
  }

  .pdf-simulation {
    margin-top: 1rem;
    padding: 0.8rem;
    background: #fef3c7;
    border-radius: 8px;
    border: 1px solid #fde68a;
  }

  .pdf-simulation p {
    margin: 0;
    font-size: 0.9rem;
  }

  .btn-link {
    background: none;
    border: none;
    color: #92400e;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    font-size: 0.9rem;
  }

  .btn-link:hover {
    color: #78350f;
  }

  .pdf-results {
    margin-top: 1.5rem;
    padding: 1rem;
    background: #f0fdf4;
    border-radius: 12px;
    border: 1px solid #bbf7d0;
  }

  .pdf-results h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #166534;
  }

  .data-grid {
    display: grid;
    gap: 0.8rem;
  }

  .data-item {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #dcfce7;
  }

  .data-item:last-child {
    border-bottom: none;
  }

  .data-item strong {
    color: #166534;
  }

  .data-item span {
    font-weight: 500;
  }

  @media (max-width: 860px) {
    .stats,
    .grid,
    .list article {
      grid-template-columns: 1fr;
      flex-direction: column;
      align-items: stretch;
    }

    .auth {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>