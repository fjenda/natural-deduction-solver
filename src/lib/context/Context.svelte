<script lang="ts">
	import { setContext } from 'svelte';
	import { FlatToast, ToastContainer } from 'svelte-toasts';
	import { Modals } from 'svelte-modals';
	import MainLayout from '../layouts/MainLayout.svelte';
	import Navbar from '../components/Navbar.svelte';
	import { appPersistence, persistenceContextKey } from './persistenceProvider';

	setContext(persistenceContextKey, appPersistence);

	let { children } = $props();
</script>

<ToastContainer placement="top-right" let:data>
	<FlatToast {data} />
</ToastContainer>

<Modals />

<Navbar>
	<MainLayout>
		{@render children()}
	</MainLayout>
</Navbar>
