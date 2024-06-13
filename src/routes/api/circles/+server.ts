import { json } from '@sveltejs/kit';
import { config } from '$lib/config';

const rpc = 'https://rpc.helsinki.aboutcircles.com';

const isUserSignedUp = async (address: string): Promise<boolean> => {
  const query = {
    jsonrpc: '2.0',
    id: 1,
    method: 'circles_query',
    params: [
      {
        Namespace: 'V_Crc',
        Table: 'Avatars',
        Limit: 10000000,
        Columns: [],
        Filter: [
          {
            Type: 'FilterPredicate',
            FilterType: 'Equals',
            Column: 'avatar',
            Value: address.toLowerCase(),
          },
        ],
        Order: [],
      },
    ],
  };

  try {
    const response = await fetch(rpc, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    const data = await response.json();
    return data.result.rows.length > 0;
  } catch (error) {
    console.error('Error checking user signup:', error);
    return false;
  }
};

export const GET = async ({ request }) => {
  const url = new URL(request.url);
  const address = url.searchParams.get('address');
  if (!address) {
    return json({ error: 'No address provided' }, { status: 400 });
  }

  const isSignedUp = await isUserSignedUp(address);
  return json({ address, isSignedUp });
};
