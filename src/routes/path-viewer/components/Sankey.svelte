<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { SankeyChart } from '../../../lib/api/sankey';
	import { CirclesAPI } from '../../../lib/api/gardenApi';

	let plotly: any;
	const fromAddress = writable('');
	const toAddress = writable('');
	const value = writable('');
	const isLoading = writable(false);

	const pathfinderURL = '/api';
	const sankeyChart = new SankeyChart(pathfinderURL);

	async function handleSubmit() {
		isLoading.set(true);
		let sourceAddress = $fromAddress;
		let sinkAddress = $toAddress;
		const amount: string = $value;

		if (!sourceAddress.startsWith('0x')) {
			sourceAddress = (await CirclesAPI.resolveUsernameToAddress(sourceAddress)) || '';
		}
		if (!sinkAddress.startsWith('0x')) {
			sinkAddress = (await CirclesAPI.resolveUsernameToAddress(sinkAddress)) || '';
		}

		try {
			const sankeyData = await sankeyChart.generateSankeyData(sourceAddress, sinkAddress, amount);
			drawChart(sankeyData);
		} catch (error) {
			console.error('Failed to generate Sankey data:', error);
		}
		isLoading.set(false);
	}

	function drawChart({ nodes, links }: { nodes: any; links: any }) {
		const data = [
			{
				type: 'sankey',
				orientation: 'h',
				node: {
					pad: 15,
					thickness: 30,
					line: { color: 'black', width: 0.5 },
					label: nodes.map((node: any) => node.name),
					color: nodes.map((node: any) => node.color || 'blue')
				},
				link: {
					source: links.map((link: any) => link.source),
					target: links.map((link: any) => link.target),
					value: links.map((link: any) => link.value),
					color: links.map((link: any) => link.color || 'grey')
				}
			}
		];

		const layout = {
			title: 'Sankey Diagram',
			font: { size: 10 }
		};

		plotly.newPlot('sankeyDiagram', data, layout);
	}

	onMount(async () => {
		plotly = (await import('plotly.js-dist-min')).default;
	});
</script>

<div class="fixed top-20 inset-x-0 z-50 px-4">
	<div
		class="max-w-screen-xl mx-auto bg-secondary-bg-light px-5 py-4 shadow-lg rounded-full flex items-center justify-center"
	>
		<form on:submit|preventDefault={handleSubmit} class="flex space-x-2 items-center">
			<input
				type="text"
				bind:value={$fromAddress}
				placeholder="From Address"
				class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
			/>
			<input
				type="text"
				bind:value={$toAddress}
				placeholder="To Address"
				class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
			/>
			<input
				type="text"
				bind:value={$value}
				placeholder="Value"
				class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
			/>
			<button
				type="submit"
				class="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
				>Update</button
			>
		</form>
	</div>
</div>

<div id="sankeyDiagram" class="w-full mx-auto h-full"></div>
{#if $isLoading}
	<div
		class="fixed inset-0 bg-black bg-opacity-30 backdrop-filter backdrop-blur-sm flex items-center justify-center"
	>
		<div class="pulsing-loader"></div>
	</div>
{/if}

<style>
	.pulsing-loader {
		border-radius: 50%;
		width: 10rem;
		height: 10rem;
		background-color: rgba(255, 255, 255, 0.5);
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
		}
		70% {
			transform: scale(1);
			box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
		}
		100% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
		}
	}
</style>
