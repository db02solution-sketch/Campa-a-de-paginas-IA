<script>
  import '../app.css';
  import { onMount } from 'svelte';
  let { children } = $props();

  onMount(() => {
    // Manejo global de errores
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });
  });
</script>

{@render children()}