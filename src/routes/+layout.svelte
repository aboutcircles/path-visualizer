<script>
	import Navbar from '$lib/components/Navbar.svelte';
	import '../app.css';
</script>

<div class="flex flex-col items-center justify-center max-h-screen w-full p-4">
	<Navbar />
	<div class="w-full overflow-auto h-full">
		<slot />
	</div>
</div>
