<script lang="ts">
    import { PremiseParser } from '../parsers/PremiseParser';
    import Hint from "svelte-hint";

    export let placeholder: string;
    export let value: string | null = "";
    export let error: boolean = false;
    
    let hint: string = "" +
        "Constants - [a-g]\n" +
        "Variables - [h-z]\n" +
        "Functions - [h-z]()\n" +
        "Predicates - [A-Z]()\n" +
        "Connectives:\n" +
        "! for negation,\n" +
        "& for conjunction,\n" +
        "| for disjunction,\n" +
        "> for implication,\n" +
        "= for equivalence.";


</script>

<input type="text" placeholder={placeholder} bind:value={value} class:error={error} />

<style>
    input {
        height: 3.5rem;
        /*flex-grow: 1;*/
        transition: background-color 0.2s;
    }

    input.error::placeholder {
        color: white;
    }

    input.error {
        background-color: #df7171;
    }

</style>