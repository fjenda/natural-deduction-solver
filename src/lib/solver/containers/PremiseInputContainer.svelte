<script lang="ts">
	import PremiseInputRow from '../components/PremiseInputRow.svelte';
	import PremiseInput from '../components/PremiseInput.svelte';
	import { EditState } from '../../../types/EditState';
	import { editState } from '../../../stores/stateStore';
	import { solverContent } from '../../../stores/solverStore';
	import { onChangePremise } from '../actions/proofActions';

	interface PremiseInputContainerProps {
		index: number;
		placeholder?: string;
		value: string;
		error?: boolean;
		onChange?: () => void;
	}

	let {
		index,
		placeholder = '',
		value = $bindable(),
		error = false,
		onChange = undefined
	}: PremiseInputContainerProps = $props();
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
