<div class="rule-grid">
    <slot />
</div>

<style>
    .rule-grid {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 1rem;
    }
</style>