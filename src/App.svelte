<script lang="ts">
    import FormulaInput from "./lib/solver/components/FormulaInput.svelte";
    import PremiseInput from "./lib/solver/components/PremiseInput.svelte";
    import MainLayout from "./lib/layouts/MainLayout.svelte";
    import Panel from "./lib/Panel.svelte";
    import SolverLayout from "./lib/layouts/SolverLayout.svelte";
    import PremiseInputRow from "./lib/solver/components/PremiseInputRow.svelte";
    import TheoremsLayout from "./lib/layouts/TheoremsLayout.svelte";
    import TheoremSlot from "./lib/rules/components/TheoremSlot.svelte";
    import {theorems} from "./stores/theoremsStore";
    import {addPremise, solverContent} from "./stores/solverStore";
    import {Solution} from "./lib/solver/Solution";
    import {PremiseParser} from "./lib/solver/parsers/PremiseParser";
    import RuleGridLayout from "./lib/layouts/RuleGridLayout.svelte";
    import RuleSlot from "./lib/rules/components/RuleSlot.svelte";
    import {DeductionRule} from "./lib/solver/parsers/DeductionRules";
    import Separator from "./lib/Separator.svelte";
    import {Node} from "./lib/parsers/Node";
    import {DeductionProcessor} from "./lib/parsers/DeductionProcessor";

    // $solverContent.premises = ["@x [(P(x,a) & P(x,b)) > Q(x,b)]", "?x [!Q(x,b) & P(x,b)]"];
    $solverContent.premises = ["@x [L(x) > !S(x)]", "?y [L(y) & P(y)]"];
    // $solverContent.premises = ["P(x,a)", "Q(x,b)"];
    // $solverContent.conclusion = "?x [P(x,a) > Q(x,b)]";
    $solverContent.conclusion = "?x [S(x,a) > P(x,a)]";

    $: parsedPremises = $solverContent.premises.map(premise => {
        return PremiseParser.parsePremise(premise);
    });

    $: parsedContent = PremiseParser.parsePremise($solverContent.conclusion);

    function addTheorem() {
        theorems.update((theorems) => [...theorems, new Solution("Unnamed Theorem")]);

        if (parsedPremises[0] && parsedPremises[1]) {
            const op = new Node("LogicalOp", "&");
            const res = DeductionProcessor.introduceOperator(parsedPremises[0], parsedPremises[1], op);
            console.log(DeductionProcessor.toString(res!));
            res!.print();
        }

        // solverContent.update((sc) => {
        //     sc.addProof(DeductionRule.tokensToString(DeductionRule.applyEEX(parsedPremises[0]!)));
        //     return sc;
        // });
    }
</script>

<main>
  <MainLayout>
    <Panel>
        <SolverLayout>
            {#each Array.from($solverContent.premises) as _, i}
                <PremiseInputRow index="{i}">
                    <PremiseInput placeholder="Premise {i + 1}" bind:value="{$solverContent.premises[i]}" error="{!parsedPremises[i]}" />
                </PremiseInputRow>
            {/each}
            <button class="add-button" on:click={() => addPremise()}>Add Premise</button>
            <PremiseInput placeholder="Conclusion" bind:value="{$solverContent.conclusion}" error="{!parsedContent}" />
            <FormulaInput bind:formulas="{$solverContent.proof}" />
        </SolverLayout>
    </Panel>

    <Panel>
        <h2>Deduction Rules</h2>
        <RuleGridLayout>
            {#each DeductionRule.rules as rule}
                <RuleSlot rule="{rule}" />
            {/each}
        </RuleGridLayout>

        <Separator />

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
        /*height: 100%;*/
        height: 3.5rem;
        border: 1px solid var(--dark-border-color);
        transition: color 0.2s, border 0.2s, background-color 0.2s;
    }

    .add-button:hover {
        color: #00ff00;
        border: 1px solid #00ff00;
        outline: none;
    }

    @media (prefers-color-scheme: light) {
        .add-button {
            border: 1px solid var(--light-border-color);
        }

        .add-button:hover {
            color: #00c800;
            border: 1px solid #00c800;
        }
    }
</style>