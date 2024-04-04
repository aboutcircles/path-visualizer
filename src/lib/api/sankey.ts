import { CirclesAPI, type UserData } from "./gardenApi";
import { Pathfinder } from "./pathfinder";
import { ethers } from "ethers";

interface SankeyNode {
  name: string;
  color?: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
  label?: string;
  color?: string;
}

export class SankeyChart {
  private pathfinder: Pathfinder;

  constructor(pathfinderURL: string) {
    this.pathfinder = new Pathfinder(pathfinderURL);
  }

  private async getNames(safes: string[]): Promise<Record<string, string>> {
    const userData = await CirclesAPI.fetchUserData(safes);
    const namesDict: Record<string, string> = {};
    userData.forEach((user: UserData) => {
      namesDict[user.id] = user.username || user.id;
    });
    return namesDict;
  }

  public async generateSankeyData(sourceAddress: string, sinkAddress: string, amount: string): Promise<{ nodes: SankeyNode[], links: SankeyLink[] }> {
    const pathData = await this.pathfinder.getArgsForPath(sourceAddress, sinkAddress, amount);
    const transfers = pathData.data?.directPath?.transfers || [];

    // Here's the key adjustment: Convert Set to Array right away
    const addressSet = new Set(transfers.flatMap(transfer => [transfer.from, transfer.to]));
    const uniqueAddresses = Array.from(addressSet); // Convert Set to Array

    const namesDict = await this.getNames(uniqueAddresses);

    const nodes: SankeyNode[] = uniqueAddresses.map(address => ({ name: namesDict[address] }));
    const links: SankeyLink[] = transfers.map(transfer => ({
      source: uniqueAddresses.indexOf(transfer.from),
      target: uniqueAddresses.indexOf(transfer.to),
      value: parseInt(ethers.formatEther(transfer.value)),
      label: `${namesDict[transfer.tokenOwner]} CRC`,
    }));

    return { nodes, links };
  }
}
