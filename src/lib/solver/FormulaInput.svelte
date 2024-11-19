<script lang="ts">
    import {onDestroy, onMount} from 'svelte';

    let formulas: string = "";
    let textarea: HTMLTextAreaElement;
    let lineNumbersEle: HTMLDivElement;
    let lineNumbers: string[] = [];

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

    // displays the line numbers
    const syncLineNumbers = () => {
        lineNumbers = calculateLineNumbers();
    }

    onMount(() => {
        const handleScroll = () => {
            lineNumbersEle.scrollTop = textarea.scrollTop;
        };

        textarea.addEventListener('scroll', handleScroll);
        textarea.addEventListener('input', syncLineNumbers);

        const resizeObserver = new ResizeObserver(() => {
            const rect = textarea.getBoundingClientRect();
            lineNumbersEle.style.height = `${rect.height}px`;
            syncLineNumbers();
        });

        resizeObserver.observe(textarea);

        onDestroy(() => {
            textarea.removeEventListener('scroll', handleScroll);
            textarea.removeEventListener('input', syncLineNumbers);
            resizeObserver.disconnect();
        });

        syncLineNumbers(); // initial sync
    });

</script>

<!-- Input where the individual formulas will be written -->
<div id="container" class="container">
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
</div>

<style>
    .container {
        display: flex;
        border: 1px solid rgb(203 213 225);
        border-radius: 0.5rem;

        width: 100%;
        height: 100%;

        /* Edit styles here */
        --font-family: monospace;
        --font-size: 1.5em;
        --font-weight: normal;
        --letter-spacing: normal;
        --line-height: normal;
        --padding: 0.5em;
    }

    .formulas-textarea {
        border: none;
        resize: none;

        font-family: var(--font-family);
        font-size: var(--font-size);
        font-weight: var(--font-weight);
        letter-spacing: var(--letter-spacing);
        line-height: var(--line-height);
        padding: var(--padding);
    }

    .formulas-line-numbers {
        width: 3.5rem;

        border-right: 1px solid rgb(203 213 225);
        overflow: hidden;
        white-space: nowrap;
        /*text-align: right;*/

        /* Synchronize styles */
        font-family: var(--font-family);
        font-size: var(--font-size);
        font-weight: var(--font-weight);
        letter-spacing: var(--letter-spacing);
        line-height: var(--line-height);
        padding: var(--padding);
    }
</style>