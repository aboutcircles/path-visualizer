import { writable, type Invalidator, type Subscriber, type Unsubscriber } from 'svelte/store';
import { ethers, type LogDescription } from 'ethers';
import type { UserData } from '$lib/api/gardenApi';
import type { SankeyNode, SankeyLink } from '$lib/api/sankey';

export interface Transfer {
  from: string;
  to: string;
  amount: ethers.BigNumberish;
  transactionHash: string;
  logs: LogDescription[];
  fromUser?: UserData;
  toUser?: UserData;
  timestamp?: number;
  transactionIndex?: number;
}

export interface PathVisualizerState {
  transactions: Transfer[];
  fromAddress: string;
  toAddress: string;
  fromUsername: string;
  fromUserAvatar: string;
  toUsername: string;
  toUserAvatar: string;
  value: string;
  isLoading: boolean;
  ethValue: number;
  isContentOpen: boolean;
  isSidebarOpen: boolean;
  isUserSelectOpen: boolean;
  isFullScreen: boolean;
  chartData: { nodes: SankeyNode[]; links: SankeyLink[] };
  clearChart: boolean;
}

const initialState: PathVisualizerState = {
  transactions: [],
  fromAddress: '',
  toAddress: '',
  fromUsername: '',
  fromUserAvatar: '',
  toUsername: '',
  toUserAvatar: '',
  value: '',
  isLoading: false,
  ethValue: 0,
  isContentOpen: true,
  isSidebarOpen: false,
  isUserSelectOpen: true,
  isFullScreen: false,
  chartData: { nodes: [], links: [] },
  clearChart: false
};

const createPathVisualizerStore = (): {
  subscribe: (this: void, run: Subscriber<PathVisualizerState>, invalidate?: Invalidator<PathVisualizerState> | undefined) => Unsubscriber;
  set: (this: void, value: PathVisualizerState) => void;
  update: (this: void, updater: (state: PathVisualizerState) => PathVisualizerState) => void;
  setFromAddress: (fromAddress: string) => void;
  setToAddress: (toAddress: string) => void;
  setFromUsername: (fromUsername: string) => void;
  setToUsername: (toUsername: string) => void;
  setFromUserAvatar: (fromUserAvatar: string) => void;
  setToUserAvatar: (toUserAvatar: string) => void;
  setEthValue: (ethValue: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setChartData: (chartData: { nodes: SankeyNode[]; links: SankeyLink[] }) => void;
  setIsUserSelectOpen: (isUserSelectOpen: boolean) => void;
  setIsContentOpen: (isContentOpen: boolean) => void;
  setIsFullScreen: (isFullScreen: boolean) => void;
  setIsSidebarOpen: (isSidebarOpen: boolean) => void; // Add this line
  setClearChart: (clearChart: boolean) => void;
} => {
  const { subscribe, set, update } = writable<PathVisualizerState>(initialState);

  return {
    subscribe,
    set,
    update,
    setFromAddress: (fromAddress: string) => update(state => ({ ...state, fromAddress })),
    setToAddress: (toAddress: string) => update(state => ({ ...state, toAddress })),
    setFromUsername: (fromUsername: string) => update(state => ({ ...state, fromUsername })),
    setToUsername: (toUsername: string) => update(state => ({ ...state, toUsername })),
    setFromUserAvatar: (fromUserAvatar: string) => update(state => ({ ...state, fromUserAvatar })),
    setToUserAvatar: (toUserAvatar: string) => update(state => ({ ...state, toUserAvatar })),
    setEthValue: (ethValue: number) => update(state => ({ ...state, ethValue })),
    setIsLoading: (isLoading: boolean) => update(state => ({ ...state, isLoading })),
    setChartData: (chartData: { nodes: SankeyNode[]; links: SankeyLink[] }) => update(state => ({ ...state, chartData })),
    setIsUserSelectOpen: (isUserSelectOpen: boolean) => update(state => ({ ...state, isUserSelectOpen })),
    setIsContentOpen: (isContentOpen: boolean) => update(state => ({ ...state, isContentOpen })),
    setIsFullScreen: (isFullScreen: boolean) => update(state => ({ ...state, isFullScreen })),
    setIsSidebarOpen: (isSidebarOpen: boolean) => update(state => ({ ...state, isSidebarOpen })), // Add this line
    setClearChart: (clearChart: boolean) => update(state => ({ ...state, clearChart }))
  };
};

export const pathVisualizerStore = createPathVisualizerStore();
