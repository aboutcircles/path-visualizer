<script lang="ts">
	import { onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { ethers, type LogDescription } from 'ethers';
	import hubAbi from '$lib/abis/Hub.json';
	import tokenAbi from '$lib/abis/Token.json';
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
	export let generateChartFromLogs: (logs: LogDescription[]) => void;

	const DEFAULT_AVATAR = '/default.png';

	function pruneAddress(address: string): string {
		return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
	}

	async function fetchUserData(address: string): Promise<UserData> {
		const [userData] = await CirclesAPI.fetchUserData([address]);
		return (
			userData || {
				id: address,
				safeAddress: address,
				username: pruneAddress(address),
				avatarUrl: DEFAULT_AVATAR
			}
		);
	}

	onMount(async () => {
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

			transactions.set(transfers.slice(0, 5));
		}

		const latestBlock = await provider.getBlockNumber();
		await getRecentTransactions(latestBlock - 10000, latestBlock);
	});
</script>

<div class="bg-white p-4 mb-4 overflow-auto h-full">
	<h2 class="text-2xl font-bold mb-4">Recent Transactions</h2>
	<ul>
		{#each $transactions as transaction (transaction.transactionHash)}
			<li class="mb-2">
				<div>
					From:
					<img
						src={transaction.fromUser?.avatarUrl || DEFAULT_AVATAR}
						alt={transaction.fromUser?.username || 'Unknown User'}
						class="w-6 h-6 rounded-full inline-block"
					/>
					{transaction.fromUser?.username || pruneAddress(transaction.from)}
				</div>
				<div>
					To:
					<img
						src={transaction.toUser?.avatarUrl || DEFAULT_AVATAR}
						alt={transaction.toUser?.username || 'Unknown User'}
						class="w-6 h-6 rounded-full inline-block"
					/>
					{transaction.toUser?.username || pruneAddress(transaction.to)}
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
					on:click={() => generateChartFromLogs(transaction.logs)}
					class="mt-2 bg-blue-500 text-white px-2 py-1 rounded"
				>
					Generate Chart
				</button>
			</li>
		{/each}
	</ul>
</div>
