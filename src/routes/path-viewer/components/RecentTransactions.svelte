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
	}

	export let transactions: Writable<Transfer[]> = writable([]);
	export let generateChartFromLogs: (logs: LogDescription[]) => void;

	const DEFAULT_AVATAR = '/default.png';

	async function fetchUserData(address: string): Promise<UserData> {
		const [userData] = await CirclesAPI.fetchUserData([address]);
		return (
			userData || {
				id: address,
				safeAddress: address,
				username: address,
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

			// Limit to the most recent 5 events
			const limitedEvents = events.slice(-5);

			const transfers: Transfer[] = await Promise.all(
				limitedEvents.map(async (event) => {
					const receipt = await provider.getTransactionReceipt(event.transactionHash);

					if (receipt) {
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

						// Fetch user data for 'from' and 'to' addresses
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
							toUser
						};
					} else {
						return {
							from: '',
							to: '',
							amount: 0,
							transactionHash: event.transactionHash,
							logs: [],
							fromUser: { id: '', safeAddress: '', username: '', avatarUrl: DEFAULT_AVATAR },
							toUser: { id: '', safeAddress: '', username: '', avatarUrl: DEFAULT_AVATAR }
						};
					}
				})
			);

			transactions.set(transfers);
		}

		const latestBlock = await provider.getBlockNumber();
		await getRecentTransactions(latestBlock - 10000, latestBlock); // Adjust the block range as needed
	});
</script>

<div class="bg-white p-4 rounded-xl shadow mb-4">
	<h2 class="text-2xl font-bold mb-4">Recent Transactions</h2>
	<ul>
		{#each $transactions as transaction (transaction.transactionHash)}
			<li class="mb-2">
				<div>
					From:
					<img
						src={transaction.fromUser?.avatarUrl}
						alt={transaction.fromUser?.username}
						class="w-6 h-6 rounded-full inline-block"
					/>
					{transaction.fromUser?.username}
				</div>
				<div>
					To:
					<img
						src={transaction.toUser?.avatarUrl}
						alt={transaction.toUser?.username}
						class="w-6 h-6 rounded-full inline-block"
					/>
					{transaction.toUser?.username}
				</div>
				<div>Amount: {ethers.formatEther(transaction.amount)} CRC</div>
				<div>TxHash: {transaction.transactionHash}</div>
				<button
					on:click={() => generateChartFromLogs(transaction.logs)}
					class="mt-2 bg-blue-500 text-white px-2 py-1 rounded">Generate Chart</button
				>
			</li>
		{/each}
	</ul>
</div>
