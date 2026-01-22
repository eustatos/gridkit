<script>
  import { writable } from 'svelte/store';

  const count = writable(0);
  
  function increment() {
    count.update(n => n + 1);
  }
</script>

<main>
  <h1>Hello, Svelte!</h1>
  <p>Count: {$count}</p>
  <button on:click={increment}>Increment</button>
</main>

<style>
  main {
    font-family: Arial, sans-serif;
    text-align: center;
    padding: 2rem;
  }
</style>