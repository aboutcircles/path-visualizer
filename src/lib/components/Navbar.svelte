<script>
	import { writable } from 'svelte/store';

	const isMenuOpen = writable(false);

	function toggleMenu() {
		isMenuOpen.update((n) => !n);
	}

	const links = [
		{ href: '/graph-explorer', text: 'Trust Graph Explorer' },
		{ href: '/path-viewer', text: 'Transaction Visualizer' },
		{ href: '/sybilresistance', text: 'Sybil Resistance' },
		{ href: '/analytics', text: 'Circles Network Stats' }
	];
</script>

<nav class="bg-secondary-bg px-5 py-2 shadow-lg rounded-full w-full relative">
	<div class="flex justify-between items-center">
		<!-- Left-aligned logo -->
		<div class="flex items-center">
			<img src="/circles-logo-full-white.svg" alt="Logo" class="h-8 mr-4" />
		</div>

		<!-- Hamburger Menu Icon for mobile -->
		<div class="lg:hidden">
			<button
				on:click={toggleMenu}
				class="flex items-center p-2 rounded-md text-white hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
			>
				<svg
					class="block h-6 w-6"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</button>
		</div>

		<!-- Right-aligned links for desktop -->
		<div class="hidden lg:flex items-center space-x-4">
			{#each links as link}
				<a
					href={link.href}
					class="text-lg text-white hover:text-gray-400 p-2 mx-4 transition duration-300 ease-in-out rounded-md"
					>{link.text}</a
				>
			{/each}
		</div>
	</div>

	<!-- Mobile Menu Overlay -->
	{#if $isMenuOpen}
		<div
			class="fixed inset-0 bg-secondary-bg bg-opacity-95 flex flex-col items-center justify-center z-50"
		>
			<button
				on:click={toggleMenu}
				class="absolute top-4 right-4 text-white hover:text-gray-400 focus:outline-none"
			>
				<svg
					class="h-6 w-6"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
			<div class="space-y-4 text-center">
				{#each links as link}
					<a
						href={link.href}
						on:click={() => isMenuOpen.set(false)}
						class="block text-lg text-white hover:text-gray-400 px-4 py-2 rounded-md transition duration-300 ease-in-out"
						>{link.text}</a
					>
				{/each}
			</div>
		</div>
	{/if}
</nav>
