// src/lib/DuneApi.ts
import axios from 'axios';

interface DuneApiResponse {
  execution_id: string;
  query_id: number;
  is_execution_finished: boolean;
  state: string;
  submitted_at: string;
  expires_at: string;
  execution_started_at: string;
  execution_ended_at: string;
  result: {
    rows: any[];
    metadata: {
      column_names: string[];
      column_types: string[];
      row_count: number;
      result_set_bytes: number;
      total_row_count: number;
      total_result_set_bytes: number;
      datapoint_count: number;
      pending_time_millis: number;
      execution_time_millis: number;
    };
  };
}

export class DuneApi {
  private baseUrl: string = '/api/dune';

  private async fetchData(queryId: number, limit: number = 1000): Promise<any[]> {
    try {
      const response = await axios.get<DuneApiResponse>(`${this.baseUrl}?queryId=${queryId}&limit=${limit}`);
      return response.data.result.rows;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }


  public async getUserTransactionsToOrgs(): Promise<any[]> {
    return this.fetchData(3664143, 1000);
  }

  public async getUserTransactionsToSelectedBusinesses(): Promise<any[]> {
    return this.fetchData(3664147, 1000);
  }

  public async getOrgSignups(): Promise<any[]> {
    return this.fetchData(3664149, 1000);
  }

  public async getB2bTransactionsPerWeek(): Promise<any[]> {
    return this.fetchData(3664150, 1000);
  }

  public async getDistinctUsersTransactingPerWeek(): Promise<any[]> {
    return this.fetchData(3664151, 1000);
  }

  public async getDistinctUsersTrustingPerWeek(): Promise<any[]> {
    return this.fetchData(3664152, 1000);
  }

  public async getNewUserSignups(): Promise<any[]> {
    return this.fetchData(3664153, 1000);
  }
}
