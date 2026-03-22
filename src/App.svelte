<script lang="ts">
	import Context from './lib/context/Context.svelte';
	import Panel from './lib/components/Panel.svelte';
	import SolverContainer from './lib/solver/containers/SolverContainer.svelte';
	import { onMount } from 'svelte';
	import { PrologController } from './prolog/PrologController';
	import { loadDefaultValues } from './lib/utils/loadDefaultValues';
	import WorkspaceSidebar from './lib/solver/containers/WorkspaceSidebar.svelte';
	import { appPersistence } from './lib/context/persistenceProvider';

	const persist: boolean = false;

	onMount(() => {
		// load the Prolog module
		PrologController.instance().then(() => {
			console.log('[DEBUG] Prolog module loaded.');
		});

		if (!persist) {
			loadDefaultValues();
			return;
		}

		const hydrated = appPersistence.hydrate();
		const stopPersisting = appPersistence.start();

		if (!hydrated) {
			// load default proof only for first-time visitors
			loadDefaultValues();
		}

		return () => {
			stopPersisting();
		};
	});
</script>

<Context>
	<Panel>
		<SolverContainer />
	</Panel>
	<Panel variant="small">
		<WorkspaceSidebar />
	</Panel>
</Context>
