<script lang="ts">
    import type {DeductionRule} from "../../solver/parsers/DeductionRules";

    export let rule: DeductionRule;
</script>

<div class="rule-slot" title="{rule.title}" >
    {rule.short}
</div>

<style>
    .rule-slot {
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.25rem;

        width: 100%;
        aspect-ratio: 1;
        /*padding: 1.5rem;*/
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
    }
</style>