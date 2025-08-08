<script lang="ts">
    import TheoremsLayout from "../../layouts/TheoremsLayout.svelte";
    import { addTheorem, theorems } from "../../../stores/theoremsStore";
    import { theoremData } from "../../../stores/solverStore";
    import TheoremSlot from "../../rules/components/TheoremSlot.svelte";
    import StyledButton from "../../components/StyledButton/StyledButton.svelte";
    import { solving } from "../../../stores/stateStore";
    import { fillVariables } from "../../solver/actions/proofActions";
</script>

<h2>Theorems</h2>
<StyledButton
    text="Add Theorem"
    onClick={addTheorem}
/>
<TheoremsLayout>
    {#if $theorems.length === 0}
        <p>No theorems added yet.</p>
    {/if}

    {#each $theorems as theorem, i}
        <TheoremSlot
            name="{theorem.name}"
            index="{i}"
            valid={theorem.valid && theorem.complete}
            onClick={() => {
                if (!$solving) return;

                const values = theorem.whole.tree?.variables;
                if (!values) return;
                theoremData.update(td => {
                    td.theoremId = i;
                    td.vars = new Set(values);
                    return td;
                });
                fillVariables();
            }}
        />
    {/each}
</TheoremsLayout>