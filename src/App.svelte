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
    import {addPremise, highlightedRows, parsedProof, selectedRow, solverContent} from "./stores/solverStore";
    import {Solution} from "./lib/solver/Solution";
    import {PremiseParser} from "./lib/solver/parsers/PremiseParser";
    import RuleGridLayout from "./lib/layouts/RuleGridLayout.svelte";
    import RuleSlot from "./lib/rules/components/RuleSlot.svelte";
    import {DeductionRule} from "./lib/solver/parsers/DeductionRules";
    import Separator from "./lib/Separator.svelte";
    import {EditState} from "./types/EditState";
    import {editState} from "./stores/stateStore";
    import Modal from "./lib/Modal.svelte";
    import type {ButtonContent} from "./types/ButtonContent";
    import {DeductionProcessor} from "./lib/parsers/DeductionProcessor";
    import {get} from "svelte/store";

    // $solverContent.premises = ["∀x [L(x) ⊃ ¬S(x)]", "∃y [L(y) ∧ P(y)]"];
    // $solverContent.conclusion = "∃z [¬S(z) ∧ P(z)]";
    // $solverContent.proof = "∀x [L(x) ⊃ ¬S(x)]\n∃y [L(y) ∧ P(y)]";

    $solverContent.premises = ["(¬a ∧ ¬b)"];
    $solverContent.conclusion = "¬(a ∨ b)";
    // $solverContent.proof = "(¬a ∧ ¬b)\na ∨ b";
    $solverContent.proof = "a\nb\nc\nd";

    // $solverContent.premises = ["∀x [(P(x,a) ∧ P(x,b)) ⊃ Q(x,b)]", "∃x [¬Q(x,b) ∧ P(x,b)]"];
    // $solverContent.premises = ["P(x,a)", "Q(x,b)"];
    // $solverContent.premises = ["(a ⊃ b ∨ c) ∧ (d ≡ e ⊃ f ∨ g)"];
    // $solverContent.premises = ["a ⊃ b ∨ ¬c ∧ d ≡ e ⊃ f ∨ g"];
    // $solverContent.proof = "a\nb";
    // $solverContent.premises = ["a", "b"];
    // $solverContent.conclusion = "a";
    // $solverContent.conclusion = "∃x [P(x,a) ⊃ Q(x,b)]";
    // $solverContent.conclusion = "f(a) ⊃ g(x)";
    // $solverContent.conclusion = "∀x [f(x) ⊃ b]";

    $: parsedPremises = $solverContent.premises.map(premise => {
        return PremiseParser.parsePremise(premise);
    });

    $: parsedContent = PremiseParser.parsePremise($solverContent.conclusion);

    function addTheorem() {
        theorems.update((theorems) => [...theorems, new Solution("Unnamed Theorem")]);

        // if (parsedPremises[0] && parsedPremises[1]) {
        //     const res = DeductionProcessor.introduceOperator(parsedPremises[0], parsedPremises[1], "&");
        //     // console.log(DeductionProcessor.toString(res!));
        //     res!.print();
        // }

        // solverContent.update((sc) => {
        //     sc.addProof(DeductionRule.tokensToString(DeductionRule.applyEEX(parsedPremises[0]!)));
        //     return sc;
        // });
    }

    let modalInputValue = "";
    let showModal = false;
    let modalContent = "Select the second row with which to execute the rule";
    let modalButtons: ButtonContent[] = [
        {
            text: "Confirm",
            action: () => {
                showModal = false;
            }
        },
        {
            text: "Cancel",
            action: () => {
                showModal = false;
            }
        }
    ];

    function setConfirmButtonAction(action: () => void) {
        modalButtons[0].action = action;
    }

    function handleRuleClick(rule: DeductionRule) {
        const proof = get(parsedProof);
        const selected = get(selectedRow);
        const highlighted = get(highlightedRows);
        const selectedProof = proof[selected - 1];

        setConfirmButtonAction(() => {
            const other = parseInt(modalInputValue);
            const highlightedProof = highlighted.length > 0 ? proof[other - 1] : null;
            console.log(`values are: ${selected}, ${other}`);

            DeductionProcessor.applyRule(rule.short, selectedProof, highlightedProof);
            highlightedRows.set([]);
            modalInputValue = "";
        });
        showModal = true;
    }
</script>

<main>
  <Modal bind:show={showModal} bind:content={modalContent} bind:buttons={modalButtons}>
      <div slot="body" on:click|stopPropagation>
          <input
                  type="text"
                  placeholder="Enter the row number"
                  bind:value={modalInputValue}
          />
      </div>
  </Modal>
  <MainLayout>
    <Panel>
        <SolverLayout>
            {#each Array.from($solverContent.premises) as _, i}
                <PremiseInputRow index="{i}">
                    <PremiseInput placeholder="Premise {i + 1}" bind:value="{$solverContent.premises[i]}" error="{!parsedPremises[i]}" />
                </PremiseInputRow>
            {/each}

            {#if $editState === EditState.SOLVER}
                <button class="add-button" on:click={() => addPremise()}>Add Premise</button>
                <PremiseInput placeholder="Conclusion" bind:value="{$solverContent.conclusion}" error="{!parsedContent}" />
            {/if}
            <FormulaInput bind:formulas="{$solverContent.proof}" highlight_rows="{$highlightedRows}" />
        </SolverLayout>
    </Panel>

    <Panel>
        <h2>Deduction Rules</h2>
        <RuleGridLayout>
            {#each DeductionRule.rules as rule}
                <RuleSlot rule="{rule}"
                          onClick={() => { handleRuleClick(rule) }}
                />
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
        height: 3.5rem;
    }

    .add-button:hover {
        color: #00ff00;
        border: 1px solid #00ff00;
        outline: none;
    }

    @media (prefers-color-scheme: light) {
        .add-button:hover {
            color: #00c800;
            border: 1px solid #00c800;
        }
    }

    [slot="body"] {
        pointer-events: auto;
    }
</style>