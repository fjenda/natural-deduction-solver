<script lang="ts">
    import {onDestroy, onMount} from 'svelte';
    import {FormulaParser} from "../parsers/FormulaParser";

    let formulas: string = "";
    let textarea: HTMLTextAreaElement;
    let lineNumbersEle: HTMLDivElement;
    let lineRulesEle: HTMLDivElement;
    let lineNumbers: string[] = [];
    let lineRules: string[] = [];
    let container: HTMLDivElement;
    let focused: boolean = false;

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

    const getLineRules = (): string[] => {
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
        lineNumbers = calculateLineNumbers();
        lineRules = getLineRules();
    }

    onMount(() => {
        const handleScroll = () => {
            lineNumbersEle.scrollTop = textarea.scrollTop;
        };

        const handleFocus = () => {
            focused = true;
        };

        const handleBlur = () => {
            focused = false;
        };

        textarea.addEventListener('input', syncLineNumbers);
        textarea.addEventListener('scroll', handleScroll);
        textarea.addEventListener('focus', handleFocus);
        textarea.addEventListener('blur', handleBlur);

        const resizeObserver = new ResizeObserver(() => {
            const rect = textarea.getBoundingClientRect();
            lineNumbersEle.style.height = `${rect.height}px`;
            syncLineNumbers();
        });

        resizeObserver.observe(textarea);

        onDestroy(() => {
            textarea.removeEventListener('input', syncLineNumbers);
            textarea.removeEventListener('scroll', handleScroll);
            textarea.removeEventListener('focus', handleFocus);
            textarea.removeEventListener('blur', handleBlur);
            resizeObserver.disconnect();
        });

        syncLineNumbers(); // initial sync
    });

</script>

<!-- Input where the individual formulas will be written -->
<div id="container" class="container" bind:this={container} class:focused={focused}>
    <div id="line-numbers"
         class="formulas-line-numbers"
         bind:this={lineNumbersEle}
    >
        {#each lineNumbers as number}
            <div>{number ? `${number}.` : '\u00A0'}</div>
        {/each}
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
         bind:this={lineNumbersEle}
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

    .formulas-textarea {
        border: none;
        resize: none;
        border-radius: 0;

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
        white-space: nowrap;

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