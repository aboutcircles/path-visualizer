<script lang="ts">
	import {
		pathVisualizerStore,
		type PathVisualizerState,
		type Transfer
	} from '../../../stores/pathVisualizer';
	import hubAbi from '$lib/abis/Hub.json';
	import { CirclesAPI, type UserData } from '$lib/api/gardenApi';
	import { onDestroy, onMount, afterUpdate } from 'svelte';
	import {
		CirclesData,
		CirclesQuery,
		CirclesRpc,
		type PagedQueryParams,
		type TransactionHistoryRow
	} from '@circles-sdk/data';
	import { ethers, type LogDescription } from 'ethers';
	import { crcToTc } from '@circles/timecircles';

	export let generateChartFromLogs;

	const circlesRpc = new CirclesRpc('https://rpc.helsinki.aboutcircles.com');
	const circlesData = new CirclesData(circlesRpc);

	let pathVisualizerState: PathVisualizerState;
	const unsubscribe = pathVisualizerStore.subscribe((value) => {
		pathVisualizerState = value;
	});

	const DEFAULT_AVATAR = '/default.png';
	let loading = false;
	let transactions: Transfer[] = [];
	let loadMoreTrigger: HTMLElement;
	let observer: IntersectionObserver;

	function truncateAddress(address: string): string {
		return `${address.substring(0, 3)}...${address.substring(address.length - 3)}`;
	}

	async function fetchUserData(address: string): Promise<UserData> {
		const [userData] = await CirclesAPI.fetchUserData([address]);
		return (
			userData || {
				id: address,
				safeAddress: address,
				username: truncateAddress(address),
				avatarUrl: DEFAULT_AVATAR
			}
		);
	}

	const hubTransferQueryParams: PagedQueryParams = {
		namespace: 'CrcV1',
		table: 'HubTransfer',
		columns: [
			'blockNumber',
			'transactionIndex',
			'logIndex',
			'from',
			'to',
			'amount',
			'transactionHash',
			'timestamp'
		],
		sortOrder: 'DESC',
		limit: 10
	};

	const query = new CirclesQuery<any>(circlesRpc, hubTransferQueryParams);

	async function loadMoreTransactions() {
		if (loading) return;
		loading = true;

		const hasResults = await query.queryNextPage();
		if (!hasResults) {
			console.log('The query yielded no results.');
			loading = false;
			return;
		}

		const newTransactions = await Promise.all(
			query.currentPage.results.map(async (result) => {
				const fromUser = await fetchUserData(result.from);
				const toUser = await fetchUserData(result.to);

				return {
					from: result.from,
					to: result.to,
					amount: result.amount,
					transactionHash: result.transactionHash,
					fromUser,
					toUser,
					timestamp: result.timestamp,
					transactionIndex: result.transactionIndex,
					logs: [] // Assuming logs are handled separately if necessary
				} as Transfer;
			})
		);

		transactions = [...transactions, ...newTransactions];

		pathVisualizerStore.update((state) => ({
			...state,
			transactions
		}));
		loading = false;

		// Manually trigger the observer to re-check visibility
		if (loadMoreTrigger && observer) {
			observer.unobserve(loadMoreTrigger);
			observer.observe(loadMoreTrigger);
		}
	}

	async function handleNewEvent(event) {
		if (event.$event === 'CrcV1_HubTransfer') {
			const fromUser = await fetchUserData(event.from);
			const toUser = await fetchUserData(event.to);

			const newTransaction = {
				from: event.from,
				to: event.to,
				amount: event.amount.toString(),
				transactionHash: event.transactionHash,
				fromUser,
				toUser,
				timestamp: event.timestamp,
				transactionIndex: event.transactionIndex,
				logs: [] // Assuming logs are handled separately if necessary
			} as Transfer;

			transactions = [newTransaction, ...transactions];
			pathVisualizerStore.update((state) => ({
				...state,
				transactions
			}));
		}
	}

	onMount(async () => {
		const circlesEvents = await circlesData.subscribeToEvents(); // Subscribe to Circles events

		circlesEvents.subscribe(handleNewEvent);
		await loadMoreTransactions();

		observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting && !loading) {
				loadMoreTransactions();
			}
		});
		if (loadMoreTrigger) {
			observer.observe(loadMoreTrigger);
		}
	});

	afterUpdate(() => {
		// Check if the loadMoreTrigger is still visible and load more if necessary
		if (loadMoreTrigger && observer) {
			const rect = loadMoreTrigger.getBoundingClientRect();
			if (rect.top < window.innerHeight && !loading) {
				loadMoreTransactions();
			}
		}
	});

	const getTransferDetailsQueryParams = (transactionHash: string): PagedQueryParams => ({
		namespace: 'CrcV1',
		table: 'Transfer',
		columns: [
			'blockNumber',
			'transactionIndex',
			'logIndex',
			'from',
			'to',
			'amount',
			'transactionHash',
			'timestamp',
			'tokenAddress'
		],
		filter: [
			{
				Type: 'FilterPredicate',
				FilterType: 'Equals',
				Column: 'transactionHash',
				Value: transactionHash
			}
		],
		sortOrder: 'DESC',
		limit: 1000
	});

	const handleGenerateChart = async (transactionHash: string) => {
		// Fetch logs using CirclesQuery
		const params = getTransferDetailsQueryParams(transactionHash);
		const query = new CirclesQuery<any>(circlesRpc, params);
		const hasResults = await query.queryNextPage();

		if (hasResults) {
			const eventLogs = query.currentPage.results;

			// Assuming the logs are in the expected format for generateChartFromLogs
			await generateChartFromLogs(eventLogs);
		} else {
			console.log('No event logs found for transaction hash:', transactionHash);
		}

		pathVisualizerStore.update((state) => ({ ...state, isSidebarOpen: false }));
	};

	onDestroy(() => {
		unsubscribe();
		if (observer && loadMoreTrigger) {
			observer.unobserve(loadMoreTrigger);
		}
	});
