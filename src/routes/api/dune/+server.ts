import { config } from '$lib/config';
import axios from 'axios';


const apiKey = config.duneApiKey;

interface DuneApiResponse {
  data: any[];
}

export const GET = async ({ url }: { url: URL }): Promise<Response> => {
  const queryId = parseInt(url.searchParams.get('queryId') || '0');
  const limit = parseInt(url.searchParams.get('limit') || '1000');

  try {
    const data = await fetchDuneData(queryId, limit);
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in GET request:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
};

const fetchDuneData = async (queryId: number, limit: number = 1000): Promise<DuneApiResponse> => {
  const url = `https://api.dune.com/api/v1/query/${queryId}/results`;
  const headers = {
    'X-Dune-API-Key': apiKey
  };
  const params = {
    limit: limit
  };

  try {
    const response = await axios.get<DuneApiResponse>(url, { headers, params });
    return response.data;
  } catch (error) {
    console.error('Error fetching data from Dune API:', error);
    throw error;
  }
};
