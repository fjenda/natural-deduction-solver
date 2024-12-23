<script lang="ts">
    import {onDestroy, onMount} from 'svelte';
    import {FormulaParser} from "../parsers/FormulaParser";
    import Hint from "svelte-hint";
    import {parsedProof, selectedRow} from "../../../stores/solverStore";

    export let formulas: string | null = "";
    export let highlight_rows: number[] = [];

    // let formulas: string = "";
    let textarea: HTMLTextAreaElement;
    let lineNumbersEle: HTMLDivElement;
    let lineRulesEle: HTMLDivElement;
    let lineNumbers: string[] = [];
    let lineRules: string[] = [];
    let focused: boolean = false;
    let lastRows: string[] = [];

    // returns the total number of lines a given string takes up in the text area
    const calculateNumLines = (str: string): number => {
        const width = textarea.clientWidth - 2 * parseFloat(getComputedStyle(textarea).padding);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) return 0;

        context.font = getComputedStyle(textarea).font;
        const textWidth = context?.measureText(str).width;
        return Math.ceil(textWidth / width);
    }

    // returns an array of line numbers
    const calculateLineNumbers = (): string[] => {
        const lines = textarea.value.split('\n');
        let lineNumbers: string[] = [];
        let i = 1;

        for (const line of lines) {
            const numLines = calculateNumLines(line);
            lineNumbers.push(String(i));

            for (let j = 1; j < numLines; j++) {
                lineNumbers.push('');
            }

            i++;
        }

        return lineNumbers;
    }

    // const getLineRules = (lineIndex?: number): string[] => {
    //     const lines = textarea.value.split('\n');
    //     let lineRules: string[] = [];
    //     let i = 1;
    //
    //     for (const line of lines) {
    //         const numLines = calculateNumLines(line);
    //         lineRules.push(FormulaParser.parseFormula(line).rule);
    //
    //         for (let j = 1; j < numLines; j++) {
    //             lineRules.push('');
    //         }
    //
    //         i++;
    //     }
    //
    //     return lineRules;
    // }

    // displays the line numbers
    const syncLineNumbers = () => {
        const lines = textarea.value.split('\n');
        lineNumbers = calculateLineNumbers();
        const newLineRules = [...lineRules];

        if (lines.length < lastRows.length) {
            // remove the last rows
            newLineRules.splice(lines.length, lastRows.length - lines.length);
        }

        for (let i = 0; i < lines.length; i++) {
            if (lines[i] !== lastRows[i]) {
                $parsedProof[i] = FormulaParser.parseFormula(lines[i]);
                // console.log('parsing formula on row', i, 'with value', lines[i]);
                newLineRules[i] = $parsedProof[i].rule;
            }
        }

        lineRules = newLineRules;
        lastRows = [...lines];
    }

    const handleCursorChange = () => {
        const cursorPosition = textarea.selectionStart;
        $selectedRow = textarea.value.slice(0, cursorPosition).split('\n').length;
    }

    onMount(() => {
        const handleScroll = () => {
            lineNumbersEle.scrollTop = textarea.scrollTop;
            lineRulesEle.scrollTop = textarea.scrollTop;
        };

        const handleFocus = () => {
            focused = true;
        };

        const handleBlur = () => {
            focused = false;
            $selectedRow = -1;
        };

        // const handlePaste = (event: ClipboardEvent) => {
        //     event.preventDefault();
        // }

        textarea.addEventListener('input', syncLineNumbers);
        textarea.addEventListener('scroll', handleScroll);
        textarea.addEventListener('focus', handleFocus);
        textarea.addEventListener('blur', handleBlur);
        textarea.addEventListener('click', handleCursorChange);
        textarea.addEventListener('keyup', handleCursorChange);
        // textarea.addEventListener('paste', handlePaste)

        const resizeObserver = new ResizeObserver(() => {
            const rect = textarea.getBoundingClientRect();
            lineNumbersEle.style.height = `${rect.height}px`;
            lineRulesEle.style.height = `${rect.height}px`;
            syncLineNumbers();
        });

        resizeObserver.observe(textarea);

        onDestroy(() => {
            textarea.removeEventListener('input', syncLineNumbers);
            textarea.removeEventListener('scroll', handleScroll);
            textarea.removeEventListener('focus', handleFocus);
            textarea.removeEventListener('blur', handleBlur);
            // textarea.removeEventListener('paste', handlePaste);
            resizeObserver.disconnect();
        });

        syncLineNumbers(); // initial sync
    });

    function applyHighlight(formulas: string | null, rows: number[]) {
        // console.log(formulas?.split('\n'));
        return formulas?.split('\n').map((formula, i) => {
            if (rows.includes(i + 1)) {
                return `<mark>${formula}</mark>`;
            } else {
                return formula;
            }
        }).join('\n');
    }

