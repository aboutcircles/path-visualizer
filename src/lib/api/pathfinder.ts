export interface DirectPathResponse {
  requestedAmount: string;
  flow: string;
  transfers: TransferPathStep[];
  isValid: boolean;
}

interface TransferPathStep {
  from: string;
  to: string;
  tokenOwner: string;
  value: string;
}


export class Pathfinder {
  pathfinderURL: string = '/api/pathfinder';  // Point to the local API endpoint

  async getArgsForPath(from: string, to: string, value: string): Promise<DirectPathResponse> {
    const query = {
      method: 'compute_transfer',
      params: { from, to, value: value.toString() }
    };

    try {
      const response = await fetch(this.pathfinderURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        throw new Error(`Error calling API: ${response.status}`);
      }

      const parsed = await response.json();  // Assume the structure matches the transformed response your proxy returns

      // Directly return the parsed result if it's already in the desired format
      return parsed;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('An unknown error occurred');
      }
    }
  }
}
