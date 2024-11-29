<script lang="ts">
    import {removePremise} from "../../../stores/solverStore";

    export let index: number;
</script>

<div class="premise-input-wrapper">
    <slot />
    <button
        type="button"
        aria-label="Remove premise"
        on:click={() => removePremise(index)}
    >
        <i class="fa fa-xmark"></i>
    </button>
</div>

<style>
    .premise-input-wrapper {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .premise-input-wrapper button i {
        font-size: 1.25rem;
    }

    .premise-input-wrapper button {
        width: 20px;
        aspect-ratio: 1;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        border: none;
        transition: color 0.2s;
    }

    .premise-input-wrapper button:hover {
        color: #ff0000;
    }

    .premise-input-wrapper button:hover,
    .premise-input-wrapper button:focus {
        outline: none;
        border: none;
    }

    @media (prefers-color-scheme: light) {
        .premise-input-wrapper button {
            background: var(--light-bg-color);
        }
    }
</style>
