import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

interface PathfinderRequestBody {
  method: string;
  params: {
    from: string;
    to: string;
    value: string;
  };
}

interface PathfinderResponse {
  requestedAmount: string;
  flow: unknown;
  transfers: {
    from: string;
    to: string;
    tokenOwner: string;
    value: string;
  }[];
  isValid?: boolean;
}

export const POST: RequestHandler = async ({ request }): Promise<Response> => {
  // Properly destructure based on the actual request body structure
  const { params: { from, to, value } } = await request.json() as PathfinderRequestBody;

  const query = {
    method: 'compute_transfer',
    params: { from, to, value }
  };

  try {
    const response = await fetch('https://pathfinder.circlesubi.id/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      console.error('Failed to fetch from Pathfinder API:', response.status, await response.text());
      throw new Error(`Failed to fetch from Pathfinder API. Status code: ${response.status}`);
    }

    const parsed = await response.json();
    const transformedResponse: PathfinderResponse = {
      requestedAmount: value,
      flow: parsed.result.maxFlowValue,
      transfers: parsed.result.transferSteps.map((step: { from: string; to: string; token_owner: string; value: string; }) => ({
        from: step.from,
        to: step.to,
        tokenOwner: step.token_owner,
        value: step.value
      })),
      isValid: parsed.result.final
    };

    return json(transformedResponse);
  } catch (error: any) {
    console.error('Error processing Pathfinder API request:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred in processing the Pathfinder API request.';
    return json({ error: message }, { status: 500 });
  }
};
