<script lang="ts">
    import { PremiseParser } from '../parsers/PremiseParser';
    import Hint from "svelte-hint";

    export let placeholder: string;
    export let value: string = "";
    
    
</script>

<div class="wrapper">
    <div class="hint-wrapper">
        <Hint text="TODO!" placement="left">
            <i class="fa fa-info-circle"></i>
        </Hint>
    </div>
<!--    <input type="text" id="input" placeholder="{placeholder}" on:input={PremiseParser.parsePremise()} />-->
    <input type="text" id="input" placeholder="{placeholder}" bind:value={value} />
</div>

<style>
    input {
        max-height: 3.5rem;
    }

    .wrapper {
        position: relative;
        flex-grow: 1;
    }

    .hint-wrapper {
        position: absolute;
        top: 0;
        right: 0;
        transform: translate(-50%, 25%);
    }
</style>