<script lang="ts">
  import FormulaInput from "./lib/solver/FormulaInput.svelte";
  import StatementInput from "./lib/solver/StatementInput.svelte";
</script>

<main>
  <StatementInput />
  <FormulaInput />
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }
</style>
