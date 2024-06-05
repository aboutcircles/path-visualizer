<script>
	import Navbar from '$lib/components/Navbar.svelte';
	import { onMount } from 'svelte';
	import '../app.css';
	import { goto } from '$app/navigation';

	// onMount(() => {
	// 	goto('/graph-explorer');
	// });
</script>

<div class="flex flex-col items-center justify-center max-h-screen w-full p-6 gap-6">
	<Navbar />
	<div class="w-full overflow-auto flex-1">
		<slot />
	</div>
</div>
