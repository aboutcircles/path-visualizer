import { CirclesAPI } from './gardenApi';
import { RpcApi } from './rpc';
import { Pathfinder } from './pathfinder';

interface UserMap {
	[address: string]: {
		username: string;
		avatarUrl: string;
	};
}

interface UserData {
	safeAddress: string;
	username: string;
	avatarUrl?: string;
}

interface Node {
	id: string;
	label: string;
	shape: string;
	image: string;
}

interface Edge {
	id: string;
	from: string;
	to: string;
}

export class D3Graph {
	private rpcApi = new RpcApi;
	private defaultAvatarUrl: string = './default.png';

	async fetchPathData(pathFromAddress: string, pathToAddress: string): Promise<{ nodes: Node[], edges: Edge[] }> {
		pathFromAddress = pathFromAddress.toLowerCase();
		pathToAddress = pathToAddress.toLowerCase();
		const pathfinder = new Pathfinder;
		const pathResponse = await pathfinder.getArgsForPath(pathFromAddress, pathToAddress, '9999999999999999999999999999999');
		const transferSteps = pathResponse.data?.directPath?.transfers ?? [];

		// Collect all unique addresses involved in the path
		const addresses = new Set<string>();
		transferSteps.forEach(step => {
			addresses.add(step.from);
			addresses.add(step.to);
		});

		// Fetch user data for these addresses
		const userData: UserData[] = await CirclesAPI.fetchUserData(Array.from(addresses));

		// Create a map for quick lookup of username and avatar URL by address
		const userMap: UserMap = userData.reduce((acc: UserMap, user) => {
			acc[user.safeAddress.toLowerCase()] = {
				username: user.username || user.safeAddress.toLowerCase(), // Fallback to address if username is not provided
				avatarUrl: user.avatarUrl || this.defaultAvatarUrl
			};
			return acc;
		}, {});

		// Process transfer steps to match the Node and Edge interface
		const edgeSet = new Set<string>(); // Ensure each edge is unique
		const newEdges: Edge[] = [];
		transferSteps.forEach(step => {
			const edgeId = `${step.from.toLowerCase()}-${step.to.toLowerCase()}`;
			if (!edgeSet.has(edgeId)) {
				edgeSet.add(edgeId);
				newEdges.push({
					id: edgeId,
					from: step.from.toLowerCase(),
					to: step.to.toLowerCase()
				});
			}
		});

		// Generate nodes ensuring uniqueness
		const seenAddresses = new Set<string>();
		const newNodes: Node[] = [];
		Array.from(addresses).forEach(address => {
			address = address.toLowerCase();
			if (!seenAddresses.has(address)) {
				seenAddresses.add(address);
				newNodes.push({
					id: address,
					label: userMap[address]?.username || address,
					shape: 'circularImage',
					image: userMap[address]?.avatarUrl || this.defaultAvatarUrl
				});
			}
		});

		return { nodes: newNodes, edges: newEdges };
	}

	async fetchDataForNode(nodeAddress: string): Promise<{ nodes: Node[], edges: Edge[] }> {
		nodeAddress = nodeAddress.toLowerCase();
		try {
			const trustRelations = await this.rpcApi.getTrustRelations(nodeAddress);

			// Ensure unique addresses
			const addresses = new Set([nodeAddress]);
			Object.keys(trustRelations.result.trusts).forEach(address => addresses.add(address.toLowerCase()));
			Object.keys(trustRelations.result.trustedBy).forEach(address => addresses.add(address.toLowerCase()));

			// Fetch user data for these addresses
			const userData: UserData[] = await CirclesAPI.fetchUserData(Array.from(addresses));

			// Create a map for quick lookup of username and avatar URL by address
			const userMap: UserMap = userData.reduce((acc: UserMap, user) => {
				const safeAddress = user.safeAddress.toLowerCase();
				acc[safeAddress] = {
					username: user.username || safeAddress, // Fallback to address if username is not provided
					avatarUrl: user.avatarUrl || this.defaultAvatarUrl
				};
				return acc;
			}, {});

			// Generate nodes
			const nodes = Array.from(addresses).map(address => ({
				id: address,
				label: userMap[address]?.username || address,
				shape: 'circularImage',
				image: userMap[address]?.avatarUrl || this.defaultAvatarUrl
			}));

			// Generate edges based on trust relationships
			const edges = [
				...Object.keys(trustRelations.result.trusts).map(trustedAddress => ({
					id: `${nodeAddress}-${trustedAddress}`,
					from: nodeAddress,
					to: trustedAddress
				})),
				...Object.keys(trustRelations.result.trustedBy).map(trustingAddress => ({
					id: `${trustingAddress}-${nodeAddress}`,
					from: trustingAddress,
					to: nodeAddress
				}))
			];

			return { nodes, edges };
		} catch (error) {
			throw new Error(`Error preparing data for Vis Network: ${error}`);
		}
	}
}
