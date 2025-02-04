<script lang="ts">
    import PremiseInput from "./lib/solver/components/PremiseInput.svelte";
    import MainLayout from "./lib/layouts/MainLayout.svelte";
    import Panel from "./lib/Panel.svelte";
    import SolverLayout from "./lib/layouts/SolverLayout.svelte";
    import PremiseInputRow from "./lib/solver/components/PremiseInputRow.svelte";
    import TheoremsLayout from "./lib/layouts/TheoremsLayout.svelte";
    import TheoremSlot from "./lib/rules/components/TheoremSlot.svelte";
    import {theorems} from "./stores/theoremsStore";
    import {addPremise, highlightedRows, selectedRows, solverContent} from "./stores/solverStore";
    import {Solution} from "./lib/solver/Solution";
    import {PremiseParser} from "./lib/solver/parsers/PremiseParser";
    import RuleGridLayout from "./lib/layouts/RuleGridLayout.svelte";
    import RuleSlot from "./lib/rules/components/RuleSlot.svelte";
    import {DeductionRule, NDRule} from "./lib/solver/parsers/DeductionRules";
    import Separator from "./lib/Separator.svelte";
    import {EditState} from "./types/EditState";
    import {editState} from "./stores/stateStore";
    import Modal from "./lib/Modal.svelte";
    import type {ButtonContent} from "./types/ButtonContent";
    import {DeductionProcessor} from "./lib/solver/parsers/DeductionProcessor";
    import {get} from "svelte/store";
    import SolverTable from "./lib/solver/components/solver-table/SolverTable.svelte";
    import {FormulaComparer} from "./lib/solver/FormulaComparer";
    import type {TreeRuleType} from "./types/TreeRuleType";
    import {Node} from "./lib/syntax-checker/Node";
    import {onMount} from "svelte";

    // $solverContent.premises = ["∀x [L(x) ⊃ ¬S(x)]", "∃y [L(y) ∧ P(y)]"];
    // $solverContent.conclusion = "∃z [¬S(z) ∧ P(z)]";
    // $solverContent.proof = "∀x [L(x) ⊃ ¬S(x)]\n∃y [L(y) ∧ P(y)]";

    // $solverContent.premises = ["L(a) ⊃ ¬S(a)", "L(a) ∧ P(a)"];
    // $solverContent.conclusion = "P(a) ∧ ¬S(a)";

    $solverContent.premises = [
        { value: "a", tree: null },
        { value: "¬a", tree: null }
    ];
    $solverContent.conclusion = { value: "b", tree: null };

    // $solverContent.premises = ["∀x [(P(x,a) ∧ P(x,b)) ⊃ Q(x,b)]", "∃x [¬Q(x,b) ∧ P(x,b)]"];
    // $solverContent.premises = ["P(x,a)", "Q(x,b)"];
    // $solverContent.conclusion = "∃x [P(x,a) ⊃ Q(x,b)]";

    function onChangePremise(value: string, index: number) {
        $solverContent.premises[index] = PremiseParser.parsePremise(value);
    }

    function onChangeConclusion(value: string, index: number) {
        $solverContent.conclusion = PremiseParser.parsePremise(value);
    }

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

    // TODO: decide if we want to keep the alerts, could be slowing the user down.
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
            setModalButton(0, "Confirm", () => {
                // parse the input formula
                const formula = PremiseParser.parsePremise(modalInput.value);
                if (!formula.tree) {
                    alert("Invalid formula");
                    return;
                }

                const tmp: TreeRuleType = {
                    line: -1,
                    tree: formula.tree,
                    value: formula.value,
                    rule: { rule: NDRule.UNKNOWN },
                };

                applyRule(rule.short, proof[selected[0] - 1], tmp);
                modalInput.value = "";
                showModal = false;
            });

            setModalButton(1, "Cancel", () => {
                modalInput.value = "";
                showModal = false;
            });

            modalHeader = "Insert formula";
            modalContent = "Write the formula to insert into the disjunction";
            modalInput.placeholder = "Enter the formula";
            showModal = true;
            setTimeout(() => modalInput.focus(), 50);
        } else {
            setModalButton(0, "Confirm", () => {
                // get the value from the input
                const other = parseInt(modalInput.value);

                // check if the value is a number and if it is a valid row number
                if (isNaN(other) || other < 1 || other > proof.length) {
                    alert("Invalid row number");
                    return;
                }

                // check if the user selected the same row
                if (selected.includes(other)) {
                    alert("Cannot select the same row");
                    return;
                }

                const highlightedProof = highlighted.length > 0 ? proof[other - 1] : null;
                if (highlightedProof && highlighted.includes(other)) {
                    applyRule(rule.short, proof[selected[0] - 1], highlightedProof);
                }

                modalInput.value = "";
                showModal = false;
                selectedRows.set([]);
            });

            setModalButton(1, "Cancel", () => {
                modalInput.value = "";
                showModal = false;
            });

            modalHeader = "Select row";
            modalContent = "Select the second row with which to execute the rule";
            showModal = true;
            setTimeout(() => modalInput.focus(), 50);
        }
    }

    function applyRule(short: NDRule, row1: TreeRuleType, row2: TreeRuleType) {
        const result = DeductionProcessor.applyRule(short, row1, row2);
        if (!result) return;

        solverContent.update(sc => {
            if (Array.isArray(result)) {
                for (const res of result) {
                    sc.proof[res.line - 1] = res;
                }
            } else {
                sc.proof[result.line - 1] = result;
            }

            return sc;
        });

        selectedRows.set([]);
    }

    // Adds all existing premises to the proof and checks if they are valid
    function initializeProof() {
        // add the premises to the proof
        solverContent.update(sc => {
            sc.proof = sc.premises.map(((p, i) => ({ line: i + 1, tree: p.tree, value: p.value, rule: { rule: NDRule.ASS } })));
            return sc;
        })

        // check if premises in proof are all valid
        for (let i = 0; i < $solverContent.premises.length; i++) {
            if (!$solverContent.proof[i].tree) {
                alert(`Premise ${i + 1} is not valid`);
                return;
            }
        }
    }

    let solving: boolean = false;
    let showConclusionSelect: boolean = false;
    function startSolver() {
        // if the conclusion is invalid, return
        if (!$solverContent.conclusion.tree) {
            alert("Conclusion is not valid");
            return;
        }

        setModalButton(0, "Direct Proof", () => {
            // init proof with premises
            initializeProof();

            // nothing else to do

            // start the solver
            showConclusionSelect = false;
            solving = true;
        });

        setModalButton(1, "Indirect Proof", () => {
            // init proof with premises
            initializeProof()

            // add the negated conclusion to the proof
            const neg: Node = $solverContent.conclusion.tree.negate();
            solverContent.update(sc => {
                sc.proof.push({
                    line: sc.proof.length + 1,
                    tree: neg,
                    value: Node.generateString(neg),
                    rule: {rule: NDRule.CONC},
                });

                return sc;
            });

            // start the solver
            showConclusionSelect = false
            solving = true;
        });

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

    function checkProof() {
        // check if proof contains a valid row with the conclusion
        const proof = get(solverContent).proof;
        const exists = proof.filter(p => p.tree && p.rule.rule !== NDRule.UNKNOWN).findIndex(p => FormulaComparer.compare(p, $solverContent.conclusion)) !== -1;

        if (!exists) {
            alert("Proof does not contain a valid row with the conclusion");
            return;
        }

        alert("Proof is correct");
    }

    onMount(() => {
        // call onChangePremise/Conclusion to parse the initial values
        $solverContent.premises.forEach((premise, i) => {
            onChangePremise(premise.value, i);
        });

        onChangeConclusion($solverContent.conclusion.value, $solverContent.premises.length + 1);
    })
</script>

<main>
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
                    <PremiseInputRow index="{i}">
                        <PremiseInput
                            placeholder="Premise {i + 1}"
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
                <PremiseInput
                    placeholder="Conclusion"
                    bind:value="{$solverContent.conclusion.value}"
                    error="{!$solverContent.conclusion.tree}"
                    index={$solverContent.premises.length + 1}
                    onChange={() => onChangeConclusion($solverContent.conclusion.value, $solverContent.premises.length + 1)}
                    disabled={solving}
                />
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
            {#each DeductionRule.rules as rule}
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