</script>

<!-- Input where the individual formulas will be written -->
<div id="container" class="container" class:focused={focused}>
    <div id="line-numbers"
         class="formulas-line-numbers"
         bind:this={lineNumbersEle}
    >
        {#each lineNumbers as number}
            <div>{number ? `${number}.` : '\u00A0'}</div>
        {/each}
    </div>
    <div class="hint-wrapper">
        <Hint text="TODO!" placement="left">
            <i class="fa fa-info-circle"></i>
        </Hint>
    </div>

    <div class="text-area-wrapper">
        <div class="backdrop">
            <div class="highlight">
                {@html applyHighlight(formulas, highlight_rows)}
            </div>
        </div>
        <textarea
                id="textarea"
                class="formulas-textarea"
                bind:this={textarea}
                bind:value={formulas}
                on:input={syncLineNumbers}
        >
    </textarea>
    </div>


    <div id="used-rules"
         class="formulas-line-rules"
         bind:this={lineRulesEle}
    >
        {#each lineRules as rule}
            <div>{rule ? `${rule}` : '\u00A0'}</div>
        {/each}
    </div>
</div>

<style>
    .container {
        display: flex;
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;

        flex-grow: 1;
        width: 100%;
        max-height: 100%;
        height: 25rem;
        position: relative;
        overflow: hidden;

        /* Edit styles here */
        --border-color: #424242;
        --font-family: monospace;
        --font-size: 1.5em;
        --font-weight: normal;
        --letter-spacing: normal;
        --line-height: normal;
        --padding: 0.5em;
    }

    .container.focused {
        --border-color: #f4f9ff;
    }

    .hint-wrapper {
        position: absolute;
        top: 0;
        right: 6.5rem;
        z-index: 5;
        transform: translate(-50%, 50%);
    }

    .formulas-textarea {
        border: none;
        resize: none;
        border-radius: 0;
        overflow-y: auto;
        flex-grow: 1;
        min-height: 0;
        position: relative;
        z-index: 2;

        /* Synchronize styles */
        font-family: var(--font-family);
        font-size: var(--font-size);
        font-weight: var(--font-weight);
        letter-spacing: var(--letter-spacing);
        line-height: var(--line-height);
        padding: var(--padding);
    }

    .formulas-line-numbers {
        width: 3.5rem;
        align-items: flex-end;
    }

    .formulas-line-rules {
        width: 7rem;
        /*align-items: flex-start;*/
    }

    .formulas-line-rules,
    .formulas-line-numbers {
        overflow: hidden;

        white-space: pre-wrap;
        text-overflow: ellipsis;

        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        max-height: 100%;
        background: var(--dark-element-color);

        /* Synchronize styles */
        font-family: var(--font-family);
        font-size: var(--font-size);
        font-weight: var(--font-weight);
        letter-spacing: var(--letter-spacing);
        line-height: var(--line-height);
        padding: var(--padding);
    }

    .formulas-line-rules {
        border-left: 1px solid var(--border-color);
    }

    .formulas-line-numbers {
        border-right: 1px solid var(--border-color);
    }

    @media (prefers-color-scheme: light) {
        .container {
            --border-color: #d1d1d1;
        }

        .container.focused {
            --border-color: #424242;
        }

        .formulas-line-rules,
        .formulas-line-numbers {
            background-color: var(--light-element-color);
        }
    }

    .highlight {
        white-space: pre-wrap;
        word-wrap: break-word;
        color: transparent;
        margin: 0 auto;
        pointer-events: none;
    }

    .backdrop {
        position: absolute;
        text-align: left;
        border: none;
        resize: none;
        border-radius: 0;
        overflow-y: auto;
        min-height: 0;
        z-index: 10;
        pointer-events: none;

        /* Synchronize styles */
        font-family: var(--font-family);
        font-size: var(--font-size);
        font-weight: var(--font-weight);
        letter-spacing: var(--letter-spacing);
        line-height: var(--line-height);
        padding: var(--padding);

    }

    .text-area-wrapper {
        width: 100%;
        position: relative;
    }

    :global(mark) {
        color: var(--dark-text-color);
        border-radius: 0.2rem;
        background-color: #00c800;
    }

    @media (prefers-color-scheme: light) {
        :global(mark) {
            background-color: #00ff00;
            color: var(--light-text-color);
        }
    }
</style>