<script lang="ts">
	import cytoscape from 'cytoscape';
	import Controls from './Controls.svelte';
	import NodeList from './NodeList.svelte';
	import Graph from './Graph.svelte';
	import { writable, get } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';

	let cy: cytoscape.Core | undefined;
	let addNodeAddress: string = '';
	let pathFromAddress: string = '';
	let pathToAddress: string = '';

	let nodeList: NodeList | undefined;
	let graph: Graph | undefined;

	let initialWidth: string;
	let initialHeight: string;
	let isFullScreen = writable(false);

	const resetAll = () => {
		nodeList?.resetFilteredNodes();
		cy?.elements().remove();
		cy?.reset();
	};

	function addNodeIfNotExists() {
		if (cy && !cy.getElementById(addNodeAddress).length) {
			graph?.addNode(addNodeAddress, nodeList);
		} else {
			console.error('Node already exists:', addNodeAddress);
		}
	}

	const disableScrolling = (e: Event) => {
		e.preventDefault();
	};

	const enableFullScreenMode = () => {
		if (typeof document !== 'undefined') {
			const container = document.getElementById('graphContainer');
			if (container) {
				// Save the initial size
				initialWidth = container.getBoundingClientRect().width + 'px';
				initialHeight = container.getBoundingClientRect().height + 'px';

				// Set to fullscreen size
				container.style.width = '100vw';
				container.style.height = '100vh';
				container.classList.add('fullscreen');
			}
			document.body.style.overflow = 'hidden'; // Disable scrolling
			document.addEventListener('touchmove', disableScrolling, { passive: false });
			document.addEventListener('wheel', disableScrolling, { passive: false });
		}
	};

	const disableFullScreenMode = () => {
		if (typeof document !== 'undefined') {
			const container = document.getElementById('graphContainer');
			if (container) {
				// Restore the initial size
				container.style.width = initialWidth;
				container.style.height = initialHeight;
				container.classList.remove('fullscreen');
			}
			document.body.style.overflow = ''; // Re-enable scrolling
			document.removeEventListener('touchmove', disableScrolling);
			document.removeEventListener('wheel', disableScrolling);
		}
	};

	const toggleFullScreen = () => {
		isFullScreen.update((value) => {
			if (value) {
				disableFullScreenMode();
			} else {
				enableFullScreenMode();
			}
			return !value;
		});
	};

	onMount(() => {
		// Add event listener for resize to update the layout when in full-screen mode
		const updateLayoutOnResize = () => {
			if (get(isFullScreen)) {
				graph?.runLayout();
			}
		};
		window.addEventListener('resize', updateLayoutOnResize);

		return () => {
			window.removeEventListener('resize', updateLayoutOnResize);
		};
	});

	onDestroy(() => {
		// Ensure cleanup on component destroy
		disableFullScreenMode();
	});
</script>

<div class="flex h-full w-full">
	<NodeList {cy} bind:this={nodeList} />

	<div class="flex flex-col flex-grow rounded-xl gap-4 m-4">
		<div class="bg-white rounded-xl shadow">
			<Controls
				bind:addNodeAddress
				bind:pathFromAddress
				bind:pathToAddress
				onAddNode={addNodeIfNotExists}
				onAddPath={() => graph?.addPath(pathFromAddress, pathToAddress, nodeList)}
				onGenerate={() => graph?.generateGraph()}
				onReset={() => resetAll()}
			/>
		</div>

		<div
			id="graphContainer"
			class="flex-grow bg-white rounded-xl shadow overflow-auto relative"
			class:fullscreen={$isFullScreen}
		>
			<Graph {nodeList} bind:cy bind:this={graph} />
			<p class="text-gray-600 text-sm absolute top-2 left-2">
				The arrow direction indicates who is being trusted.
			</p>
			<button
				class="bg-blue-600 text-white px-4 py-2 rounded absolute top-2 right-2"
				on:click={toggleFullScreen}
			>
				{#if $isFullScreen}
					Exit Full Screen
				{:else}
					Full Screen
				{/if}
			</button>
		</div>
	</div>
</div>

<style>
	.fullscreen {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 40;
		padding: 1rem;
		overflow: hidden;
	}
</style>
