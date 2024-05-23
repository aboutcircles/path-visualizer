interface TrustEvent {
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
  userAddress: string;
  canSendToAddress: string;
  limit: number;
  cursor: string;
}

interface TrustEventsResponseResult {
  events: TrustEvent[];
}

interface TrustEventsJsonRpcResponse {
  jsonrpc: string;
  result: TrustEventsResponseResult;
  id: number;
}

export class RpcApi {
  private rpcUrl: string = 'https://circles-rpc.aboutcircles.com';

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

  async getTrustEvents(address: string): Promise<TrustEventsJsonRpcResponse> {
    const requestBody = {
      jsonrpc: "2.0",
      method: "circles_queryTrustEvents",
      params: [{
        UserAddress: address
      }],
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

      const data: TrustEventsJsonRpcResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error fetching trust events: ${error.message}`);
      } else {
        throw new Error(`Error fetching trust events: ${String(error)}`);
      }
    }
  }
}
