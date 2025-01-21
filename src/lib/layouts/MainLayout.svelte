
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
        height: 100vh;
    }

    @media screen and (max-width: 950px) {
    /*    switch to 2 rows instead of cols*/
        .grid-layout {
            grid-template-columns: none;
            grid-template-rows: repeat(2, 1fr);
            height: auto;
        }
    }
</style>