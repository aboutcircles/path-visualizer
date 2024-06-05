<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { SankeyChart, type SankeyLink, type SankeyNode } from '../../../lib/api/sankey';
	import { ethers, type LogDescription } from 'ethers';
	import UserSelect from '$lib/components/UserSelect.svelte';
	import RecentTransactions from './RecentTransactions.svelte';
	import { CirclesAPI, type UserData } from '$lib/api/gardenApi';

	interface Transfer {
		from: string;
		to: string;
		amount: ethers.BigNumberish;
		transactionHash: string;
		logs: LogDescription[];
		fromUser?: UserData;
		toUser?: UserData;
		timestamp?: number;
		transactionIndex?: number;
	}

	export let transactions: Writable<Transfer[]> = writable([]);
	const fromAddress = writable('');
	const toAddress = writable('');
	const fromUsername = writable('');
	const fromUserAvatar = writable('');
	const toUsername = writable('');
	const toUserAvatar = writable('');
	const value = writable('');
	const isLoading = writable(false);
	const ethValue = writable(0);
	const isContentOpen = writable(true);
	const isSidebarOpen = writable(false);
	const isUserSelectOpen = writable(true);
	const chartData = writable<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });

	let plotly: any;
	let sankeyChart = new SankeyChart();

	$: weiValue = ethers.parseEther($ethValue.toString()).toString();
	$: $value = weiValue;

	$: isGenerateDisabled = !$fromUsername || !$toUsername || $ethValue === 0;

	const truncateAddress = (address: string): string =>
		`${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

	const handleSubmit = async () => {
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
			chartData.set(sankeyData);
			drawChart(sankeyData);
			isUserSelectOpen.set(false); // Close the user select section after generating the graph
		} catch (error) {
			console.error('Failed to generate Sankey data:', error);
		}
		isLoading.set(false);
	};

	const resetForm = () => {
		fromAddress.set('');
		toAddress.set('');
		fromUsername.set('');
		fromUserAvatar.set('');
		toUsername.set('');
		toUserAvatar.set('');
		ethValue.set(0);
		isUserSelectOpen.set(true);
	};

	const drawChart = ({ nodes, links }: { nodes: any; links: any }) => {
		const container = document.getElementById('sankeyDiagram');
		if (container) {
			const width = container.clientWidth;
			const height = container.clientHeight;

			const data = [
				{
					type: 'sankey',
					orientation: 'h',
					node: {
						pad: 15,
						thickness: 30,
						line: { color: 'black', width: 0.5 },
						label: nodes.map((node: SankeyNode) =>
							node.name.startsWith('0x') ? truncateAddress(node.name) : node.name
						),
						color: nodes.map((node: SankeyNode) => node.color || '#DF6552')
					},
					link: {
						source: links.map((link: SankeyLink) => link.source),
						target: links.map((link: SankeyLink) => link.target),
						value: links.map((link: SankeyLink) => link.value),
						label: links.map((link: SankeyLink) =>
							link.label?.startsWith('0x')
								? truncateAddress(link.label) + ' CRC'
								: link.label + ' CRC'
						),
						color: links.map((link: SankeyLink) => link.color || 'grey'),
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
				height
			};

			const config = {
				displayModeBar: false // Hide the toolbar
			};

			plotly.newPlot('sankeyDiagram', data, layout, config);
		}
	};

	const generateChartFromLogs = async (logs: LogDescription[]) => {
		const sankeyData = await sankeyChart.generateSankeyDataFromLogs(logs);
		chartData.set(sankeyData);
		drawChart(sankeyData);
		isContentOpen.set(false);
	};

	const updateChartDimensions = () => {
		const data = $chartData;
		drawChart(data);
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
		}
	});
</script>

<div class="flex flex-col mx-auto h-full p-4 space-y-4">
	<div class="bg-white p-4 rounded-xl shadow mb-4 transition-all duration-300">
		<div class="flex justify-between items-center mb-4">
			<h2 class="text-2xl font-bold">Circles Garden</h2>
		</div>
		<div
			class="flex flex-col space-y-2 md:space-y-0 md:flex-row md:flex-wrap md:items-end md:gap-2"
		>
			{#if $isUserSelectOpen || !window.matchMedia('(max-width: 768px)').matches}
				<UserSelect
					label="Path from"
					bind:bindValue={$fromAddress}
					bind:bindUsername={$fromUsername}
					bind:bindUserAvatar={$fromUserAvatar}
					placeholder="From Address"
					inputType="from"
				/>
				<UserSelect
					label="Path to"
					bind:bindValue={$toAddress}
					bind:bindUsername={$toUsername}
					bind:bindUserAvatar={$toUserAvatar}
					placeholder="To Address"
					inputType="to"
				/>
			{/if}
			<div class="flex-1">
				<label for="ethValue" class="block text-sm font-medium text-gray-700">Value:</label>
				<input
					id="ethValue"
					type="range"
					min="0"
					max="10000"
					step="1"
					bind:value={$ethValue}
					class="mt-1 block w-full bg-gray-50"
				/>
				<div class="text-xs text-gray-700 mt-1">Circles: {$ethValue}</div>
			</div>
			<div class="flex space-x-2 mt-4 md:mt-0">
				<button
					type="submit"
					class="bg-blue-600 border-2 border-blue-600 font-bold rounded-full text-white px-6 py-2 hover:bg-blue-700 transition duration-300 ease-in-out"
					disabled={isGenerateDisabled}
					on:click={handleSubmit}
				>
					Generate
				</button>
				<button
					type="reset"
					class="bg-white border-2 border-blue-600 font-bold rounded-full text-blue-600 px-6 py-2 hover:bg-gray-100 transition duration-300 ease-in-out"
					on:click={resetForm}
				>
					Reset
				</button>
			</div>
		</div>
	</div>

	<div class="relative bg-white rounded-xl flex flex-grow overflow-auto">
		<div
			class="bg-white p-4 rounded-xl shadow absolute left-0 top-0 h-full z-20 transition-transform duration-300 transform"
			class:translate-x-0={$isSidebarOpen}
			class:-translate-x-full={!$isSidebarOpen}
		>
			<div class="mt-8 h-full overflow-auto">
				<h2 class="text-xl font-bold mb-4">Recent Transactions</h2>
				<RecentTransactions {transactions} {generateChartFromLogs} />
			</div>
		</div>
		<div
			class="absolute top-1/2 transform -translate-y-1/2 transition-all duration-300 z-30"
			style="left: {$isSidebarOpen ? '320px' : '20px'};"
		>
			<div
				class="notch bg-blue-600 rounded-full w-2 h-16 cursor-pointer"
				on:click={() => isSidebarOpen.set(!$isSidebarOpen)}
			></div>
		</div>
		<div class="flex-1 p-4 h-full w-full bg-white rounded-xl z-10">
			<h1 class="font-bold">About this graph</h1>
			<p>
				This graph shows the flow of value from one address to another. The width of the lines
				indicates the amount of value transferred.
			</p>
			<div id="sankeyDiagram" class="mt-4 w-full h-full"></div>
		</div>
	</div>
</div>

{#if $isLoading}
	<div
		class="fixed inset-0 bg-black bg-opacity-30 backdrop-filter backdrop-blur-sm flex flex-col items-center justify-center z-50"
	>
		<div class="text-white text-center mb-4">
			Calculating path... This may take a while depending on its complexity. Please be patient.
		</div>
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

	.translate-x-0 {
		transform: translateX(0);
	}

	.-translate-x-full {
		transform: translateX(-100%);
	}

	.transform-gone {
		display: none;
	}
</style>
