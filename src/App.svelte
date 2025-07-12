<script lang="ts">
    import PremiseInput from "./lib/solver/components/PremiseInput.svelte";
    import MainLayout from "./lib/layouts/MainLayout.svelte";
    import Panel from "./lib/Panel.svelte";
    import SolverLayout from "./lib/layouts/SolverLayout.svelte";
    import PremiseInputRow from "./lib/solver/components/PremiseInputRow.svelte";
    import TheoremsLayout from "./lib/layouts/TheoremsLayout.svelte";
    import TheoremSlot from "./lib/rules/components/TheoremSlot.svelte";
    import { addTheorem, theorems } from "./stores/theoremsStore";
    import {
        addPremise,
        deductionRules,
        highlightedRows,
        indirectSolving,
        selectedRows,
        solverContent,
        theoremData
    } from "./stores/solverStore";
    import { PremiseParser } from "./lib/solver/parsers/PremiseParser";
    import RuleGridLayout from "./lib/layouts/RuleGridLayout.svelte";
    import RuleSlot from "./lib/rules/components/RuleSlot.svelte";
    import { DeductionRule, NDRule } from "./lib/rules/DeductionRule";
    import Separator from "./lib/Separator.svelte";
    import { EditState } from "./types/EditState";
    import { editState, solving } from "./stores/stateStore";
    import Modal from "./lib/Modal.svelte";
    import type { ButtonContent } from "./types/ButtonContent";
    import { get } from "svelte/store";
    import SolverTable from "./lib/solver/components/solver-table/SolverTable.svelte";
    import { onMount } from "svelte";
    import {
        checkProof,
        onChangeConclusion,
        onChangePremise,
        onChangeTheorem,
        proveProlog,
        resetSolving,
        setupProof,
        substitute,
        switchMode,
        usable
    } from "./lib/solver/solverLogic";
    import MathMLViewer from "./lib/solver/components/MathMLViewer.svelte";
    import { PrettySyntaxer } from "./lib/solver/PrettySyntaxer";
    import { lastHovered } from "./stores/lastHoveredStore";
    import type { TheoremVariant } from "./types/TheoremVariant";
    import { TheoremParser } from "./lib/solver/parsers/TheoremParser";
    import { Node } from "./lib/syntax-checker/Node";
    import { PrologController } from "./prolog/PrologController";
    import { FlatToast, ToastContainer } from "svelte-toasts";
    import { showToast } from "./lib/utils/showToast";
    import { modals, Modals } from "svelte-modals";
    import SelectProofTypeModal from "./lib/modals/SelectProofTypeModal.svelte";
    import PickTheoremVariantModal from "./lib/modals/PickTheoremVariantModal.svelte";
    import InputModal from "./lib/modals/InputModal.svelte";
    import FillVariablesModal from "./lib/modals/FillVariablesModal.svelte";

    // $solverContent.premises = ["L(a) ⊃ ¬S(a)", "L(a) ∧ P(a)"];
    // $solverContent.conclusion = "P(a) ∧ ¬S(a)";

    // $solverContent.premises = [
    //     { value: "A ∧ B", tree: null },
    //     { value: "B ⊃ C", tree: null }
    // ];
    // $solverContent.conclusion = { value: "C", tree: null };

    $solverContent.premises = [
        { value: "∀x [L(x) ⊃ ¬S(x)]", tree: null },
        { value: "∃x [L(x) ∧ P(x)]", tree: null }
    ];
    $solverContent.conclusion = { value: "∃x [¬S(x) ∧ P(x)]", tree: null };

    async function onRuleClick(rule: DeductionRule): Promise<void> {
        // get selected rows
        const proof = get(solverContent).proof;
        const selected = get(selectedRows);

        // make the user select at least one row
        if (selected.length === 0) {
            return showToast("Select at least one row", "warning");
        }

        // if the user selected more rows than needed for the rule
        if (selected.length > rule.inputSize) {
            return showToast("Too many rows selected", "warning");
        }

        // get the premises
        const premises: string[] = selected.map(index => proof[index - 1]?.tree?.toPrologFormat() ?? "");

        if (selected.length === rule.inputSize) {
            const params = [NDRule.EEX, NDRule.EALL].includes(rule.short) ? ["a"]
                         : [NDRule.IEX, NDRule.IALL].includes(rule.short) ? ["var(x)"] : [];

            // put "a" at the start of premises
            const pr: string[] = [NDRule.IEX, NDRule.IALL].includes(rule.short) ? ["a"] : [];
            premises.unshift(...pr);
            await proveProlog(premises, rule, selected, params);
            selectedRows.update(() => []);
            return;
        }

        if (rule.short === NDRule.IDIS) {
            await modals.open(InputModal, {
                title: "Insert Formula",
                body: "Write the formula to insert into the disjunction",
                placeholder: "Enter the formula",
                onConfirm: (modalInput: HTMLInputElement) => {
                    modalInput.value = PrettySyntaxer.clean(modalInput.value);
                    const formula = PremiseParser.parsePremise(modalInput.value);
                    console.log(formula);
                    if (!formula.tree) {
                        showToast("Invalid formula", "error");
                        return;
                    }

                    premises.push(formula.tree.toPrologFormat());
                    proveProlog(premises, rule, selected, []);
                }
            });
            return;
        }

        // if the user selected fewer rows than needed for the rule
        await modals.open(InputModal, {
            title: "Select row",
            body: "Select the second row with which to execute the rule",
            placeholder: "Enter the row number",
            onConfirm: (modalInput: HTMLInputElement) => {
                const other = parseInt(modalInput.value);
                if (isNaN(other) || other < 1 || other > proof.length) {
                    return showToast("Invalid row number", "error");
                }

                if (selected.includes(other)) {
                    return showToast("Row already selected", "warning");
                }

                selected.push(other);
                premises.push(proof[other - 1]?.tree?.toPrologFormat() ?? "");
                // queryProlog(rule, premises, selected);
                proveProlog(premises, rule, selected, []);
            }
        });
    }

    let theoremVariants: TheoremVariant[] = [];
    let theoremVariantButtons: ButtonContent[] = [];
    function startSolver() {
        // if the conclusion is invalid, return
        if ($editState === EditState.SOLVER && !$solverContent.conclusion.tree) {
            return showToast("Invalid conclusion", "error");
        }

        if ($editState === EditState.THEOREM && !$solverContent.whole.tree) {
            return showToast("Invalid theorem", "error");
        }

        const setup = (isIndirect: boolean) => {
            indirectSolving.set(isIndirect);

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

                modals.open(PickTheoremVariantModal, {
                    title: "Select the theorem variant",
                    theoremVariantButtons: theoremVariantButtons,
                });

            } else {
                const res = setupProof();
                solving.set(res);
            }
        }

        const pickVariant = (variant: TheoremVariant) => {
            solverContent.update(sc => {
                sc.premises = variant.premises.map(p => ({ value: Node.generateString(p), tree: p }));
                sc.conclusion = { value: Node.generateString(variant.conclusion), tree: variant.conclusion };
                return sc;
            });
            const res = setupProof();
            solving.set(res);
        }

        modals.open(SelectProofTypeModal, {
            title: "Select Proof Type",
            message: "Choose the type of proof you want to perform.",
            directProof: () => setup(false),
            indirectProof: () => setup(true),
        });
    }

    function fillVariables() {
        modals.open(FillVariablesModal, {
            title: "Fill Variables",
            onConfirm: () => {
                // get the lines selected
                const formulas = get(theoremData).varInputs.map(v => {
                    const formula = PremiseParser.parsePremise(PrettySyntaxer.clean(v));
                    if (!formula.tree) {
                        showToast("Invalid formula", "error");
                        return "";
                    }

                    return formula.tree.toPrologFormat();
                });
                theoremData.update(td => {
                    td.varInputs = [];
                    return td;
                });

                // replace the variables with the values
                substitute(get(theoremData), formulas);
            },
        });
    }

    onMount(() => {
        // call onChangePremise/Conclusion to parse the initial values
        $solverContent.premises.forEach((premise, i) => {
            onChangePremise(premise.value, i);
        });

        onChangeConclusion($solverContent.conclusion.value);

        // load the Prolog module
        PrologController.instance().then(() => {
            console.log("[DEBUG] Prolog module loaded.");
        });
    });
</script>

<main>
  <button on:click={switchMode} class="action-button">Switch Mode</button>

  <ToastContainer placement="top-right" let:data={data}>
      <FlatToast {data} />
  </ToastContainer>

  <Modals />

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
                <div class="assignment-container">
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

    <Panel variant="small">
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

    .assignment-container {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    @media screen and (max-width: 950px) {
        .assignment-container {
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
        }

        .action-button {
            font-size: 0.9rem;
            height: auto;
        }
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