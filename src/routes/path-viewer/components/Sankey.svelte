<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { SankeyChart } from '../../../lib/api/sankey';
	import { ethers } from 'ethers';
	import UserSelect from '$lib/components/UserSelect.svelte';
	import { CirclesAPI } from '$lib/api/gardenApi';
	import hubAbi from '$lib/abis/Hub.json';
	import tokenAbi from '$lib/abis/Token.json';

	let plotly: any;
	const fromAddress = writable('');
	const toAddress = writable('');
	const fromUsername = writable(''); // Store for selected username for fromAddress
	const fromUserAvatar = writable(''); // Store for selected avatar for fromAddress
	const toUsername = writable(''); // Store for selected username for toAddress
	const toUserAvatar = writable(''); // Store for selected avatar for toAddress
	const value = writable('');
	const isLoading = writable(false);
	const ethValue = writable(0);

	interface Transfer {
		from: string;
		to: string;
		amount: ethers.BigNumberish;
		transactionHash: string;
		logs: any[];
	}

	const transactions = writable<Transfer[]>([]); // Store for transactions

	let sankeyChart = new SankeyChart();

	$: weiValue = ethers.parseEther($ethValue.toString()).toString();
	$: $value = weiValue;

	// Computed property to determine if the Generate button should be enabled
	$: isGenerateDisabled = !$fromUsername || !$toUsername || $ethValue === 0;

	function convertBigIntsToStrings(obj: any): any {
		if (typeof obj === 'bigint') {
			return obj.toString();
		} else if (Array.isArray(obj)) {
			return obj.map(convertBigIntsToStrings);
		} else if (typeof obj === 'object' && obj !== null) {
			return Object.keys(obj).reduce((acc, key) => {
				acc[key] = convertBigIntsToStrings(obj[key]);
				return acc;
			}, {} as any);
		} else {
			return obj;
		}
	}

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
		console.log('Nodes:', nodes);
		console.log('Links:', links);
		const data = [
			{
				type: 'sankey',
				orientation: 'h',
				node: {
					pad: 15,
					thickness: 30,
					line: { color: 'black', width: 0.5 },
					label: nodes.map((node: any) => node.name),
					color: nodes.map((node: any) => node.color || '#DF6552')
				},
				link: {
					source: links.map((link: any) => link.source),
					target: links.map((link: any) => link.target),
					value: links.map((link: any) => link.value),
					label: links.map((link: any) => link.label + ' CRC'),
					color: links.map((link: any) => link.color || 'grey'),
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
			font: { size: 10 }
		};

		const config = {
			displayModeBar: false // Hide the toolbar
		};

		plotly.newPlot('sankeyDiagram', data, layout, config);
	}

	async function generateChartFromLogs(logs: any[]) {
		const sankeyData = await sankeyChart.generateSankeyDataFromLogs(logs);
		drawChart(sankeyData);
	}

	onMount(async () => {
		plotly = (await import('plotly.js-dist-min')).default;

		// Fetch recent transactions
		const provider = new ethers.JsonRpcProvider('https://rpc.helsinki.aboutcircles.com');
		const contractAddress = '0x29b9a7fBb8995b2423a71cC17cf9810798F6C543';
		const hubContract = new ethers.Contract(contractAddress, hubAbi, provider);
		const tokenInterface = new ethers.Interface(tokenAbi);

		async function getRecentTransactions(fromBlock: number, toBlock: number) {
			const filter = hubContract.filters.HubTransfer();
			const events = await hubContract.queryFilter(filter, fromBlock, toBlock);

			const transfers: Transfer[] = await Promise.all(
				events.map(async (event) => {
					const receipt = await provider.getTransactionReceipt(event.transactionHash);

					if (receipt) {
						// Filter for ERC-20 Transfer events
						const transferEventSignature = ethers.id('Transfer(address,address,uint256)');
						const erc20Transfers = receipt.logs.filter(
							(log) => log.topics[0] === transferEventSignature
						);

						const logs = erc20Transfers.map((log) => {
							const parsedLog = tokenInterface.parseLog(log);
							return parsedLog;
						});

						console.log(
							`Transaction ${event.transactionHash} logs:`,
							convertBigIntsToStrings(logs)
						);

						const { args } = event as ethers.EventLog;
						return {
							from: args?.from,
							to: args?.to,
							amount: args?.amount,
							transactionHash: event.transactionHash,
							logs
						};
					} else {
						return {
							from: '',
							to: '',
							amount: 0,
							transactionHash: event.transactionHash,
							logs: []
						};
					}
				})
			);

			return transfers;
		}

		const latestBlock = await provider.getBlockNumber();
		const recentTransactions = await getRecentTransactions(latestBlock - 10000, latestBlock); // Adjust the block range as needed
		transactions.set(recentTransactions);
	});
</script>

<div class="flex flex-col mx-auto h-full">
	<div class="bg-white p-4 rounded-xl shadow mb-4">
		<h2 class="text-2xl font-bold mb-4">Generate your graph</h2>
		<form on:submit|preventDefault={handleSubmit} class="flex flex-wrap items-end gap-2">
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
			<div class="flex-1 m-1">
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
				<div class="text-xs text-gray-700 mt-1">
					Circles: {$ethValue}
				</div>
			</div>

			<div class="flex">
				<div class="mt-6">
					{#if isGenerateDisabled}
						<button
							type="button"
							class="bg-blue-100 border-2 border-blue-100 font-bold rounded-full text-white px-6 py-2 cursor-not-allowed"
							disabled
						>
							Generate
						</button>
					{:else}
						<button
							type="submit"
							class="bg-secondary-bg-light border-2 border-secondary-bg-light font-bold rounded-full text-white px-6 py-2 hover:bg-blue-700 transition duration-300 ease-in-out"
						>
							Generate
						</button>
					{/if}
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

	<!-- New Recent Transactions section -->
	<div class="bg-white p-4 rounded-xl shadow mb-4">
		<h2 class="text-2xl font-bold mb-4">Recent Transactions</h2>
		<ul>
			{#each $transactions as transaction}
				<li>
					From: {transaction.from} To: {transaction.to} Amount: {ethers.formatEther(
						transaction.amount
					)} TxHash: {transaction.transactionHash}
					<button
						class="bg-white border-2 border-secondary-bg-light font-bold rounded-full text-secondary-bg-light px-6 py-2 hover:bg-gray-100 transition duration-300 ease-in-out mt-2"
						on:click={() => generateChartFromLogs(transaction.logs)}>Generate Chart</button
					>
				</li>
			{/each}
		</ul>
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
		class="fixed inset-0 bg-black bg-opacity-30 backdrop-filter backdrop-blur-sm flex flex-col items-center justify-center"
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
</style>
