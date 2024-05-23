<script lang="ts">
	import { get } from 'svelte/store';
	import type { Node, Edge } from '../../../lib/api/d3graph';
	import Graph from '../../graph-explorer/components/Graph.svelte';
	import { createAccountsStore } from './../../../stores/accounts';
	import InitialAccounts from './../InitialAccounts.json';

	const initialAccounts = InitialAccounts;

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

	const steps = {
		0: {
			title: '',
			description: "This is Alice. Alice just signed up to Circles.",
			buttonText: 'Next'
		},
		1: {
			title: 'Alice wants to buy something from a shop that accepts Circles (CRC).',
			description: "Let's see what happens when Alice tries to send CRC to the shop...",
			buttonText: 'Next'
		},
		2: {
			title: 'Now that the Shop trusts Alice, she can send her CRC to the Shop.',
			description: "Click 'Next' to send 50 Alice tokens to the shop.",
			buttonText: 'Send'
		},
		3: {
			title: "The shop can only receive Alice's personal CRC.",
			description: "",
			buttonText: 'Next'
		},
		4: {
			title: 'Alice has spent all her CRC, but now wants to buy more items from the shop.',
			description:
				"To get more CRC, Alice creates 5 fake accounts. Click 'Next' to send all the fake CRC to Alice.",
			buttonText: 'Next'
		},
		5: {
			title:
				'Now Alice has a total Amount of 250 CRC. Let’s see what happens when Alice tries to send them to the shop...',
			description: '',
			buttonText: 'Send'
		},
		error1: {
			errorDescription:
				'The transaction failed because the shop does not trust the issuer of the tokens Alice is trying to send. In Circles, a transaction can only succeed if the recipient trusts the issuer of the tokens.',
			nextAction: "Let's make a trust connection..."
		},
		error5: {
			errorDescription:
				'The transaction failed because the shop does not trust the issuer of the tokens Alice is trying to send. In Circles, a transaction can only succeed if the recipient trusts the issuer of the tokens.',
			finalNote:
				'This is why you should only trust Circles users you know in real life, to ensure they are trustworthy and not "bad actors".',
			buttonText: 'Reset'
		}
	};

	let currentStep = 0;
	const accountsStore = createAccountsStore(JSON.parse(JSON.stringify(initialAccounts))); // Deep copy for initial state

	let graphKey = 0;
	let graphData = transformAccountsToGraphData(get(accountsStore), currentStep === 0);
	let errorMessage = '';

	function transformAccountsToGraphData(data: AccountsData, initialState: boolean = false) {
		const { userMappings, users, organizations } = data;
		let nodes: Node[] = [];
		let edges: Edge[] = [];

		function createLabel(name: string, tokens: Token[], initialState: boolean): string {
			if (initialState) {
				return name;
			}
			const totalAmount = tokens.reduce((sum, token) => sum + token.amount, 0);
			const tokenDetails = tokens
				.map((token) => {
					const tokenOwnerName = userMappings[token.tokenId];
					return `\n${token.amount} ${tokenOwnerName} Token`;
				})
				.join('');

			return `${name} \nTotal: ${totalAmount}${tokenDetails}`;
		}

		users.forEach((user) => {
			const username = userMappings[user.userId];
			const label = createLabel(username, user.tokens, initialState);
			nodes.push({
				id: user.userId,
				label: label,
				image: './default.png'
			});
		});

		organizations.forEach((org) => {
			const orgName = org.name;
			const label = createLabel(orgName, org.tokens, initialState);
			nodes.push({
				id: org.orgId,
				label: label,
				image: './default.png'
			});
		});

		if (!initialState) {
			users.forEach((user) => {
				Object.entries(user.relationships.trusts).forEach(([id, _]) => {
					edges.push({
						id: `${user.userId}-${id}`,
						label: `${userMappings[user.userId]} trusts ${userMappings[id]}`,
						from: user.userId,
						to: id
					});
				});
			});

			organizations.forEach((org) => {
				Object.entries(org.relationships.trusts).forEach(([id, _]) => {
					edges.push({
						id: `${org.orgId}-${id}`,
						label: `${org.name} trusts ${userMappings[id]}`,
						from: org.orgId,
						to: id
					});
				});
			});
		}

		return { nodes, edges };
	}

	function nextStep() {
		console.log(`Moving to next step from currentStep ${currentStep}`);
		switch (currentStep) {
			case 1:
				if (errorMessage) {
					initializeTrustConnection();
				} else {
					currentStep += 1;
					graphData = transformAccountsToGraphData(get(accountsStore), currentStep === 0);
					graphKey += 1;
				}
				break;
			case 3:
				addFakeAccounts();
				break;
			case 4:
				sendAllFakeCrcToAlice();
				break;
			case 5:
				sendAllBalancesFromAliceToShopWithFakeAccounts();
				break;
			default:
				currentStep += 1;
				if (currentStep === 1) {
					addShop();
				}
				graphData = transformAccountsToGraphData(get(accountsStore), currentStep === 0);
				graphKey += 1;
				console.log(`Updated currentStep: ${currentStep}`);
				console.log(`graphData: ${JSON.stringify(graphData)}`);
				break;
		}
	}

	function sendAllBalancesFromAliceToShop() {
		errorMessage = '';
		try {
			const aliceId = Object.keys(get(accountsStore).userMappings).find(
				(key) => get(accountsStore).userMappings[key] === 'Alice'
			);
			const shopId = Object.keys(get(accountsStore).userMappings).find(
				(key) => get(accountsStore).userMappings[key] === 'Shop'
			);
			if (!aliceId) {
				throw new Error('Alice not found in user mappings.');
			}
			if (!shopId) {
				throw new Error('Shop not found in user mappings.');
			}

			const alice = get(accountsStore).users.find((u) => u.userId === aliceId);
			if (!alice) {
				throw new Error('Alice not found among users.');
			}

			let totalAmount = 0;
			alice.tokens.forEach((token) => {
				totalAmount += token.amount;
			});

			accountsStore.sendTokens('Alice', 'Shop', totalAmount);

			graphKey += 1;
			graphData = transformAccountsToGraphData(get(accountsStore));
			currentStep += 1; // Move to the next step after sending balances
		} catch (error) {
			errorMessage = (error as Error).message;
		}
	}

	function sendOnlyAlicesTokensToShop() {
		errorMessage = '';
		try {
			const aliceId = Object.keys(get(accountsStore).userMappings).find(
				(key) => get(accountsStore).userMappings[key] === 'Alice'
			);
			const shopId = Object.keys(get(accountsStore).userMappings).find(
				(key) => get(accountsStore).userMappings[key] === 'Shop'
			);
			if (!aliceId) {
				throw new Error('Alice not found in user mappings.');
			}
			if (!shopId) {
				throw new Error('Shop not found in user mappings.');
			}

			const alice = get(accountsStore).users.find((u) => u.userId === aliceId);
			if (!alice) {
				throw new Error('Alice not found among users.');
			}

			let totalAmount = 0;
			alice.tokens.forEach((token) => {
				if (token.tokenId === aliceId) {
					totalAmount += token.amount;
				}
			});

			if (totalAmount === 0) {
				throw new Error('Alice does not hold any tokens of her own.');
			}

			accountsStore.sendTokens('Alice', 'Shop', totalAmount);

			graphKey += 1;
			graphData = transformAccountsToGraphData(get(accountsStore));
			currentStep += 1; // Move to the next step after sending balances
		} catch (error) {
			errorMessage = (error as Error).message;
		}
	}

	function initializeTrustConnection() {
		errorMessage = '';
		try {
			accountsStore.update((data) => {
				const aliceId = Object.keys(data.userMappings).find(
					(key) => data.userMappings[key] === 'Alice'
				);
				const shopId = Object.keys(data.userMappings).find(
					(key) => data.userMappings[key] === 'Shop'
				);
				if (!aliceId) {
					throw new Error('Alice not found in user mappings.');
				}
				if (!shopId) {
					throw new Error('Shop not found in user mappings.');
				}

				const shop = data.organizations.find((org) => org.orgId === shopId);
				if (!shop) {
					throw new Error('Shop not found among organizations.');
				}

				shop.relationships.trusts[aliceId] = 100;

				return data;
			});

			graphKey += 1;
			graphData = transformAccountsToGraphData(get(accountsStore));
			currentStep += 1; // Move to the next step after establishing trust
		} catch (error) {
			errorMessage = (error as Error).message;
		}
	}

	function addShop() {
		accountsStore.addOrganization('Shop');
	}

	function addFakeAccounts() {
		for (let i = 1; i <= 5; i++) {
			const fakeUserName = `FakeAccount${i}`;
			accountsStore.addUser(fakeUserName);
			accountsStore.update((data) => {
				const aliceId = Object.keys(data.userMappings).find(
					(key) => data.userMappings[key] === 'Alice'
				);
				if (aliceId) {
					const alice = data.users.find((u) => u.userId === aliceId);
					if (alice) {
						const fakeUser = data.users.find(
							(u) =>
								u.userId ===
								Object.keys(data.userMappings).find(
									(key) => data.userMappings[key] === fakeUserName
								)
						);
						if (fakeUser) {
							alice.relationships.trusts[fakeUser.userId] = 100;
							fakeUser.relationships.trustedBy[aliceId] = 100;
						}
					}
				}
				return data;
			});
		}
		graphKey += 1;
		graphData = transformAccountsToGraphData(get(accountsStore));
		currentStep += 1;
		console.log(`Fake accounts added. Updated currentStep: ${currentStep}`);
	}

	function sendAllFakeCrcToAlice() {
		errorMessage = '';
		try {
			accountsStore.update((data) => {
				const aliceId = Object.keys(data.userMappings).find(
					(key) => data.userMappings[key] === 'Alice'
				);
				if (!aliceId) {
					throw new Error('Alice not found in user mappings.');
				}

				data.users.forEach((user) => {
					if (user.userId !== aliceId) {
						user.tokens.forEach((token) => {
							const alice = data.users.find((u) => u.userId === aliceId);
							if (!alice) {
								throw new Error('Alice not found among users.');
							}
							const aliceToken = alice.tokens.find((t) => t.tokenId === token.tokenId);
							if (aliceToken) {
								aliceToken.amount += token.amount;
							} else {
								alice.tokens.push({ tokenId: token.tokenId, amount: token.amount });
							}
							alice.totalBalance += token.amount;
							token.amount = 0;
						});
						user.totalBalance = 0;
					}
				});

				return data;
			});

			graphKey += 1;
			graphData = transformAccountsToGraphData(get(accountsStore));
			currentStep += 1; // Move to the next step after sending balances
			console.log(`All fake CRC sent to Alice. Updated currentStep: ${currentStep}`);
		} catch (error) {
			errorMessage = (error as Error).message;
		}
	}

	function sendAllBalancesFromAliceToShopWithFakeAccounts() {
		errorMessage = '';
		try {
			const aliceId = Object.keys(get(accountsStore).userMappings).find(
				(key) => get(accountsStore).userMappings[key] === 'Alice'
			);
			const shopId = Object.keys(get(accountsStore).userMappings).find(
				(key) => get(accountsStore).userMappings[key] === 'Shop'
			);
			if (!aliceId) {
				throw new Error('Alice not found in user mappings.');
			}
			if (!shopId) {
				throw new Error('Shop not found in user mappings.');
			}

			const alice = get(accountsStore).users.find((u) => u.userId === aliceId);
			if (!alice) {
				throw new Error('Alice not found among users.');
			}

			let totalAmount = 0;
			alice.tokens.forEach((token) => {
				totalAmount += token.amount;
			});

			accountsStore.sendTokens('Alice', 'Shop', totalAmount);

			graphKey += 1;
			graphData = transformAccountsToGraphData(get(accountsStore));
			currentStep += 1; // Move to the next step after trying to send balances
		} catch (error) {
			errorMessage = (error as Error).message;
		}
	}

	function resetState() {
		currentStep = 0;
		errorMessage = '';
		accountsStore.reset(initialAccounts);
		graphData = transformAccountsToGraphData(JSON.parse(JSON.stringify(initialAccounts)), true); // Use deep copy here
		graphKey += 1;
	}
