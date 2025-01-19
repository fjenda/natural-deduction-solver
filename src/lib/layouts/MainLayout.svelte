
<div class="grid-layout">
    <slot />
</div>

<style>
    .grid-layout {
        padding: 2rem;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-gap: 1rem;
        width: 100%;
        height: 100vh;
    }

    @media screen and (max-width: 1200px) {
    /*    switch to 3 rows instead of cols*/
        .grid-layout {
            grid-template-columns: none;
            grid-template-rows: repeat(2, 1fr);
            height: 150vh;
        }
    }
</style>