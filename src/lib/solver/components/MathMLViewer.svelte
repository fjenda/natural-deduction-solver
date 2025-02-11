<script lang="ts">
    import { PrettySyntaxer } from "../PrettySyntaxer";

    export let value: string | null = "";
    export let fontSize: number = 1.35;

    $: mathml = PrettySyntaxer.toMathML(value ?? "");
</script>

<div class="mathml-viewer" style="font-size: {fontSize}em;">
    {@html mathml}
</div>

<style>
    .mathml-viewer {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        height: 100%;
        padding: 1rem 0.5rem;
    }
</style>