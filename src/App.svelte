<script lang="ts">
    import PremiseInput from "./lib/solver/components/PremiseInput.svelte";
    import MainLayout from "./lib/layouts/MainLayout.svelte";
    import Panel from "./lib/Panel.svelte";
    import SolverLayout from "./lib/layouts/SolverLayout.svelte";
    import PremiseInputRow from "./lib/solver/components/PremiseInputRow.svelte";
    import TheoremsLayout from "./lib/layouts/TheoremsLayout.svelte";
    import TheoremSlot from "./lib/rules/components/TheoremSlot.svelte";
    import { theorems } from "./stores/theoremsStore";
    import {
        addPremise,
        deductionRules,
        highlightedRows,
        logicMode,
        selectedRows,
        solverContent
    } from "./stores/solverStore";
    import { Solution } from "./lib/solver/Solution";
    import { PremiseParser } from "./lib/solver/parsers/PremiseParser";
    import RuleGridLayout from "./lib/layouts/RuleGridLayout.svelte";
    import RuleSlot from "./lib/rules/components/RuleSlot.svelte";
    import { DeductionRule, NDRule } from "./lib/solver/parsers/DeductionRules";
    import Separator from "./lib/Separator.svelte";
    import { EditState } from "./types/EditState";
    import { editState } from "./stores/stateStore";
    import Modal from "./lib/Modal.svelte";
    import type { ButtonContent } from "./types/ButtonContent";
    import { DeductionProcessor } from "./lib/solver/parsers/DeductionProcessor";
    import { get } from "svelte/store";
    import SolverTable from "./lib/solver/components/solver-table/SolverTable.svelte";
    import { onMount } from "svelte";
    import {
        applyRule,
        checkProof,
        onChangeConclusion,
        onChangePremise,
        setupProof,
        verifyResult
    } from "./lib/solver/solverLogic";
    import MathMLViewer from "./lib/solver/components/MathMLViewer.svelte";
    import { ParseStrategy } from "./types/ParseStrategy";


    // $solverContent.premises = ["∀x [L(x) ⊃ ¬S(x)]", "∃y [L(y) ∧ P(y)]"];
    // $solverContent.conclusion = "∃z [¬S(z) ∧ P(z)]";
    // $solverContent.proof = "∀x [L(x) ⊃ ¬S(x)]\n∃y [L(y) ∧ P(y)]";

    // $solverContent.premises = ["L(a) ⊃ ¬S(a)", "L(a) ∧ P(a)"];
    // $solverContent.conclusion = "P(a) ∧ ¬S(a)";

    $solverContent.premises = [
        { value: "A ∧ B", tree: null },
        { value: "B ⊃ C", tree: null }
    ];
    $solverContent.conclusion = { value: "C", tree: null };

    // $solverContent.premises = ["∀x [(P(x,a) ∧ P(x,b)) ⊃ Q(x,b)]", "∃x [¬Q(x,b) ∧ P(x,b)]"];
    // $solverContent.premises = ["P(x,a)", "Q(x,b)"];
    // $solverContent.conclusion = "∃x [P(x,a) ⊃ Q(x,b)]";

    function addTheorem() {
        theorems.update((theorems) => [...theorems, new Solution("Unnamed Theorem", [{ value: "", tree: null }])]);
    }

    let modalInput: HTMLInputElement;
    let showModal = false;
    let modalHeader = "Select row";
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

    function setModalButton(index: number, text: string, action: () => void) {
        modalButtons[index].text = text;
        modalButtons[index].action = action;
    }

    function handleRuleClick(rule: DeductionRule) {
        const proof = get(solverContent).proof;
        const selected = get(selectedRows);
        const highlighted = get(highlightedRows);

        // make the user select at least one row
        if (selected.length === 0) {
            alert("Select at least one row");
            return;
        }

        // if the user selected more rows than needed for the rule
        if (selected.length > rule.inputSize) {
            alert("Too many rows selected");
            return;
        }

        // if the number of selected rows is equal to the number of rows needed for the rule
        if (selected.length === rule.inputSize) {
            applyRule(rule.short, proof[selected[0] - 1], proof[selected[1] - 1]);
            return;
        }

        // if the number of selected rows is not equal to the number of rows needed for the rule
        // display modal and make the user select the row there
        if (rule.short === NDRule.IDIS) {
            showModalWithInput("Insert formula", "Write the formula to insert into the disjunction", "Enter the formula", () => {
                const formula = PremiseParser.parsePremise(modalInput.value);
                if (!formula.tree) {
                    alert("Invalid formula");
                    return;
                }

                applyRule(rule.short, proof[selected[0] - 1], {
                   line: -1,
                   tree: formula.tree,
                   value: formula.value,
                   rule: { rule: NDRule.UNKNOWN },
                });

                closeModal();
            });
            return;
        }

        showModalWithInput("Select row", "Select the second row with which to execute the rule", "Enter row number", () => {
            const other = parseInt(modalInput.value);
            if (isNaN(other) || other < 1 || other > proof.length) {
                alert("Invalid row number");
                return;
            }

            if (selected.includes(other)) {
                alert("Cannot select the same row");
                return;
            }

            const highlightedProof = highlighted.includes(other) ? proof[other - 1] : null;
            if (highlightedProof) {
                applyRule(rule.short, proof[selected[0] - 1], highlightedProof);
            }

            closeModal();
        });
    }

    // Utility function to show a modal with an input field
    function showModalWithInput(header: string, content: string, placeholder: string, onConfirm: () => void) {
        modalHeader = header;
        modalContent = content;
        modalInput.placeholder = placeholder;

        setModalButton(0, "Confirm", onConfirm);
        setModalButton(1, "Cancel", closeModal);

        showModal = true;
        setTimeout(() => modalInput.focus(), 50);
    }

    // Closes the modal and resets the input
    function closeModal() {
        modalInput.value = "";
        showModal = false;
        selectedRows.set([]);
    }

    let solving: boolean = false;
    let showConclusionSelect: boolean = false;
    function startSolver() {
        // if the conclusion is invalid, return
        if (!$solverContent.conclusion.tree) {
            alert("Conclusion is not valid");
            return;
        }

        const setup = (isIndirect: boolean) => {
            setupProof(isIndirect);
            showConclusionSelect = false;
            solving = true;
        }

        setModalButton(0, "Direct Proof", () => setup(false));
        setModalButton(1, "Indirect Proof", () => setup(true));

        showConclusionSelect = true;
    }

    function resetSolving() {
        solving = false;
        selectedRows.set([]);
        solverContent.update(sc => {
            sc.proof = [];
            return sc;
        });
    }

    onMount(() => {
        // call onChangePremise/Conclusion to parse the initial values
        $solverContent.premises.forEach((premise, i) => {
            onChangePremise(premise.value, i);
        });

        onChangeConclusion($solverContent.conclusion.value);
    });

    let premises = '';
    let conclusion = '';
    let rule = '';
    let result: string = '';

    function switchMode() {
        logicMode.update(mode => mode === ParseStrategy.PROPOSITIONAL ? ParseStrategy.PREDICATE : ParseStrategy.PROPOSITIONAL);
        deductionRules.set(DeductionRule.rules);
        $solverContent.premises.forEach((premise, i) => {
            onChangePremise(premise.value, i);
        });
        onChangeConclusion($solverContent.conclusion.value);
    }
