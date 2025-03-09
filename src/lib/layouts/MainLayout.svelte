
<div class="grid-layout">
    <slot />
</div>

<style>
    .grid-layout {
        padding: 2rem;
        display: grid;
        grid-template-columns: 2fr 1fr;
        grid-gap: 1rem;
        width: 100%;
        max-width: 1920px;
        height: 100vh;
        margin: 0 auto;
    }

    @media screen and (max-width: 950px) {
        .grid-layout {
            grid-template-columns: none;
            grid-template-rows: repeat(2, 1fr);
            height: auto;
        }
    }
</style>