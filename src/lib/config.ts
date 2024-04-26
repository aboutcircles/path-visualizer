import dotenv from 'dotenv';

dotenv.config();

export const config = {
  pathfinderUrl: process.env.PATHFINDER_URL as string,
  circlesHubContract: process.env.CIRCLES_HUB_CONTRACT as string,
  circlesRpcUrl: process.env.CIRCLES_RPC_URL as string,
  amount: process.env.AMOUNT as string,
  duneApiKey: process.env.DUNE_API_KEY as string
};
