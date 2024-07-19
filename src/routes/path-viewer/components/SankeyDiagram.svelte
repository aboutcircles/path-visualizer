<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { pathVisualizerStore, type PathVisualizerState } from '../../../stores/pathVisualizer';
	import { get } from 'svelte/store';

	let plotly: any;
	const addressToIgnore = '0x9944Ce8e27CE1f16C4003f108b1C09e5Ae011bA0';
	let initialWidth: string;
	let initialHeight: string;

	let pathVisualizerState: PathVisualizerState;
	const unsubscribe = pathVisualizerStore.subscribe((value) => {
		pathVisualizerState = value;
	});

	const truncateAddress = (address: string): string =>
		`${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

	const filterData = (nodes: any[], links: any[]) => {
		const filteredNodes = nodes.filter((node: any) => node.name !== addressToIgnore);
		const filteredLinks = links.filter(
			(link: any) =>
				nodes[link.source].name !== addressToIgnore && nodes[link.target].name !== addressToIgnore
		);

		// Adjust the indices in links after filtering nodes
		const nodeIndexMap = new Map();
		filteredNodes.forEach((node, index) => {
			nodeIndexMap.set(node.name, index);
		});
		const adjustedLinks = filteredLinks.map((link) => ({
			...link,
			source: nodeIndexMap.get(nodes[link.source].name),
			target: nodeIndexMap.get(nodes[link.target].name)
		}));

		return { filteredNodes, adjustedLinks };
	};

	const drawChart = ({ nodes, links }: { nodes: any; links: any }) => {
		const container = document.getElementById('sankeyDiagram');
		if (container) {
			const width = container.clientWidth;
			const height = container.clientHeight;

			const { filteredNodes, adjustedLinks } = filterData(nodes, links);

			const data = [
				{
					type: 'sankey',
					orientation: 'h',
					node: {
						pad: 15,
						thickness: 30,
						line: { color: 'black', width: 0.5 },
						label: filteredNodes.map((node: any) =>
							node.name.startsWith('0x') ? truncateAddress(node.name) : node.name
						),
						color: filteredNodes.map((node: any) => node.color || '#DF6552')
					},
					link: {
						source: adjustedLinks.map((link: any) => link.source),
						target: adjustedLinks.map((link: any) => link.target),
						value: adjustedLinks.map((link: any) => link.value),
						label: adjustedLinks.map((link: any) =>
							link.label?.startsWith('0x')
								? truncateAddress(link.label) + ' Circles'
								: link.label + ' Circles'
						),
						color: adjustedLinks.map((link: any) => link.color || 'grey'),
						texttemplate: '%{label}',
						textposition: 'inside',
						font: {
							color: 'black',
							size: 10,
							family: 'Arial, sans-serif'
						},
						hoverlabel: {
							bgcolor: 'white',
							font: {
								color: 'black'
							}
						}
					}
				}
			];

			const layout = {
				title: '',
				font: { size: 10 },
				width,
				height,
				autosize: true,
				paper_bgcolor: 'rgba(0,0,0,0)',
				plot_bgcolor: 'rgba(0,0,0,0)',
				margin: { l: 0, r: 0, t: 50, b: 100 }
			};

			const config = {
				displayModeBar: false // Hide the toolbar
			};

			plotly.newPlot('sankeyDiagram', data, layout, config);
		}
	};

	const updateChartDimensions = () => {
		const data = get(pathVisualizerStore).chartData;
		drawChart(data);
	};

	const clearChartContent = () => {
		const container = document.getElementById('sankeyDiagram');
		if (container) {
			plotly.purge(container);
		}
	};

	const disableScrolling = (e: Event) => {
		e.preventDefault();
	};

	const enableFullScreenMode = () => {
		if (typeof document !== 'undefined') {
			const container = document.getElementById('sankeyDiagramContainer');
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
			const container = document.getElementById('sankeyDiagramContainer');
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
		if (pathVisualizerState.isFullScreen) {
			disableFullScreenMode();
		} else {
			enableFullScreenMode();
		}
		pathVisualizerStore.update((state) => ({ ...state, isFullScreen: !state.isFullScreen }));
		updateChartDimensions();
	};

	onMount(async () => {
		plotly = (await import('plotly.js-dist-min')).default;
		if (typeof window !== 'undefined') {
			updateChartDimensions();
			window.addEventListener('resize', updateChartDimensions);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', updateChartDimensions);
			disableFullScreenMode(); // Ensure cleanup on component destroy
		}
		unsubscribe();
	});

	$: {
		if (pathVisualizerState.isFullScreen) {
			updateChartDimensions();
		}
	}

	$: {
		if (pathVisualizerState.clearChart) {
			clearChartContent();
			pathVisualizerStore.update((state) => ({ ...state, clearChart: false }));
		}
	}

	$: {
		if (pathVisualizerState.chartData.nodes.length > 0) {
			updateChartDimensions();
		}
	}
</script>

<div
	id="sankeyDiagramContainer"
	class="relative flex-grow h-full bg-white rounded-xl p-4 overflow-hidden"
	class:fullscreen={pathVisualizerState.isFullScreen}
>
	<div class="flex justify-between items-center mb-4">
		<h1 class="font-bold">About this graph</h1>
		<button class="bg-blue-600 text-white px-4 py-2 rounded" on:click={toggleFullScreen}>
			{#if pathVisualizerState.isFullScreen}
				Exit Full Screen
			{:else}
				Full Screen
			{/if}
		</button>
	</div>
	<p>
		This graph shows the flow of value from one address to another. The width of the lines indicates
		the amount of value transferred.
	</p>
	<div id="sankeyDiagram" class="w-full h-full bg-white rounded-xl overflow-hidden"></div>
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
