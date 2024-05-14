<script lang="ts">
	import { onMount } from 'svelte';
	import type { Node, Edge } from '../../../lib/api/d3graph';
	import Graph from '../../graph-explorer/components/Graph.svelte';
	import accounts from './../Accounts.json';
	import cytoscape from 'cytoscape';

	interface Token {
		tokenId: string;
		amount: number;
	}

	interface User {
		userId: string;
		tokens: Token[];
		relationships: Relationship;
	}

	interface AccountsData {
		userMappings: UserMappings;
		users: User[];
	}

	let graphComponent: Graph | undefined;

	function transformAccountsToGraphData(data: AccountsData) {
		const { userMappings, users } = data;
		let nodes: Node[] = [];
		let edges: Edge[] = [];

		users.forEach((user) => {
			const username = userMappings[user.userId];
			// Map each token to a string "amount User Token", where User is the name of the user who owns the token
			const tokenLabels = user.tokens
				.map((token) => {
					const tokenOwnerName = userMappings[token.tokenId]; // Get the name of the token owner
					return `${token.amount} ${tokenOwnerName} Token`; // Format the label
				})
				.join(', ');
			nodes.push({
				id: user.userId,
				label: `${username} (${tokenLabels})`,
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

		return { nodes, edges };
	}

	let graphData = transformAccountsToGraphData(accounts);

	let addNodeFromJson = (graphData: any) => {
		if (graphComponent && graphComponent.addNodeFromJson) {
			graphComponent.addNodeFromJson(graphData);
		}
	};

	onMount(() => {
		addNodeFromJson(graphData);
	});
</script>

<div class="flex flex-col mx-auto h-full">
	<Graph bind:this={graphComponent} />
</div>
