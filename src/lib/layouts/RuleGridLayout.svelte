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

    @media screen and (max-width: 768px) {
        .rule-grid {
            grid-template-columns: repeat(4, 1fr);
        }
    }

    @media screen and (max-width: 480px) {
        .rule-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }
</style>