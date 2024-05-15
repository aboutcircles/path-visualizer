<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import type { Node, Edge } from '../../../lib/api/d3graph';
	import Graph from '../../graph-explorer/components/Graph.svelte';
	import accounts from './../Accounts.json';
	import { createAccountsStore } from './../../../stores/accounts';

	interface Token {
		tokenId: string;
		amount: number;
	}

	interface Relationship {
		trusts: { [key: string]: number };
		trustedBy: { [key: string]: number };
	}

	interface User {
		userId: string;
		tokens: Token[];
		relationships: Relationship;
	}

	interface Organization {
		orgId: string;
		name: string;
		tokens: Token[];
		relationships: Relationship;
	}

	interface AccountsData {
		userMappings: { [key: string]: string };
		users: User[];
		organizations: Organization[];
	}

	let data: AccountsData = accounts;
	const accountsStore = createAccountsStore(data);

	let graphKey = 0;
	let graphData = transformAccountsToGraphData(accounts);
	let firstStepCompleted = false;
	let secondStepCompleted = false;
	let errorMessage = '';

	function transformAccountsToGraphData(data: AccountsData) {
		const { userMappings, users, organizations } = data;
		let nodes: Node[] = [];
		let edges: Edge[] = [];

		// Function to create node labels with total amount and individual tokens
		function createLabel(name: string, tokens: Token[]): string {
			const totalAmount = tokens.reduce((sum, token) => sum + token.amount, 0);
			const tokenDetails = tokens
				.map((token) => {
					const tokenOwnerName = userMappings[token.tokenId];
					return `\n${token.amount} ${tokenOwnerName} Token`;
				})
				.join('');

			return `${name} \nTotal: ${totalAmount}${tokenDetails}`;
		}

		// Add user nodes
		users.forEach((user) => {
			const username = userMappings[user.userId];
			const label = createLabel(username, user.tokens);
			nodes.push({
				id: user.userId,
				label: label,
				image: './default.png'
			});

			Object.entries(user.relationships.trusts).forEach(([id, _]) => {
				edges.push({
					id: `${user.userId}-${id}`,
					label: `${username} is trusting ${userMappings[id]}`,
					from: user.userId,
					to: id
				});
			});

			Object.entries(user.relationships.trustedBy).forEach(([id, _]) => {
				edges.push({
					id: `${id}-${user.userId}`,
					label: `${userMappings[id]} is trusting ${username}`,
					from: id,
					to: user.userId
				});
			});
		});

		// Add organization nodes
		organizations.forEach((org) => {
			const orgName = org.name;
			const label = createLabel(orgName, org.tokens);
			nodes.push({
				id: org.orgId,
				label: label,
				image: './default.png'
			});

			Object.entries(org.relationships.trusts).forEach(([id, _]) => {
				edges.push({
					id: `${org.orgId}-${id}`,
					label: `${orgName} is trusting ${userMappings[id]}`,
					from: org.orgId,
					to: id
				});
			});

			// Organizations should not be trusted by anyone, so no edges for trustedBy
		});

		return { nodes, edges };
	}

	function sendAllBalancesToFrank() {
		errorMessage = '';
		try {
			accountsStore.update((data) => {
				const frankId = Object.keys(data.userMappings).find(
					(key) => data.userMappings[key] === 'Frank'
				);
				if (!frankId) {
					throw new Error('Frank not found in user mappings.');
				}

				data.users.forEach((user) => {
					if (user.userId !== frankId) {
						user.tokens.forEach((token) => {
							const frank = data.users.find((u) => u.userId === frankId);
							if (!frank) {
								throw new Error('Frank not found among users.');
							}
							const frankToken = frank.tokens.find((t) => t.tokenId === token.tokenId);
							if (frankToken) {
								frankToken.amount += token.amount;
							} else {
								frank.tokens.push({ tokenId: token.tokenId, amount: token.amount });
							}
							frank.totalBalance += token.amount;
							token.amount = 0;
						});
						user.totalBalance = 0;
					}
				});

				return data;
			});

			// Force a re-render by updating the key and re-initializing graphData
			graphKey += 1;
			graphData = transformAccountsToGraphData(get(accountsStore));
			firstStepCompleted = true;
		} catch (error) {
			errorMessage = (error as Error).message;
		}
	}

	function sendAllBalancesFromFrankToShop() {
		errorMessage = '';
		try {
			const frankId = Object.keys(get(accountsStore).userMappings).find(
				(key) => get(accountsStore).userMappings[key] === 'Frank'
			);
			const shopId = Object.keys(get(accountsStore).userMappings).find(
				(key) => get(accountsStore).userMappings[key] === 'Shop'
			);
			if (!frankId) {
				throw new Error('Frank not found in user mappings.');
			}
			if (!shopId) {
				throw new Error('Shop not found in user mappings.');
			}

			const frank = get(accountsStore).users.find((u) => u.userId === frankId);
			if (!frank) {
				throw new Error('Frank not found among users.');
			}

			let totalAmount = 0;
			frank.tokens.forEach((token) => {
				totalAmount += token.amount;
			});

			accountsStore.sendTokens('Frank', 'Shop', totalAmount);

			// Force a re-render by updating the key and re-initializing graphData
			graphKey += 1;
			graphData = transformAccountsToGraphData(get(accountsStore));
		} catch (error) {
			errorMessage = (error as Error).message;
		} finally {
			secondStepCompleted = true;
		}
	}

	function sendOnlyFranksTokensToShop() {
		errorMessage = '';
		try {
			const frankId = Object.keys(get(accountsStore).userMappings).find(
				(key) => get(accountsStore).userMappings[key] === 'Frank'
			);
			const shopId = Object.keys(get(accountsStore).userMappings).find(
				(key) => get(accountsStore).userMappings[key] === 'Shop'
			);
			if (!frankId) {
				throw new Error('Frank not found in user mappings.');
			}
			if (!shopId) {
				throw new Error('Shop not found in user mappings.');
			}

			const frank = get(accountsStore).users.find((u) => u.userId === frankId);
			if (!frank) {
				throw new Error('Frank not found among users.');
			}

			let totalAmount = 0;
			frank.tokens.forEach((token) => {
				if (token.tokenId === frankId) {
					totalAmount += token.amount;
				}
			});

			if (totalAmount === 0) {
				throw new Error('Frank does not hold any tokens of his own.');
			}

			accountsStore.sendTokens('Frank', 'Shop', totalAmount);

			// Force a re-render by updating the key and re-initializing graphData
			graphKey += 1;
			graphData = transformAccountsToGraphData(get(accountsStore));
		} catch (error) {
			errorMessage = (error as Error).message;
		}
	}
