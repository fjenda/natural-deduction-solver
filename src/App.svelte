<script lang="ts">
    import FormulaInput from "./lib/solver/components/FormulaInput.svelte";
    import PremiseInput from "./lib/solver/components/PremiseInput.svelte";
    import MainLayout from "./lib/layouts/MainLayout.svelte";
    import Panel from "./lib/Panel.svelte";
    import SolverLayout from "./lib/layouts/SolverLayout.svelte";
    import PremiseInputRow from "./lib/solver/components/PremiseInputRow.svelte";
    import RulesLayout from "./lib/layouts/TheoremsLayout.svelte";
    import RuleSlot from "./lib/rules/components/TheoremSlot.svelte";
    import {DeductionRule} from "./types/DeductionRules";
    import TheoremsLayout from "./lib/layouts/TheoremsLayout.svelte";
    import TheoremSlot from "./lib/rules/components/TheoremSlot.svelte";
    import {theorems} from "./stores/theoremsStore";
    import {solverContent} from "./stores/solverStore";
    import {Solution} from "./lib/solver/Solution";

    $solverContent.premises = ["", ""];

    function addPremise() {
        $solverContent.premises = [...$solverContent.premises, ""];
    }

    function removePremise(index: number) {
        $solverContent.premises = $solverContent.premises.filter((_, i) => i !== index);
    }

    function addTheorem() {
        theorems.update((theorems) => [...theorems, new Solution("Unnamed Theorem")]);
    }
</script>

<main>
  <MainLayout>
    <Panel>
        <SolverLayout>
            {#each Array.from($solverContent.premises) as _, i}
                <PremiseInputRow fn={removePremise} index="{i}">
                    <PremiseInput placeholder="Premise {i + 1}" bind:value="{$solverContent.premises[i]}" />
                </PremiseInputRow>
            {/each}
            <button class="add-button" on:click={() => addPremise()}>Add Solution</button>
            <PremiseInput placeholder="Conclusion" bind:value="{$solverContent.conclusion}" />
            <FormulaInput bind:formulas="{$solverContent.proof}" />
        </SolverLayout>
    </Panel>

    <Panel>
        <h2>Theorems</h2>
        <button class="add-button" on:click={() => addTheorem()}>Add Theorem</button>
        <TheoremsLayout>
            {#if $theorems.length === 0}
                <p>No theorems added yet.</p>
            {/if}

            {#each $theorems as theorem, i}
                <TheoremSlot name="{theorem.name}" index="{i}" />
            {/each}
        </TheoremsLayout>
    </Panel>
  </MainLayout>
</main>

<style>
    .add-button {
        width: 100%;
        height: 100%;
        max-height: 3.5rem;
        border: 1px solid #424242;
        transition: color 0.2s, border 0.2s;
    }

    .add-button:hover {
        color: #00ff00;
        border: 1px solid #00ff00;
        outline: none;
    }

    @media (prefers-color-scheme: light) {
        .add-button {
            border: 1px solid #d1d1d1;
        }

        .add-button:hover {
            color: #00c800;
            border: 1px solid #00c800;
        }
    }
</style>