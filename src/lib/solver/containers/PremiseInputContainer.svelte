<script lang="ts">
	import PremiseInputRow from '../components/PremiseInputRow.svelte';
	import PremiseInput from '../components/PremiseInput.svelte';
	import { EditState } from '../../../types/EditState';
	import { editState } from '../../../stores/stateStore';
	import { solverContent } from '../../../stores/solverStore';
	import { onChangePremise } from '../actions/proofActions';

	export let index: number;
	export let placeholder: string = '';
	export let value: string;
	export let error: boolean | undefined = undefined;
	export let onChange: (() => void) | undefined = undefined;
</script>

<PremiseInputRow
	{index}
	removable={$editState === EditState.SOLVER && index !== 0 && placeholder !== 'Conclusion'}
>
	<PremiseInput
		placeholder={placeholder === '' ? `Premise ${index + 1}` : placeholder}
		bind:value
		error={error ?? !$solverContent.premises[index].tree}
		{index}
		onChange={() =>
			(onChange ?? (() => onChangePremise($solverContent.premises[index].value, index)))()}
	/>
</PremiseInputRow>
