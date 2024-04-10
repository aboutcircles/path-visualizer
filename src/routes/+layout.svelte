<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import '../app.css';
</script>

<div class="flex flex-col items-center justify-center h-screen w-screen px-4">
	<Navbar />
	<slot />
</div>
