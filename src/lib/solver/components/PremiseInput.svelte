<script lang="ts">
    import { PremiseParser } from '../parsers/PremiseParser';

    export let placeholder: string;
</script>

<input type="text" id="input" placeholder="{placeholder}" on:input={PremiseParser.parsePremise()} />

<style>
    input {
        max-height: 5rem;
    }
</style>