</script>

<div class="bg-white h-full rounded-xl overflow-auto">
	<ul class="mb-6">
		{#each pathVisualizerState.transactions as transaction (transaction.transactionHash)}
			<li class="border rounded-xl m-2 shadow p-2">
				<div>
					{crcToTc(Date.now(), Number(ethers.formatEther(transaction.amount))).toFixed(2)} Circles
				</div>
				<div class="flex items-center">
					<div class="flex items-center">
						<img
							src={transaction.fromUser?.avatarUrl || DEFAULT_AVATAR}
							alt={transaction.fromUser?.username || 'Unknown User'}
							class="w-6 h-6 rounded-full inline-block"
						/>
						{transaction.fromUser?.username || truncateAddress(transaction.from)}
					</div>
					<svg
						class="w-4 h-4 mx-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"
						></path>
					</svg>
					<div class="flex items-center">
						<img
							src={transaction.toUser?.avatarUrl || DEFAULT_AVATAR}
							alt={transaction.toUser?.username || 'Unknown User'}
							class="w-6 h-6 rounded-full inline-block"
						/>
						{transaction.toUser?.username || truncateAddress(transaction.to)}
					</div>
				</div>

				<div>
					{transaction.timestamp ? new Date(transaction.timestamp * 1000).toLocaleString() : 'N/A'}
				</div>
				<div class="flex space-x-2">
					<button
						on:click={() => handleGenerateChart(transaction.transactionHash)}
						class="w-36 mt-2 bg-blue-500 text-white px-2 py-1 rounded-xl text-center hover:bg-blue-600"
					>
						Show Flow
					</button>
					<button
						on:click={() => {
							window.open(`https://gnosisscan.io/tx/${transaction.transactionHash}`, '_blank');
							handleGenerateChart(transaction.transactionHash);
						}}
						class="w-36 mt-2 bg-white text-blue-500 border border-blue-500 px-2 py-1 rounded-xl text-center hover:bg-gray-100"
					>
						Open in Blockexplorer
					</button>
				</div>
			</li>
		{/each}
		<!-- Invisible element to trigger loading more transactions -->
		<div bind:this={loadMoreTrigger} class="invisible h-1"></div>
	</ul>
	{#if loading}
		<div class="text-center py-4">Loading more transactions...</div>
	{/if}
</div>
