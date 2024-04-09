import { ethers } from "ethers";
import { CirclesAPI } from "./gardenApi";
import { RpcApi } from "./rpc";

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
  private rpcApi: RpcApi;
  private sourceAddress: string;
  private defaultAvatarUrl: string = "https://example.com/path/to/default/avatar.png";

  constructor(rpcUrl: string, sourceAddress: string) {
    this.rpcApi = new RpcApi(rpcUrl);
    this.sourceAddress = sourceAddress;
  }

  async fetchDataForNode(nodeAddress: string): Promise<{ nodes: Node[], edges: Edge[] }> {
    try {
      const trustRelations = await this.rpcApi.getTrustRelations(nodeAddress);
      const checksummedNodeAddress = ethers.getAddress(nodeAddress);

      // Ensure unique addresses
      const addresses = new Set([checksummedNodeAddress]);
      Object.keys(trustRelations.result.trusts).forEach(address => addresses.add(ethers.getAddress(address)));
      Object.keys(trustRelations.result.trustedBy).forEach(address => addresses.add(ethers.getAddress(address)));

      // Fetch user data for these addresses
      const userData: UserData[] = await CirclesAPI.fetchUserData(Array.from(addresses));

      // Create a map for quick lookup of username and avatar URL by address
      const userMap: UserMap = userData.reduce((acc: UserMap, user) => {
        const checksumAddress = ethers.getAddress(user.safeAddress);
        acc[checksumAddress] = {
          username: user.username || checksumAddress, // Fallback to address if username is not provided
          avatarUrl: user.avatarUrl || this.defaultAvatarUrl,
        };
        return acc;
      }, {});

      // Generate nodes
      const nodes = Array.from(addresses).map(address => ({
        id: address,
        label: userMap[address]?.username || address,
        shape: "circularImage",
        image: userMap[address]?.avatarUrl || this.defaultAvatarUrl,
      }));

      // Generate edges based on trust relationships
      const edges = [
        ...Object.keys(trustRelations.result.trusts).map(trustedAddress => ({
          id: `${checksummedNodeAddress}-${trustedAddress}`,
          from: checksummedNodeAddress,
          to: ethers.getAddress(trustedAddress),
        })),
        ...Object.keys(trustRelations.result.trustedBy).map(trustingAddress => ({
          id: `${trustingAddress}-${checksummedNodeAddress}`,
          from: ethers.getAddress(trustingAddress),
          to: checksummedNodeAddress,
        })),
      ];

      return { nodes, edges };
    } catch (error) {
      throw new Error(`Error preparing data for Vis Network: ${error}`);
    }
  }
}
