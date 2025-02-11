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
    import { get } from "svelte/store";
    import SolverTable from "./lib/solver/components/solver-table/SolverTable.svelte";
    import { onMount } from "svelte";
    import {
        checkProof,
        onChangeConclusion,
        onChangePremise,
        setupProof,
        queryProlog, switchMode, resetSolving, handlePost, usable
    } from "./lib/solver/solverLogic";
    import MathMLViewer from "./lib/solver/components/MathMLViewer.svelte";

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

    async function onRuleClick(rule: DeductionRule): Promise<void> {
        // get selected rows
        const proof = get(solverContent).proof;
        const selected = get(selectedRows);

        // make the user select at least one row
        if (selected.length === 0) {
            return alert("Select at least one row");
        }

        // if the user selected more rows than needed for the rule
        if (selected.length > rule.inputSize) {
            return alert("Too many rows selected");
        }

        // get the premises
        const premises: string[] = selected.map(index => proof[index - 1]?.tree?.toPrologFormat() ?? "");

        if (selected.length === rule.inputSize) {
            return await queryProlog(rule, premises, selected);
        }

        if (rule.short === NDRule.IDIS) {
            showModalWithInput(
                "Insert formula",
                "Write the formula to insert into the disjunction",
                "Enter the formula",
                () => {
                    const formula = PremiseParser.parsePremise(modalInput.value);
                    if (!formula.tree) {
                        alert("Invalid formula");
                        return;
                    }

                    premises.push(formula.tree.toPrologFormat());
                    queryProlog(rule, premises, selected);
                    closeModal();
                }
            );
            return;
        }

        // if the user selected fewer rows than needed for the rule
        showModalWithInput(
            "Select row",
            "Select the second row with which to execute the rule",
            "Enter row number",
            () => {
                const other = parseInt(modalInput.value);
                if (isNaN(other) || other < 1 || other > proof.length) {
                    return alert("Invalid row number");
                }

                if (selected.includes(other)) {
                    return alert("Cannot select the same row");
                }

                selected.push(other);
                premises.push(proof[other - 1]?.tree?.toPrologFormat() ?? "");
                queryProlog(rule, premises, selected);
                closeModal();
            }
        );
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
            return alert("Conclusion is not valid");
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

    onMount(() => {
        // call onChangePremise/Conclusion to parse the initial values
        $solverContent.premises.forEach((premise, i) => {
            onChangePremise(premise.value, i);
        });

        onChangeConclusion($solverContent.conclusion.value);
    });

    // let result;
    // let premises: string = "";
    // let conclusion: string = "";
    // let rule: string = "";
    //
    // async function test() {
    //     const res = await handlePost('/prove', premises.split('\n'), conclusion, rule);
    //     console.log(res);
    // }

</script>

<main>
<!--    <textarea bind:value={premises}></textarea>-->
<!--    <input bind:value={conclusion} />-->
<!--    <input bind:value={rule} />-->
<!--    <button on:click={test}>Test</button>-->
<!--    <pre>{result}</pre>-->

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
                    on:click={() => solving = resetSolving()}
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
                          onClick={() => { onRuleClick(rule) }}
                          onMouseOver={async () => {
                              if (!solving) return;
                              if (get(selectedRows).length >= rule.inputSize) return;
                              if (get(selectedRows).length === 0) return;
                              // const rows = DeductionProcessor.getUsableRows(rule.short);
                              const rows = await usable(rule, get(selectedRows)[0]);
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