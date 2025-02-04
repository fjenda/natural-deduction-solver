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
    import {Node} from "./lib/syntax-checker/Node";
    import {FormulaComparer} from "./lib/solver/FormulaComparer";
    import type {TreeRuleType} from "./types/TreeRuleType";

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

    let lastPremises: string[] = [];
    // $: if ($solverContent.premises) {
    //     // add premises to the proof
    //     $solverContent.premises.forEach((premise, i) => {
    //         onChangePremise(premise.value, i);
    //     });
    //
    //     // remove the rest
    //     const from = $solverContent.premises.length;
    //     const amount = lastPremises.length - from;
    //     lastPremises.splice(from - 1, amount);
    //     $solverContent.proof.splice(from - 1, amount);
    // }

    function onChangePremise(value: string, index: number) {
        // if unchanged, return
        if (lastPremises[index] === value) return;

        // parse the premise into ParsedExpression
        const res = PremiseParser.parsePremise(value);
        $solverContent.premises[index] = res;

        // optimize parentheses
        const tree = res.tree?.simplify().parenthesize();
        if (!tree) return;

        // update proof
        $solverContent.proof[index] = {
            line: index + 1,
            tree: tree,
            value: Node.generateString(tree),
            rule: {rule: NDRule.ASS},
        };

        // update lastPremises
        lastPremises[index] = value;

        // remove old premises
        removeOldPremises();
    }

    // TODO: We will need to add the conclusion to the proof as well if we're using indirect proof
    function onChangeConclusion(value: string, index: number) {
        $solverContent.conclusion = PremiseParser.parsePremise(value);
    }

    function removeOldPremises() {
        const from = $solverContent.premises.length;
        const amount = lastPremises.length - from;
        lastPremises.splice(from - 1, amount);
        // $solverContent.proof.splice(from - 1, amount);

        console.log(lastPremises);
        console.log($solverContent.proof);
    }

    function addTheorem() {
        theorems.update((theorems) => [...theorems, new Solution("Unnamed Theorem")]);
    }

    let modalInput: HTMLInputElement;
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

        // if the number of selected rows is not equal to the number of rows needed for the rule
        // display modal and make the user select the row there
        if (rule.short === NDRule.IDIS && selected.length < rule.inputSize) {
            setConfirmButtonAction(() => {
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

                const result = DeductionProcessor.applyRule(rule.short, proof[selected[0] - 1], tmp);
                if (!result) return;

                solverContent.update(sc => {
                    if (Array.isArray(result)) {
                        // sc.proof[result[0].line - 1] = result[0];
                        for (const res of result) {
                            sc.proof[res.line - 1] = res;
                        }
                    } else {
                        sc.proof[result.line - 1] = result;
                    }

                    return sc;
                });

                modalInput.value = "";
                showModal = false;
                selectedRows.set([]);
            });

            modalContent = "Write the formula to insert into the disjunction";
            modalInput.placeholder = "Enter the formula";
            showModal = true;
            setTimeout(() => modalInput.focus(), 50);
        } else if (selected.length < rule.inputSize) {
            setConfirmButtonAction(() => {
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
                if (highlighted.includes(other)) {
                    const result = DeductionProcessor.applyRule(rule.short, proof[selected[0] - 1], highlightedProof);
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
                }

                modalInput.value = "";
                showModal = false;
                selectedRows.set([]);
            });

            modalContent = "Select the second row with which to execute the rule";
            showModal = true;
            setTimeout(() => modalInput.focus(), 50);
        } else {
            // if the number of selected rows is equal to the number of rows needed for the rule
            const result = DeductionProcessor.applyRule(rule.short, proof[selected[0] - 1], proof[selected[1] - 1]);
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
            // console.log($solverContent.proof);
        }
    }

    let solving: boolean = false;
    function startSolver() {
        // check if premises in proof are all valid
        for (let i = 0; i < $solverContent.premises.length; i++) {
            if (!$solverContent.proof[i].tree) {
                alert(`Premise ${i + 1} is not valid`);
                return;
            }
        }

        // start the solver
        solving = true;
    }

    function resetSolving() {
        solving = false;
        lastPremises = [];
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
</script>

<main>
  <Modal bind:show={showModal} bind:content={modalContent} bind:buttons={modalButtons}>
      <div slot="body">
          <input
              type="text"
              placeholder="Enter the row number"
              name="modal-input"
              bind:this={modalInput}
          />
      </div>
  </Modal>
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
                        class="add-button"
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
                            class="add-button"
                            on:click={checkProof}
                            tabindex={$solverContent.premises.length + 2}
                    >
                        Check Proof
                    </button>
                {:else}
                    <button
                        class="add-button"
                        on:click={startSolver}
                        tabindex={$solverContent.premises.length + 2}
                    >
                        Create Problem
                    </button>
                {/if}
                <button
                    class="add-button reset"
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

    .add-button:focus[disabled],
    .add-button.reset:hover[disabled],
    .add-button:hover[disabled] {
        cursor: not-allowed;
        color: #ffffff4d;
        border: 1px solid var(--dark-border-color);
    }

    .add-button:focus,
    .add-button:hover {
        color: #00ff00;
        border: 1px solid #00ff00;
        outline: none;
    }

    .add-button.reset:hover {
        color: #ff0000;
        border: 1px solid #ff0000;
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

    .button-wrapper {
        display: flex;
        gap: 1rem;
    }
</style>