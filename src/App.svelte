<script lang="ts">
    import FormulaInput from "./lib/solver/components/FormulaInput.svelte";
    import PremiseInput from "./lib/solver/components/PremiseInput.svelte";
    import MainLayout from "./lib/layouts/MainLayout.svelte";
    import Panel from "./lib/Panel.svelte";
    import SolverLayout from "./lib/layouts/SolverLayout.svelte";
    import PremiseInputRow from "./lib/solver/components/PremiseInputRow.svelte";

    let premises: string[] = ["", ""];

    function addPremise() {
        premises = [...premises, ""];
    }

    function removePremise(index: number) {
        premises = premises.filter((_, i) => i !== index);
    }
</script>

<main>
  <MainLayout>
<!--    <Panel>-->
<!--        <h2>Analysis</h2>-->
<!--    </Panel>-->

    <Panel>
        <SolverLayout>
            {#each Array.from(premises) as _, i}
                <PremiseInputRow fn={removePremise} index="{i}">
                    <PremiseInput placeholder="Premise {i + 1}" bind:value="{premises[i]}" />
                </PremiseInputRow>
            {/each}
            <button class="add-premise-button" on:click={() => addPremise()}>Add Premise</button>
            <PremiseInput placeholder="Conclusion" />
            <FormulaInput />
        </SolverLayout>
    </Panel>

    <Panel>
        <h2>Rules</h2>
    </Panel>
  </MainLayout>
</main>

<style>
    .add-premise-button {
        height: 100%;
        max-height: 3.5rem;
        border: 1px solid #424242;
        transition: color 0.2s, border 0.2s;
    }

    .add-premise-button:hover,
    .add-premise-button:focus {
        color: #00ff00;
        border: 1px solid #00ff00;
        outline: none;
    }
</style>