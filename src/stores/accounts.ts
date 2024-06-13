import { writable, type Writable } from 'svelte/store';

export interface Token {
  tokenId: string;
  amount: number;
}

export interface Relationships {
  trusts: Record<string, number>;
  trustedBy: Record<string, number>;
}

export interface User {
  userId: string;
  totalBalance: number;
  tokens: Token[];
  relationships: Relationships;
}

export interface Organization {
  orgId: string;
  name: string;
  tokens: Token[];
  relationships: Relationships;
}

export interface AccountData {
  userMappings: Record<string, string>;
  users: User[];
  organizations: Organization[];
}

const isUser = (account: User | Organization): account is User =>
  (account as User).userId !== undefined;

const getAddressFromName = (nameOrAddress: string, mappings: Record<string, string>): string => {
  for (const [address, name] of Object.entries(mappings)) {
    if (name.toLowerCase() === nameOrAddress.toLowerCase() || address.toLowerCase() === nameOrAddress.toLowerCase()) {
      return address;
    }
  }
  throw new Error(`Name or address '${nameOrAddress}' not found.`);
};

export const createAccountsStore = (initialData: AccountData): Writable<AccountData> & {
  changeTrust: (fromNameOrAddress: string, toNameOrAddress: string, trustLevel: number) => void;
  sendTokens: (fromNameOrAddress: string, toNameOrAddress: string, amount: number) => void;
  reset: (data: AccountData) => void;
  addUser: (userName: string) => void;
  addOrganization: (orgName: string) => void;
} => {
  const { subscribe, set, update } = writable(initialData);

  return {
    subscribe,
    set,
    update,
    changeTrust: (fromNameOrAddress: string, toNameOrAddress: string, trustLevel: number): void => {
      update(data => {
        const fromId = getAddressFromName(fromNameOrAddress, data.userMappings);
        const toId = getAddressFromName(toNameOrAddress, data.userMappings);

        const fromUser = data.users.find(user => user.userId === fromId) || data.organizations.find(org => org.orgId === fromId);
        const toUser = data.users.find(user => user.userId === toId) || data.organizations.find(org => org.orgId === toId);

        if (fromUser && toUser) {
          if (isUser(fromUser) && !isUser(toUser)) {
            throw new Error(`Users cannot trust organizations.`);
          }

          if (trustLevel === 0) {
            delete fromUser.relationships.trusts[toId];
            if (toUser.relationships.trustedBy) {
              delete toUser.relationships.trustedBy[fromId];
            }
          } else {
            fromUser.relationships.trusts[toId] = trustLevel;
            toUser.relationships.trustedBy[fromId] = trustLevel;
          }
        }
        return data;
      });
    },
    sendTokens: (fromNameOrAddress: string, toNameOrAddress: string, amount: number): void => {
      update(data => {
        const fromId = getAddressFromName(fromNameOrAddress, data.userMappings);
        const toId = getAddressFromName(toNameOrAddress, data.userMappings);

        const fromUser = data.users.find(user => user.userId === fromId);
        const toUser = data.users.find(user => user.userId === toId) || data.organizations.find(org => org.orgId === toId);

        if (!fromUser) {
          throw new Error(`Sender with name or address ${fromNameOrAddress} not found.`);
        }
        if (!toUser) {
          throw new Error(`Recipient with name or address ${toNameOrAddress} not found.`);
        }
        if (fromUser.totalBalance < amount) {
          throw new Error(`Insufficient balance. Available: ${fromUser.totalBalance}, required: ${amount}.`);
        }

        let totalSendableAmount = 0;
        const sendableTokens: Token[] = [];

        for (const token of fromUser.tokens) {
          const tokenIssuerName = data.userMappings[token.tokenId] || 'unknown';
          const recipientTrustsToken = isUser(toUser) || (toUser.relationships.trusts[token.tokenId] && toUser.relationships.trusts[token.tokenId] > 0);

          if (recipientTrustsToken) {
            sendableTokens.push(token);
            totalSendableAmount += token.amount;
          }

          if (totalSendableAmount >= amount) break;
        }

        if (totalSendableAmount < amount) {
          throw new Error(`Recipient trusts a maximum of ${totalSendableAmount} tokens.`);
        }

        let remainingAmount = amount;

        for (const token of sendableTokens) {
          const transferAmount = Math.min(token.amount, remainingAmount);
          token.amount -= transferAmount;
          remainingAmount -= transferAmount;

          const toToken = toUser.tokens.find(t => t.tokenId === token.tokenId);
          if (toToken) {
            toToken.amount += transferAmount;
          } else {
            toUser.tokens.push({ tokenId: token.tokenId, amount: transferAmount });
          }

          if (remainingAmount <= 0) break;
        }

        fromUser.totalBalance -= amount;
        if (isUser(toUser)) {
          toUser.totalBalance += amount;
        }

        return data;
      });
    },
    addUser: (userName: string): void => {
      update(data => {
        const newUserId = `0x${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
        const newUser: User = {
          userId: newUserId,
          totalBalance: 50,
          tokens: [{ tokenId: newUserId, amount: 50 }],
          relationships: { trusts: {}, trustedBy: {} },
        };
        data.userMappings[newUserId] = userName;
        data.users.push(newUser);
        return data;
      });
    },
    addOrganization: (orgName: string): void => {
      update(data => {
        const newOrgId = `0x${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
        const newOrg: Organization = {
          orgId: newOrgId,
          name: orgName,
          tokens: [],
          relationships: { trusts: {}, trustedBy: {} },
        };
        data.userMappings[newOrgId] = orgName;
        data.organizations.push(newOrg);
        return data;
      });
    },
    reset: (data: AccountData): void => {
      set(JSON.parse(JSON.stringify(data))); // Ensure a deep copy of initialData is set
    }
  };
};
