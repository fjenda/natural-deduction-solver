<div class="wrapper">
    <div class="content">
        <slot />
    </div>
</div>

<style>
    .wrapper {
        width: 100%;
        height: 100%;
        background-color: rgba(42, 42, 42, 0.225);
        /*background-color: rgba(0, 0, 0, 0.25);*/
        border-radius: 0.5rem;
        border: 1px solid var(--dark-border-color);
    }

    @media (prefers-color-scheme: light) {
        .wrapper {
            background-color: rgba(249, 249, 249, 0.25);
            border: 1px solid var(--light-border-color);
        }
    }

    .content {
        width: 100%;
        height: 100%;

        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;

        border-radius: 0.5rem;
        padding: 1.5rem;
        text-align: center;
    }
</style>