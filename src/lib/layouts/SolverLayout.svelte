<script lang="ts">
    import Hint from 'svelte-hint';
</script>

<div class="solver-layout">
    <slot />
</div>

<style>
    .solver-layout {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        height: 100%;
    }
</style>

