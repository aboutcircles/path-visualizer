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

interface TrustRelationship {
	user: string;
	limit: number;
}

interface TrustResponseResult {
	user: string;
	trusts: TrustRelationship[];
	trustedBy: TrustRelationship[];
}

interface JsonRpcResponse {
	jsonrpc: string;
	result: TrustResponseResult;
	id: number;
}

export interface Node {
	id: string;
	label: string;
	shape: string;
	image: string;
}

export interface Edge {
	id: string;
	from: string;
	to: string;
}

export class D3Graph {
	private rpcApi = new RpcApi();
	private defaultAvatarUrl: string = './default.png';

	async fetchDataForNode(nodeAddress: string): Promise<{ nodes: Node[], edges: Edge[] }> {
		nodeAddress = nodeAddress.toLowerCase();
		try {
			const trustRelations: JsonRpcResponse = await this.rpcApi.getTrustRelations(nodeAddress);

			const addresses: string[] = [];
			trustRelations.result.trusts.forEach(entry => addresses.push(entry.user.toLowerCase()));
			trustRelations.result.trustedBy.forEach(entry => addresses.push(entry.user.toLowerCase()));

			if (!addresses.includes(nodeAddress)) {
				addresses.push(nodeAddress);
			}

			// Fetch user data for these addresses
			const userData: UserData[] = await CirclesAPI.fetchUserData(addresses);

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
			const nodes = addresses.map(address => ({
				id: address,
				label: userMap[address]?.username || address,
				shape: 'circularImage',
				image: userMap[address]?.avatarUrl || this.defaultAvatarUrl
			}));

			// Generate edges based on trust relationships
			const edges = [
				...trustRelations.result.trusts.map(entry => ({
					id: `${nodeAddress}-${entry.user.toLowerCase()}`,
					from: nodeAddress,
					to: entry.user.toLowerCase()
				})),
				...trustRelations.result.trustedBy.map(entry => ({
					id: `${entry.user.toLowerCase()}-${nodeAddress}`,
					from: entry.user.toLowerCase(),
					to: nodeAddress
				}))
			];

			return { nodes, edges };
		} catch (error) {
			throw new Error(`Error preparing data for Vis Network: ${error}`);
		}
	}
}
