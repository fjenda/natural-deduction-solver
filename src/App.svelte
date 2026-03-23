<script lang="ts">
	import Context from './lib/context/Context.svelte';
	import Panel from './lib/components/Panel.svelte';
	import WorkspaceTabs from './lib/components/WorkspaceTabs.svelte';
	import SolverContainer from './lib/solver/containers/SolverContainer.svelte';
	import { onMount } from 'svelte';
	import { PrologController } from './prolog/PrologController';
	import { loadDefaultValues } from './lib/utils/loadDefaultValues';
	import { setupKeyboardShortcuts } from './lib/utils/keyboardShortcuts';
	import WorkspaceSidebar from './lib/solver/containers/WorkspaceSidebar.svelte';
	import { appPersistence } from './lib/context/persistenceProvider';
	import { initializeWorkspaces } from './stores/workspaceStore';

	const persist: boolean = false;

	onMount(() => {
		// load the Prolog module
		PrologController.instance().then(() => {
			// Prolog module ready
		});

		// setup global keyboard shortcuts
		const cleanupKeyboard = setupKeyboardShortcuts();

		if (!persist) {
			loadDefaultValues();
			initializeWorkspaces();
			return cleanupKeyboard;
		}

		const hydrated = appPersistence.hydrate();
		const stopPersisting = appPersistence.start();

		if (!hydrated) {
			// load default proof only for first-time visitors
			loadDefaultValues();
		}

		initializeWorkspaces();

		return () => {
			stopPersisting();
			cleanupKeyboard();
		};
	});
</script>

<Context>
	<div class="main-area">
		<WorkspaceTabs />
		<Panel>
			<SolverContainer />
		</Panel>
	</div>
	<Panel variant="small">
		<WorkspaceSidebar />
	</Panel>
</Context>

<style>
	.main-area {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.main-area > :global(.wrapper) {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		border-top: none;
	}
</style>
