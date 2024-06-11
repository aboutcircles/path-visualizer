import { CirclesAPI, type UserData } from "./gardenApi";
import { Pathfinder } from "./pathfinder";
import { ethers } from "ethers";

export interface SankeyNode {
  name: string;
  color?: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: string;
  label?: string;
  color?: string;
}

export interface TransferPathStep {
  from: string;
  to: string;
  tokenOwner: string;
  value: string;
}

export class SankeyChart {
  private pathfinder = new Pathfinder;

  private async getNames(safes: string[]): Promise<Record<string, string>> {
    const userData = await CirclesAPI.fetchUserData(safes);
    const namesDict: Record<string, string> = {};

    userData.forEach((user: UserData) => {
      namesDict[user.safeAddress] = user.username || user.safeAddress;
    });

    safes.forEach(safeAddress => {
      if (!namesDict[safeAddress]) {
        namesDict[safeAddress] = safeAddress;
      }
    });

    return namesDict;
  }

  public async generateSankeyData(sourceAddress: string, sinkAddress: string, amount: string): Promise<{ nodes: SankeyNode[], links: SankeyLink[] }> {
    const pathData = await this.pathfinder.getArgsForPath(sourceAddress, sinkAddress, amount);
    const transfers = pathData.transfers || [];

    const addressSet = new Set(transfers.flatMap(transfer => [transfer.from, transfer.to]));
    const uniqueAddresses = Array.from(addressSet);

    const namesDict = await this.getNames(uniqueAddresses);

    const nodes: SankeyNode[] = uniqueAddresses.map(address => ({ name: namesDict[address] }));
    const links: SankeyLink[] = transfers.map(transfer => ({
      source: uniqueAddresses.indexOf(transfer.from),
      target: uniqueAddresses.indexOf(transfer.to),
      value: (ethers.formatEther(transfer.value)).toString(),
      label: namesDict[transfer.tokenOwner] || transfer.tokenOwner,
    }));

    return { nodes, links };
  }

  public async generateSankeyDataFromLogs(logs: any[]): Promise<{ nodes: SankeyNode[], links: SankeyLink[] }> {
    const transfers: TransferPathStep[] = logs.map(log => ({
      from: log.args[0],
      to: log.args[1],
      value: log.args[2],
      tokenOwner: log.address, // The token address
    }));

    const addressSet = new Set(transfers.flatMap(transfer => [transfer.from, transfer.to]));
    const uniqueAddresses = Array.from(addressSet);

    const namesDict = await this.getNames(uniqueAddresses);

    const nodes: SankeyNode[] = uniqueAddresses.map(address => ({ name: namesDict[address] }));
    const links: SankeyLink[] = transfers.map(transfer => ({
      source: uniqueAddresses.indexOf(transfer.from),
      target: uniqueAddresses.indexOf(transfer.to),
      value: ethers.formatEther(transfer.value).toString(),
      label: namesDict[transfer.tokenOwner] || transfer.tokenOwner,
    }));

    return { nodes, links };
  }
}
