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
        position: relative;
    }

    .premise-input-wrapper button i {
        font-size: 1.25rem;
    }

    .premise-input-wrapper button {
        transition: color 0.2s;
        position: absolute;
        top: 50%;
        right: 1px;
        transform: translateY(-50%);
        background: #121212;
        padding: 0;
        border: none;
        height: 90%;
        aspect-ratio: 1;
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
            background: #ffffff;
        }
    }
</style>
