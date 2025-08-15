import { toasts } from 'svelte-toasts';
import type { ToastType } from 'svelte-toasts/types/common';

export const showToast = (message: string, type: ToastType) => {
	toasts.add({
		title: message,
		type: type,
		duration: 5000
	});
};
