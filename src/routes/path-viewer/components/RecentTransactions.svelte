<script lang="ts">
	import {
		pathVisualizerStore,
		type PathVisualizerState,
		type Transfer
	} from '../../../stores/pathVisualizer';
	import { ethers, type LogDescription } from 'ethers';
	import hubAbi from '$lib/abis/Hub.json';
	import tokenAbi from '$lib/abis/Token.json';
	import { CirclesAPI, type UserData } from '$lib/api/gardenApi';
	import { onDestroy, onMount, afterUpdate } from 'svelte';

	export let generateChartFromLogs;

	let pathVisualizerState: PathVisualizerState;
	const unsubscribe = pathVisualizerStore.subscribe((value) => {
		pathVisualizerState = value;
	});

	const DEFAULT_AVATAR = '/default.png';
	const BLOCK_STEP = 10000; // Number of blocks to scan in each batch
	let fromBlock: number;
	let toBlock: number;
	let loading = false;
	let transactions: Transfer[] = [];
	let loadMoreTrigger: HTMLElement;
	let observer: IntersectionObserver;

	function truncateAddress(address: string): string {
		return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
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

	async function getRecentTransactions(fromBlock: number, toBlock: number): Promise<Transfer[]> {
		const provider = new ethers.JsonRpcProvider('https://rpc.helsinki.aboutcircles.com');
		const contractAddress = '0x29b9a7fBb8995b2423a71cC17cf9810798F6C543';
		const hubContract = new ethers.Contract(contractAddress, hubAbi, provider);
		const tokenInterface = new ethers.Interface(tokenAbi);

		const filter = hubContract.filters.HubTransfer();
		const events = await hubContract.queryFilter(filter, fromBlock, toBlock);

		const transfers: Transfer[] = await Promise.all(
			events.map(async (event) => {
				const receipt = await provider.getTransactionReceipt(event.transactionHash);
				const block = await provider.getBlock(event.blockNumber);

				if (receipt && block) {
					const transferEventSignature = ethers.id('Transfer(address,address,uint256)');
					const erc20Transfers = receipt.logs.filter(
						(log) => log.topics[0] === transferEventSignature
					);

					const logs = erc20Transfers
						.map((log) => {
							try {
								const parsedLog = tokenInterface.parseLog(log);
								return parsedLog;
							} catch {
								return null;
							}
						})
						.filter((log) => log !== null) as LogDescription[];

					const { args } = event as ethers.EventLog;

					const [fromUser, toUser] = await Promise.all([
						fetchUserData(args?.from),
						fetchUserData(args?.to)
					]);

					return {
						from: args?.from,
						to: args?.to,
						amount: args?.amount,
						transactionHash: event.transactionHash,
						logs,
						fromUser,
						toUser,
						timestamp: block.timestamp,
						transactionIndex: event.transactionIndex
					};
				} else {
					return {
						from: '',
						to: '',
						amount: 0,
						transactionHash: event.transactionHash,
						logs: [],
						fromUser: { id: '', safeAddress: '', username: '', avatarUrl: DEFAULT_AVATAR },
						toUser: { id: '', safeAddress: '', username: '', avatarUrl: DEFAULT_AVATAR },
						timestamp: 0,
						transactionIndex: 0
					};
				}
			})
		);

		transfers.sort(
			(a, b) =>
				(b.timestamp || 0) - (a.timestamp || 0) ||
				(b.transactionIndex || 0) - (a.transactionIndex || 0)
		);

		return transfers;
	}

	async function loadMoreTransactions() {
		if (loading) return;
		loading = true;

		const newToBlock = fromBlock - 1;
		const newFromBlock = Math.max(newToBlock - BLOCK_STEP, 0); // Ensuring fromBlock is non-negative
		const newTransactions = await getRecentTransactions(newFromBlock, newToBlock);

		fromBlock = newFromBlock;

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

	onMount(async () => {
		const provider = new ethers.JsonRpcProvider('https://rpc.helsinki.aboutcircles.com');
		toBlock = await provider.getBlockNumber();
		fromBlock = toBlock - BLOCK_STEP;
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

	const handleGenerateChart = async (logs: LogDescription[]) => {
		await generateChartFromLogs(logs);
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
			<li class="border rounded-xl m-2 shadow">
				<div>
					From:
					<img
						src={transaction.fromUser?.avatarUrl || DEFAULT_AVATAR}
						alt={transaction.fromUser?.username || 'Unknown User'}
						class="w-6 h-6 rounded-full inline-block"
					/>
					{transaction.fromUser?.username || truncateAddress(transaction.from)}
				</div>
				<div>
					To:
					<img
						src={transaction.toUser?.avatarUrl || DEFAULT_AVATAR}
						alt={transaction.toUser?.username || 'Unknown User'}
						class="w-6 h-6 rounded-full inline-block"
					/>
					{transaction.toUser?.username || truncateAddress(transaction.to)}
				</div>
				<div>Amount: {Number(ethers.formatEther(transaction.amount)).toFixed(2)} CRC</div>
				<div>
					TxHash:
					<a
						href={`https://gnosisscan.io/tx/${transaction.transactionHash}`}
						target="_blank"
						class="text-blue-500 hover:underline"
					>
						{transaction.transactionHash.substring(0, 10)}...
					</a>
				</div>
				<div>
					Timestamp: {transaction.timestamp
						? new Date(transaction.timestamp * 1000).toLocaleString()
						: 'N/A'}
				</div>
				<button
					on:click={() => handleGenerateChart(transaction.logs)}
					class="mt-2 bg-blue-500 text-white px-2 py-1 rounded"
				>
					Generate Chart
				</button>
			</li>
		{/each}
		<!-- Invisible element to trigger loading more transactions -->
		<div bind:this={loadMoreTrigger} class="invisible h-1"></div>
	</ul>
	{#if loading}
		<div class="text-center py-4">Loading more transactions...</div>
	{/if}
</div>
