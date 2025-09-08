<script lang="ts">
	import Context from './lib/context/Context.svelte';
	import Panel from './lib/components/Panel.svelte';
	import SolverContainer from './lib/solver/containers/SolverContainer.svelte';
	import { onMount } from 'svelte';
	import { PrologController } from './prolog/PrologController';
	import { loadDefaultValues } from './lib/utils/loadDefaultValues';
	import RuleGridContainer from './lib/solver/containers/RuleGridContainer.svelte';
	import Separator from './lib/components/Separator.svelte';
	import TheoremsContainer from './lib/solver/containers/TheoremsContainer.svelte';

	onMount(() => {
		// load the Prolog module
		PrologController.instance().then(() => {
			console.log('[DEBUG] Prolog module loaded.');
		});

		// load default proof
		loadDefaultValues();
	});
</script>

<Context>
	<Panel>
		<SolverContainer />
	</Panel>
	<Panel variant="small">
		<RuleGridContainer />
		<Separator />
		<TheoremsContainer />
	</Panel>
</Context>