</script>

<div class="flex flex-col mx-full h-full">
	<div class="bg-white p-4 rounded-xl shadow mb-4 h-1/4">
		<h2>
			{firstStepCompleted
				? secondStepCompleted
					? "As you see, the Shop can only receive Frank's personal CRC. Let's send only Frank's token to the Shop."
					: "Let's try to send all CRC Frank holds to the Shop"
				: "Let's send all fake accounts CRC to Frank."}
		</h2>
		<p>
			{firstStepCompleted
				? secondStepCompleted
					? "Frank holds his personal CRC and the CRC from fake accounts. Now, let's send only Frank's tokens to the Shop."
					: "Frank holds all the CRC from fake accounts. Now, let's try sending all the CRC Frank holds to the Shop."
				: "To consolidate all CRC from fake accounts into Frank's account, click the 'Send' button below."}
		</p>
		<button
			on:click={firstStepCompleted
				? secondStepCompleted
					? sendOnlyFranksTokensToShop
					: sendAllBalancesFromFrankToShop
				: sendAllBalancesToFrank}>Send</button
		>
		{#if errorMessage}
			<p style="color: red;">{errorMessage}</p>
		{/if}
	</div>
	<div class="bg-white p-4 rounded-xl shadow mb-4 h-full">
		{#key graphKey}
			<Graph {graphData} useDagreLayout={true} />
		{/key}
	</div>
</div>