</script>

<div class="flex flex-col mx-full h-full">
	<div class="bg-white p-4 rounded-xl shadow mb-4 h-1/4 flex items-end justify-between">
		<div>
			<h2>{steps[currentStep]?.title}</h2>
			<p>{steps[currentStep]?.description}</p>
			{#if errorMessage}
				<p style="color: red;">{errorMessage}</p>
				{#if currentStep === 1}
					<p>{steps.error1.errorDescription}</p>
					<p>{steps.error1.nextAction}</p>
				{/if}
				{#if currentStep === 5}
					<p>{steps.error5.errorDescription}</p>
					<p>{steps.error5.finalNote}</p>
				{/if}
			{/if}
		</div>
		<div>
			<button
				class="bg-secondary-bg-light border-2 border-secondary-bg-light font-bold rounded-full text-white px-6 py-2 hover:bg-blue-700 transition duration-300 ease-in-out"
				on:click={() => {
					switch (currentStep) {
						case 1:
							if (!errorMessage) {
								sendAllBalancesFromAliceToShop();
							} else {
								initializeTrustConnection();
							}
							break;
						case 2:
							sendOnlyAlicesTokensToShop();
							break;
						case 5:
							if (!errorMessage) {
								sendAllBalancesFromAliceToShopWithFakeAccounts();
							} else {
								resetState();
							}
							break;
						default:
							nextStep();
							break;
					}
				}}
			>
				{errorMessage && currentStep === 5
					? steps.error5.buttonText
					: steps[currentStep]?.buttonText}
			</button>
		</div>
	</div>
	<div class="bg-white p-4 rounded-xl shadow mb-4 h-full">
		{#key graphKey}
			<Graph {graphData} useDagreLayout={true} />
		{/key}
	</div>
</div>

<style>
	.bg-secondary-bg-light {
		background-color: rgb(56 49 139 / var(--tw-bg-opacity));
	}
</style>
