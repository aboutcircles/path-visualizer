<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { SankeyChart } from '../../../lib/api/sankey';
	import { CirclesAPI } from '../../../lib/api/gardenApi';
	import { ethers } from 'ethers';

	let plotly: any;
	const fromAddress = writable('');
	const toAddress = writable('');
	const value = writable('');
	const isLoading = writable(false);

	let sankeyChart = new SankeyChart();

	let ethValue = 0; // ETH value from slider input
	let weiValue = '0'; // Wei value computed from ETH

	// Convert ETH to wei using Ethers.js
	$: weiValue = ethers.parseEther(ethValue.toString()).toString();
	$: $value = weiValue;

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
					color: nodes.map((node: any) => node.color || '#e60725')
				},
				link: {
					source: links.map((link: any) => link.source),
					target: links.map((link: any) => link.target),
					value: links.map((link: any) => link.value),
					label: links.map((link: any) => link.label + ' CRC'),
					color: links.map((link: any) => link.color || 'grey')
				}
			}
		];

		const layout = {
			title: '',
			font: { size: 10 }
		};

		plotly.newPlot('sankeyDiagram', data, layout);
	}

	onMount(async () => {
		plotly = (await import('plotly.js-dist-min')).default;
	});
</script>

<div class="flex flex-col mx-auto h-full">
	<div class="bg-white p-4 rounded-xl shadow mb-4">
		<h2 class="text-2xl font-bold mb-4">Generate your graph</h2>
		<form on:submit|preventDefault={handleSubmit} class="flex flex-wrap items-end gap-2">
			<div class="flex-1 m-1">
				<label for="fromAddress" class="block text-sm font-medium text-gray-700">Path from:</label>
				<input
					id="fromAddress"
					type="text"
					bind:value={$fromAddress}
					placeholder="From Address"
					class="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
				/>
			</div>
			<div class="flex-1 m-1">
				<label for="toAddress" class="block text-sm font-medium text-gray-700">Path to:</label>
				<input
					id="toAddress"
					type="text"
					bind:value={$toAddress}
					placeholder="To Address"
					class="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
				/>
			</div>
			<div class="flex-1 m-1">
				<label for="ethValue" class="block text-sm font-medium text-gray-700">Value (in ETH):</label
				>
				<input
					id="ethValue"
					type="range"
					min="0"
					max="10000"
					step="1"
					bind:value={ethValue}
					class="mt-1 block w-full bg-gray-50"
				/>
				<div class="text-xs text-gray-700 mt-1">
					Circles: {ethValue}
				</div>
			</div>

			<div class="flex">
				<div class="mt-6">
					<button
						type="submit"
						class="bg-secondary-bg-light border-2 border-secondary-bg-light font-bold rounded-full text-white px-6 py-2 hover:bg-blue-700 transition duration-300 ease-in-out"
					>
						Generate
					</button>
					<button
						type="reset"
						class="bg-white border-2 border-secondary-bg-light font-bold rounded-full text-secondary-bg-light px-6 py-2 hover:bg-gray-100 transition duration-300 ease-in-out mt-2"
						on:click={() => {
							location.reload();
						}}
					>
						Reset
					</button>
				</div>
			</div>
		</form>
	</div>
	<div class="bg-white p-4 rounded-xl shadow flex-grow overflow-auto">
		<h1 class="font-bold">About this graph</h1>
		<p>
			This graph shows the flow of value from one address to another. The width of the lines
			indicates the amount of value transferred.
		</p>
		<div id="sankeyDiagram"></div>
	</div>
</div>

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