</script>

<main>
    <textarea bind:value={premises} placeholder="Enter premises (one per line)"></textarea>
<!--    <input bind:value={premises} placeholder="Enter premises" />-->
    <input bind:value={conclusion} placeholder="Enter conclusion" />
    <input bind:value={rule} placeholder="Enter rule" />
    <button on:click={async () => result = await verifyResult(premises, conclusion, rule)}>Prove</button>

    <pre>{result}</pre>

    <button on:click={switchMode} class="action-button">Switch Mode</button>

  <Modal bind:show={showModal} bind:content={modalContent} bind:buttons={modalButtons} bind:header={modalHeader}>
      <div slot="body">
          <input
              type="text"
              placeholder="Enter the row number"
              name="modal-input"
              bind:this={modalInput}
          />
      </div>
  </Modal>
  <Modal bind:show={showConclusionSelect} bind:buttons={modalButtons} header="Select Proof Type" />
  <MainLayout>
    <Panel>
        <SolverLayout>
            {#if !solving}
                {#each Array.from($solverContent.premises) as _, i}
                    <PremiseInputRow index="{i}" removable={$editState === EditState.SOLVER}>
                        <PremiseInput
                            placeholder={$editState === EditState.SOLVER ? `Premise ${i + 1}` : "Theorem"}
                            bind:value="{$solverContent.premises[i].value}"
                            error="{!$solverContent.premises[i].tree}"
                            index={i}
                            onChange={() => onChangePremise($solverContent.premises[i].value, i)}
                        />
                    </PremiseInputRow>
                {/each}

                {#if $editState === EditState.SOLVER}
                    <button
                        class="action-button"
                        on:click={() => addPremise()}
                        tabindex={$solverContent.premises.length}
                    >
                        Add Premise
                    </button>
                {/if}
            {/if}
            {#if $editState === EditState.SOLVER}
                {#if !solving}
                    <PremiseInput
                        placeholder="Conclusion"
                        bind:value="{$solverContent.conclusion.value}"
                        error="{!$solverContent.conclusion.tree}"
                        index={$solverContent.premises.length + 1}
                        onChange={() => onChangeConclusion($solverContent.conclusion.value)}
                    />
                {:else}
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        Find a proof for the following conclusion:
                        <MathMLViewer value={$solverContent.conclusion.value} />
                    </div>
                {/if}
            {/if}

            <div class="button-wrapper">
                {#if solving}
                    <button
                            class="action-button"
                            on:click={checkProof}
                            tabindex={$solverContent.premises.length + 2}
                    >
                        Check Proof
                    </button>
                {:else}
                    <button
                        class="action-button"
                        on:click={startSolver}
                        tabindex={$solverContent.premises.length + 2}
                    >
                        Prove
                    </button>
                {/if}
                <button
                    class="action-button reset"
                    on:click={resetSolving}
                    disabled={!solving}
                    tabindex={$solverContent.premises.length + 3}
                >
                    Reset
                </button>
            </div>

            {#if solving}
                <SolverTable data={$solverContent.proof} />
            {/if}
        </SolverLayout>
    </Panel>

    <Panel>
        <h2>Deduction Rules</h2>
        <RuleGridLayout>
            {#each $deductionRules as rule}
                <RuleSlot rule="{rule}"
                          onClick={() => { handleRuleClick(rule) }}
                          onMouseOver={() => {
                              if (!solving) return;
                              if (get(selectedRows).length === rule.inputSize) return;
                              const rows = DeductionProcessor.getUsableRows(rule.short);
                              highlightedRows.set(rows.highlighted);
                          }}
                          onMouseOut={() => {
                              if (!solving) return;
                              highlightedRows.set([]);
                          }}
                />
            {/each}
        </RuleGridLayout>

        <Separator />

        <h2>Theorems</h2>
        <button class="action-button" on:click={() => addTheorem()}>Add Theorem</button>
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
    .action-button {
        width: 100%;
        height: 3.5rem;
    }

    .action-button:focus[disabled],
    .action-button.reset:hover[disabled],
    .action-button:hover[disabled] {
        cursor: not-allowed;
        color: #ffffff4d;
        border: 1px solid var(--dark-border-color);
    }

    .action-button:focus,
    .action-button:hover {
        color: #00ff00;
        border: 1px solid #00ff00;
        outline: none;
    }

    .action-button.reset:hover {
        color: #ff0000;
        border: 1px solid #ff0000;
    }

    @media (prefers-color-scheme: light) {
        .action-button:hover {
            color: #00c800;
            border: 1px solid #00c800;
        }

        .action-button:focus[disabled],
        .action-button.reset:hover[disabled],
        .action-button:hover[disabled] {
            color: #1010104C;
            border: 1px solid var(--light-border-color);
        }
    }

    [slot="body"] {
        pointer-events: auto;
    }

    .button-wrapper {
        display: flex;
        gap: 1rem;
    }
</style>