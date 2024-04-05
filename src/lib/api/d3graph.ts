/* eslint-disable @typescript-eslint/no-explicit-any */
import { CirclesAPI } from "./gardenApi";
import { RpcApi } from "./rpc";

export class D3Graph {
  private rpcApi: RpcApi;
  private sourceAddress: string;

  constructor(rpcUrl: string, sourceAddress: string) {
    this.rpcApi = new RpcApi(rpcUrl);
    this.sourceAddress = sourceAddress;
  }

  async prepareDataForVisNetwork(): Promise<{ nodes: any[], edges: any[] }> {
    return this.fetchDataForNode(this.sourceAddress);
  }

  async fetchDataForNode(nodeAddress: string): Promise<{ nodes: any[], edges: any[] }> {
    try {
      const trustRelations = await this.rpcApi.getTrustRelations(nodeAddress);
      const nodesMap = new Map<string, any>();
      const edgesSet = new Set<string>();

      // Prepare the list of addresses to fetch avatar URLs for
      const addresses = [nodeAddress, ...Object.keys({
        ...trustRelations.result.trusts,
        ...trustRelations.result.trustedBy
      })];

      // Fetch avatar URLs for these addresses
      // const avatarUrls = await CirclesAPI.getAllAvatarUrls(addresses);

      // Add the source node
      nodesMap.set(nodeAddress, {
        id: nodeAddress,
        shape: "circularImage",
        image: "path/to/default/avatar.png",
        // image: avatarUrls.find(url => url.includes(nodeAddress)) || "path/to/default/avatar.png",
        label: nodeAddress
      });

      for (const address of addresses) {
        // Skip if already processed
        if (address === nodeAddress || nodesMap.has(address)) continue;

        // Add each node with its fetched avatar image
        nodesMap.set(address, {
          id: address,
          shape: "circularImage",
          image: "path/to/default/avatar.png",
          // image: avatarUrls.find(url => url.includes(address)) || "path/to/default/avatar.png",
          label: address
        });

        const edgeKey = [nodeAddress, address].sort().join('-');
        edgesSet.add(edgeKey);
      }

      const nodes = Array.from(nodesMap.values());
      const edges = Array.from(edgesSet).map(key => {
        const [from, to] = key.split('-');
        return { from, to };
      });

      return { nodes, edges };
    } catch (error) {
      throw new Error(`Error preparing data for Vis Network: ${error}`);
    }
  }
}
