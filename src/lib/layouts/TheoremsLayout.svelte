
<div class="theorem-wrapper">
    <div class="theorems">
        <slot />
    </div>
</div>

<style>
    .theorem-wrapper {
        width: 100%;
        max-height: 500px;
        padding: 1rem;
        overflow-y: auto;
        background-color: #242424;
        border: 1px solid #424242;
        border-radius: 0.5rem;
    }

    @media (prefers-color-scheme: light) {
        .theorem-wrapper {
            border: 1px solid #d1d1d1;
            background-color: #fff;
        }
    }

    .theorems {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
</style>