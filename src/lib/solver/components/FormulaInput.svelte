<script lang="ts">
    import {onDestroy, onMount} from 'svelte';
    import {FormulaParser} from "../parsers/FormulaParser";
    import Hint from "svelte-hint";

    let formulas: string = "";
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

    const getLineRules = (lineIndex?: number): string[] => {
        const lines = textarea.value.split('\n');
        let lineRules: string[] = [];
        let i = 1;

        for (const line of lines) {
            const numLines = calculateNumLines(line);
            lineRules.push(FormulaParser.parseFormula(line));

            for (let j = 1; j < numLines; j++) {
                lineRules.push('');
            }

            i++;
        }

        return lineRules;
    }

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
                // console.log('parsing formula on row', i, 'with value', lines[i]);
                newLineRules[i] = FormulaParser.parseFormula(lines[i]);
            }
        }

        lineRules = newLineRules;
        lastRows = [...lines];
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
        };

        // const handlePaste = (event: ClipboardEvent) => {
        //     event.preventDefault();
        // }

        textarea.addEventListener('input', syncLineNumbers);
        textarea.addEventListener('scroll', handleScroll);
        textarea.addEventListener('focus', handleFocus);
        textarea.addEventListener('blur', handleBlur);
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
    <textarea
            id="textarea"
            class="formulas-textarea"
            bind:this={textarea}
            bind:value={formulas}
            on:input={syncLineNumbers}>
    </textarea>
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
        right: 0;
        transform: translate(-50%, 25%);
    }

    .formulas-textarea {
        border: none;
        resize: none;
        border-radius: 0;
        overflow-y: auto;
        flex-grow: 1;
        min-height: 0;

        /* Synchronize styles */
        font-family: var(--font-family);
        font-size: var(--font-size);
        font-weight: var(--font-weight);
        letter-spacing: var(--letter-spacing);
        line-height: var(--line-height);
        padding: var(--padding);
    }

    .formulas-line-rules,
    .formulas-line-numbers {
        width: 3.5rem;
        overflow: hidden;

        white-space: pre-wrap;
        text-overflow: ellipsis;

        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-end;
        max-height: 100%;


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
</style>