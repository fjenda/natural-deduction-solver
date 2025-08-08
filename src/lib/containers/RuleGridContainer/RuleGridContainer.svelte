<script lang="ts">
    import { deductionRules, highlightedRows, selectedRows, solverContent } from "../../../stores/solverStore";
    import { solving } from "../../../stores/stateStore";
    import { lastHovered } from "../../../stores/lastHoveredStore";
    import RuleGridLayout from "../../layouts/RuleGridLayout.svelte";
    import RuleSlot from "../../rules/components/RuleSlot.svelte";
    import { get } from "svelte/store";
    import { DeductionRule, NDRule } from "../../rules/DeductionRule";
    import { showToast } from "../../utils/showToast";
    import { modals } from "svelte-modals";
    import ReplaceQuantifierVariableModal from "../../modals/ReplaceQuantifierVariableModal.svelte";
    import { NodeType } from "../../syntax-checker/NodeType";
    import InputModal from "../../modals/InputModal.svelte";
    import { PrettySyntaxer } from "../../solver/parsers/PrettySyntaxer";
    import { PremiseParser } from "../../solver/parsers/PremiseParser";
    import { proveProlog, usable } from "../../solver/services/proofService";

    async function onRuleClick(rule: DeductionRule): Promise<void> {
        // get selected rows
        const proof = get(solverContent).proof;
        const selected = get(selectedRows);

        // if the user selected more rows than needed for the rule
        if (selected.length > rule.inputSize) {
            return showToast("Too many rows selected", "warning");
        }

        // get the premises
        const premises: string[] = selected.map(index => proof[index - 1]?.tree?.toPrologFormat() ?? "");

        if (selected.length === rule.inputSize) {
            if ([NDRule.EEX, NDRule.EALL].includes(rule.short)) {
                const variable = proof[selected[0] - 1].tree?.children[1];
                await modals.open(ReplaceQuantifierVariableModal, {
                    title: "Replace Variable in Quantifier",
                    row: proof[selected[0] - 1],
                    placeholder: variable?.value,
                    onConfirm: (modalInput: HTMLInputElement) => {
                        const formula = validateFormulaInput(modalInput);
                        if (!formula) return;

                        if (formula.tree!.type !== NodeType.CONSTANT) {
                            return showToast("Invalid formula", "error");
                        }

                        proveProlog(premises, rule, selected, [variable!.toPrologFormat(), formula.tree!.toPrologFormat()]);
                    },
                });
            } else if ([NDRule.IEX, NDRule.IALL].includes(rule.short)) {
                const varsSet = proof[selected[0] - 1].tree?.variables;
                if (!varsSet || varsSet.size === 0) {
                    return showToast("No variables found in the formula", "error");
                }

                const vars = [...varsSet];
                modals.open(ReplaceQuantifierVariableModal, {
                    title: "Introduce Variable for Quantifier",
                    row: proof[selected[0] - 1],
                    placeholder: vars[0],
                    onConfirm: (modalInput: HTMLInputElement) => {
                        const formula = validateFormulaInput(modalInput);
                        if (!formula) return;

                        proveProlog(premises, rule, selected, [vars[0], formula.tree!.toPrologFormat()]);
                    },
                });
            } else {
                await proveProlog(premises, rule, selected, []);
            }

            selectedRows.update(() => []);
            return;
        }

        if (rule.short === NDRule.IDIS) {
            await modals.open(InputModal, {
                title: "Insert Formula",
                body: "Write the formula to insert into the disjunction",
                placeholder: "Enter the formula",
                onConfirm: (modalInput: HTMLInputElement) => {
                    const formula = validateFormulaInput(modalInput);
                    if (!formula) return;
                    premises.push(formula.tree!.toPrologFormat());
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

    function validateFormulaInput(modalInput: HTMLInputElement) {
        modalInput.value = PrettySyntaxer.clean(modalInput.value);
        const formula = PremiseParser.parsePremise(modalInput.value);
        // console.log(formula);
        if (!formula.tree) {
            showToast("Invalid formula", "error");
            return null;
        }

        return formula;
    }
</script>

<h2>Deduction Rules</h2>
<RuleGridLayout>
    {#each $deductionRules as rule}
        <RuleSlot
            rule={rule}
            onClick={() => onRuleClick(rule)}
            onMouseOver={async () => {
                if (!$solving) return;
                if ($selectedRows.length >= rule.inputSize) return;
                if ($selectedRows.length === 0) return;

                if ($lastHovered.rule === rule.title && $lastHovered.selected === $selectedRows) {
                    highlightedRows.set($lastHovered.rows);
                    return;
                }

                const rows = await usable(rule, get(selectedRows)[0]);
                highlightedRows.set(rows.highlighted);
                lastHovered.set({ rule: rule.title, selected: get(selectedRows) , rows: rows.highlighted });
            }}
            onMouseOut={() => {
                if (!get(solving)) return;
                highlightedRows.set([]);
            }}
        />
    {/each}
</RuleGridLayout>