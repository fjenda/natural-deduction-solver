<script lang="ts">
    import type { DeductionRule } from "../../solver/parsers/DeductionRules";
    import { highlightedRows, selectedRows } from "../../../stores/solverStore";
    import Tooltip from "../../Tooltip.svelte";
    import { usable } from "../../solver/solverLogic";
    import { get } from "svelte/store";

    export let rule: DeductionRule;
    export let onClick: () => void;
    export let onMouseOver: () => void;
    export let onMouseOut: () => void;
    let showTooltip: boolean = false;

    async function handleClick() {
        const result = await usable(rule, get(selectedRows)[0]);
        if (!result.applicable) return;

        highlightedRows.set(result.highlighted);
        onClick();
        highlightedRows.set([]);
    }

    function handleMouseOver() {
        onMouseOver();
        showTooltip = true;
    }

    function handleMouseOut() {
        onMouseOut();
        showTooltip = false;
    }
</script>

<div class="wrapper">
    <Tooltip content={rule.detail} position="bottom" show={showTooltip} />
    <button
            class="rule-slot"
            title="{rule.title}"
            on:mouseover={handleMouseOver}
            on:focus={handleMouseOver}
            on:mouseout={handleMouseOut}
            on:blur={handleMouseOut}
            on:mousedown|preventDefault={handleClick}
    >
        {rule.short}
    </button>
</div>

<style>
    .wrapper {
        width: 25%;
        max-width: 7.5rem;
        position: relative;
    }

    .rule-slot {
        /*display: flex;*/
        /*justify-content: center;*/
        /*align-items: center;*/
        font-size: 1.25rem;
        width: 100%;
        aspect-ratio: 1;
        padding: 1rem;
        cursor: pointer;
        border-radius: 0.5rem;
        border: 1px solid var(--dark-border-color);
        background: var(--dark-element-color);
    }

    .rule-slot:hover {
        border: 1px solid var(--light-border-color);
    }

    @media (prefers-color-scheme: light) {
        .rule-slot {
            border: 1px solid var(--light-border-color);
            background: var(--light-element-color);
        }

        .rule-slot:hover {
            border: 1px solid var(--dark-border-color);
        }
    }

    @media screen and (max-width: 1200px) {
        .wrapper {
            width: 33%;
        }
    }
</style>