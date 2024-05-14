<script>
	import Page from '$lib/components/Page.svelte';

	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';

	onMount(() => {
		goto('/graph-explorer');
	});
</script>

<Page></Page>
