<script lang="ts">
	import { FlatToast, ToastContainer } from 'svelte-toasts';
	import { Modals } from 'svelte-modals';
	import MainLayout from '../layouts/MainLayout.svelte';
	import Navbar from '../components/Navbar.svelte';
</script>

<ToastContainer placement="top-right" let:data>
	<FlatToast {data} />
</ToastContainer>

<Modals />

<Navbar>
	<MainLayout>
		<slot />
	</MainLayout>
</Navbar>
