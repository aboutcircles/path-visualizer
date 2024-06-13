interface TrustRelationship {
  [address: string]: number;
}

interface TrustResponseResult {
  user: string;
  trusts: TrustRelationship;
  trustedBy: TrustRelationship;
}

interface JsonRpcResponse {
  jsonrpc: string;
  result: TrustResponseResult;
  id: number;
}

export class RpcApi {
  private rpcUrl: string = 'https://rpc.helsinki.aboutcircles.com';

  async getTrustRelations(address: string): Promise<JsonRpcResponse> {
    const requestBody = {
      jsonrpc: "2.0",
      method: "circles_getTrustRelations",
      params: [address],
      id: 1,
    };

    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`RPC request failed: ${response.status}`);
      }

      const data: JsonRpcResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error fetching trust relations: ${error.message}`);
      } else {
        throw new Error(`Error fetching trust relations: ${String(error)}`);
      }
    }
  }
}
