<script lang="ts">
    export let fn: (index: number) => void;
    export let index: number;
</script>

<div class="premise-input-wrapper">
    <slot />
    <button
        type="button"
        aria-label="Remove premise"
        on:click={() => fn(index)}
    >
        <i class="fa fa-xmark"></i>
    </button>
</div>

<style>
    .premise-input-wrapper {
        display: flex;
        align-items: center;
    }

    .premise-input-wrapper button i {
        font-size: 1.5rem;
    }

    .premise-input-wrapper button {
        margin-left: 0.5rem;
        cursor: pointer;
        max-height: 3.5rem;
        height: 100%;
        aspect-ratio: 1;
        text-align: center;
        border: 1px solid #424242;
        transition: color 0.2s, border 0.2s;
    }

    .premise-input-wrapper button:hover,
    .premise-input-wrapper button:focus {
        color: #ff0000;
        border: 1px solid #ff0000;
        outline: none;
    }
</style>
