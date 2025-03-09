<script lang="ts">
    import PremiseInput from "./lib/solver/components/PremiseInput.svelte";
    import MainLayout from "./lib/layouts/MainLayout.svelte";
    import Panel from "./lib/Panel.svelte";
    import SolverLayout from "./lib/layouts/SolverLayout.svelte";
    import PremiseInputRow from "./lib/solver/components/PremiseInputRow.svelte";
    import TheoremsLayout from "./lib/layouts/TheoremsLayout.svelte";
    import TheoremSlot from "./lib/rules/components/TheoremSlot.svelte";
    import {addTheorem, theorems} from "./stores/theoremsStore";
    import {
        addPremise,
        deductionRules,
        highlightedRows,
        indirectSolving,
        selectedRows,
        solverContent,
        theoremData
    } from "./stores/solverStore";
    import {PremiseParser} from "./lib/solver/parsers/PremiseParser";
    import RuleGridLayout from "./lib/layouts/RuleGridLayout.svelte";
    import RuleSlot from "./lib/rules/components/RuleSlot.svelte";
    import {DeductionRule, NDRule} from "./lib/rules/DeductionRule";
    import Separator from "./lib/Separator.svelte";
    import {EditState} from "./types/EditState";
    import {editState, solving} from "./stores/stateStore";
    import Modal from "./lib/Modal.svelte";
    import type {ButtonContent} from "./types/ButtonContent";
    import {get} from "svelte/store";
    import SolverTable from "./lib/solver/components/solver-table/SolverTable.svelte";
    import {onMount} from "svelte";
    import {
        checkProof,
        onChangeConclusion,
        onChangePremise, onChangeTheorem,
        proveProlog,
        resetSolving,
        setupProof,
        substitute,
        switchMode,
        usable
    } from "./lib/solver/solverLogic";
    import MathMLViewer from "./lib/solver/components/MathMLViewer.svelte";
    import {PrettySyntaxer} from "./lib/solver/PrettySyntaxer";
    import {lastHovered} from "./stores/modalStore";
    import type {TheoremVariant} from "./types/TheoremVariant";
    import {TheoremParser} from "./lib/solver/parsers/TheoremParser";
    import {Node} from "./lib/syntax-checker/Node";
    // import prologCode from "./prolog/ruleset.pl?raw";

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
            await proveProlog(premises, rule, selected);
            selectedRows.update(() => []);
            return;
        }

        if (rule.short === NDRule.IDIS) {
            showModalWithInput(
                "Insert formula",
                "Write the formula to insert into the disjunction",
                "Enter the formula",
                () => {
                    modalInput.value = PrettySyntaxer.clean(modalInput.value);
                    const formula = PremiseParser.parsePremise(modalInput.value);
                    console.log(formula);
                    if (!formula.tree) {
                        alert("Invalid formula");
                        return;
                    }

                    premises.push(formula.tree.toPrologFormat());
                    proveProlog(premises, rule, selected);
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
                // queryProlog(rule, premises, selected);
                proveProlog(premises, rule, selected);
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
        selectedRows.update(() => []);
    }

    let showPickVariant: boolean = false;
    let theoremVariants: TheoremVariant[] = [];
    let theoremVariantButtons: ButtonContent[] = [];
    let showConclusionSelect: boolean = false;
    function startSolver() {
        // if the conclusion is invalid, return
        if (!$solverContent.conclusion.tree) {
            return $editState === EditState.SOLVER
                ? alert("Invalid conclusion")
                : alert("Invalid theorem");
        }

        const setup = (isIndirect: boolean) => {
            indirectSolving.set(isIndirect);
            showConclusionSelect = false;
            // solving.set(res);

            if ($editState === EditState.THEOREM) {
                solverContent.update(sc => {
                    if (!sc.whole.tree)
                        sc.whole = sc.conclusion;
                    return sc;
                });
                theoremVariants = TheoremParser.getVariants(get(solverContent).whole);
                theoremVariantButtons = theoremVariants.map((variant, i) => ({
                    text: variant.premises.map(p => Node.generateString(p)).join(", "),
                    action: () => pickVariant(variant),
                }));
                showPickVariant = true;
            } else {
                const res = setupProof();
                solving.set(res);
            }
        }

        const pickVariant = (variant: TheoremVariant) => {
            console.log(`pick variant ${variant}`);
            solverContent.update(sc => {
                sc.premises = variant.premises.map(p => ({ value: Node.generateString(p), tree: p }));
                sc.conclusion = { value: Node.generateString(variant.conclusion), tree: variant.conclusion };
                return sc;
            });
            const res = setupProof();
            showPickVariant = false;
            solving.set(true);
        }

        setModalButton(0, "Direct Proof", () => setup(false));
        setModalButton(1, "Indirect Proof", () => setup(true));

        showConclusionSelect = true;
    }

    let showFillVariables: boolean = false;
    function fillVariables() {
        // console.log($theoremData.vars);
        setModalButton(0, "Confirm", () => {
            // get the lines selected
            const formulas = get(theoremData).varInputs.map(v => {
                const formula = PremiseParser.parsePremise(PrettySyntaxer.clean(v));
                if (!formula.tree) {
                    alert("Invalid formula");
                    return "";
                }

                return formula.tree.toPrologFormat();
            });
            theoremData.update(td => {
                td.varInputs = [];
                return td;
            });

            // console.log(formulas);

            // replace the variables with the values
            substitute(get(theoremData), formulas);

            showFillVariables = false;
        });
        setModalButton(1, "Cancel", () => {
            showFillVariables = false;
        });
        showFillVariables = true;
    }

    onMount(() => {
        // call onChangePremise/Conclusion to parse the initial values
        $solverContent.premises.forEach((premise, i) => {
            onChangePremise(premise.value, i);
        });

        onChangeConclusion($solverContent.conclusion.value);
    });
    //
    // async function test() {
    //     // await PrologController.loadString(prologCode, 'ruleset');
    //     const results = (await PrologController.query("prove_handler([and(imp('A', and('B', 'C')), or('B', eq('C', 'D')))], X, 'EC').")).all();
    //
    //     console.log(results);
    //     if (results.length === 0) return;
    //
    //     results.forEach(r => {
    //         console.log(PrologController.parsePrologCompound(r.X));
    //     });
    // }
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

  <Modal bind:show={showPickVariant} bind:buttons={theoremVariantButtons} header="Select the theorem variant" >

  </Modal>
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
  <Modal bind:show={showFillVariables} bind:buttons={modalButtons} header="Fill Variables">
      <div slot="body" style="display: flex; flex-direction: column; gap: 0.5rem;">
          <MathMLViewer value={$theorems[$theoremData.theoremId]?.whole.value} />
          {#each $theoremData.vars as v, i}
              <input type="text" placeholder={`${v}`} bind:value={$theoremData.varInputs[i]} />
          {/each}
      </div>
  </Modal>
  <MainLayout>
    <Panel>
        <SolverLayout>
            {#if !$solving && $editState === EditState.SOLVER}
                {#each Array.from($solverContent.premises) as _, i}
                    <PremiseInputRow index="{i}" removable={$editState === EditState.SOLVER && i !== 0}>
                        <PremiseInput
                            placeholder={`Premise ${i + 1}`}
                            bind:value="{$solverContent.premises[i].value}"
                            error="{!$solverContent.premises[i].tree}"
                            index={i}
                            onChange={() => onChangePremise($solverContent.premises[i].value, i)}
                        />
                    </PremiseInputRow>
                {/each}

                <button
                    class="action-button"
                    on:click={() => addPremise()}
                    tabindex={$solverContent.premises.length}
                >
                    Add Premise
                </button>
            {/if}
            {#if !$solving}
                {#if $editState === EditState.SOLVER}
                    <PremiseInput
                        placeholder={"Conclusion"}
                        bind:value="{$solverContent.conclusion.value}"
                        error="{!$solverContent.conclusion.tree}"
                        index={$solverContent.premises.length + 1}
                        onChange={() => onChangeConclusion($solverContent.conclusion.value)}
                    />
                {:else}
                    <PremiseInput
                        placeholder={"Theorem"}
                        bind:value="{$solverContent.whole.value}"
                        error="{!$solverContent.whole.tree}"
                        index={$solverContent.premises.length + 1}
                        onChange={() => onChangeTheorem($solverContent.whole.value)}
                    />
                {/if}
            {:else}
                <div style="display: flex; align-items: center; gap: 1rem;">
                    Find a proof for the following {$editState === EditState.SOLVER ? 'conclusion' : 'theorem'}:

                    {#if $editState === EditState.SOLVER}
                        <MathMLViewer value={$solverContent.conclusion.value} />
                    {:else}
                        <MathMLViewer value={$solverContent.whole.value} />
                    {/if}
                </div>
            {/if}

            <div class="button-wrapper">
                {#if $solving}
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
                    disabled={!$solving}
                    tabindex={$solverContent.premises.length + 3}
                >
                    Reset
                </button>
            </div>

            {#if $solving}
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
                              if (!$solving) return;
                              if (get(selectedRows).length >= rule.inputSize) return;
                              if (get(selectedRows).length === 0) return;

                              if ($lastHovered.rule === rule.title && $lastHovered.selected === get(selectedRows)) {
                                  highlightedRows.set($lastHovered.rows);
                                  return;
                              }

                              const rows = await usable(rule, get(selectedRows)[0]);
                              highlightedRows.set(rows.highlighted);
                              lastHovered.set({ rule: rule.title, selected: get(selectedRows) , rows: rows.highlighted });
                          }}
                          onMouseOut={() => {
                              if (!$solving) return;
                              highlightedRows.set([]);
                          }}
                />
            {/each}
        </RuleGridLayout>

        <Separator />

        <h2>Theorems</h2>
        <button class="action-button" on:click={addTheorem}>Add Theorem</button>
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