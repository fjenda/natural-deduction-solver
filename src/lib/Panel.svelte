<div class="wrapper">
    <div class="content">
        <slot />
    </div>
</div>

<style>
    .wrapper {
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.25);
        border-radius: 0.5rem;
        border: 1px solid #424242;
    }

    .content {
        width: 100%;
        height: 100%;
        border-radius: 0.5rem;
        padding: 1.5rem;
    }
</style>