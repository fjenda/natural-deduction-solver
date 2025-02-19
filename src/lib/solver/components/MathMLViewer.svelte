<script lang="ts">
    import { PrettySyntaxer } from "../PrettySyntaxer";

    export let value: string | null = "";
    export let fontSize: string = "1.35rem";
    export let padding: string = "1rem 0.5rem";
    export let justifyContent: string = "center";

    $: mathml = PrettySyntaxer.toMathML(value ?? "");
</script>

<div class="mathml-viewer" style="font-size: {fontSize}; padding: {padding}; justify-content: {justifyContent}">
    {@html mathml}
</div>

<style>
    .mathml-viewer {
        display: flex;
        align-items: center;
        height: 100%;
    }
</style>