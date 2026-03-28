import { toasts } from 'svelte-toasts';
import type { ToastType } from 'svelte-toasts/types/common';

export const showToast = (message: string, type: ToastType) => {
	const theme = document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light';

	toasts.add({
		title: message,
		type: type,
		duration: 5000,
		theme: theme
	});
};
