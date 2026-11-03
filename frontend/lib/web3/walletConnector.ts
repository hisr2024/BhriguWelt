/**
 * Web3 Wallet Connector
 *
 * Features:
 * - MetaMask wallet connection
 * - WalletConnect support
 * - Network detection and switching
 * - Account change detection
 * - Transaction signing
 *
 * @author BhriguWelt Team
 * @version 2.0.0
 */

export interface WalletConnection {
  address: string;
  chainId: number;
  provider: EthereumProvider;
  connected: boolean;
}

export interface WalletError {
  code: string;
  message: string;
}

interface EthereumRequest {
  method: string;
  params?: unknown[];
}

interface EthereumProvider {
  request: (args: EthereumRequest) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeAllListeners: (event: string) => void;
  isMetaMask?: boolean;
}

type WalletEventCallback = (data: unknown) => void;

type EthereumWindow = Window & {
  ethereum?: EthereumProvider;
};

export class Web3WalletConnector {
  private static instance: Web3WalletConnector;
  private provider: EthereumProvider | null = null;
  private connection: WalletConnection | null = null;
  private listeners: Map<string, Set<WalletEventCallback>> = new Map();

  private constructor() {
    // Initialize listeners
    this.listeners.set('accountsChanged', new Set());
    this.listeners.set('chainChanged', new Set());
    this.listeners.set('connect', new Set());
    this.listeners.set('disconnect', new Set());
  }

  static getInstance(): Web3WalletConnector {
    if (!Web3WalletConnector.instance) {
      Web3WalletConnector.instance = new Web3WalletConnector();
    }
    return Web3WalletConnector.instance;
  }

  /**
   * Check if MetaMask is installed
   */
  isMetaMaskInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window as EthereumWindow).ethereum?.isMetaMask;
  }

  /**
   * Connect to MetaMask wallet
   */
  async connectMetaMask(): Promise<WalletConnection> {
    if (!this.isMetaMaskInstalled()) {
      throw {
        code: 'METAMASK_NOT_INSTALLED',
        message: 'MetaMask is not installed. Please install MetaMask extension.',
      } as WalletError;
    }

    try {
      const ethereum = (window as EthereumWindow).ethereum;
      if (!ethereum) {
        throw {
          code: 'NO_PROVIDER',
          message: 'No Ethereum provider detected.',
        } as WalletError;
      }

      // Request account access
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw {
          code: 'NO_ACCOUNTS',
          message: 'No accounts found. Please unlock MetaMask.',
        } as WalletError;
      }

      // Get chain ID
      const chainId = await ethereum.request({ method: 'eth_chainId' }) as string;

      this.provider = ethereum;
      this.connection = {
        address: accounts[0]!,
        chainId: parseInt(chainId, 16),
        provider: ethereum,
        connected: true,
      };

      // Setup event listeners
      this.setupEventListeners();

      // Emit connect event
      this.emit('connect', this.connection);

      return this.connection!;
    } catch (error: unknown) {
      const normalizedError = error as { code?: number; message?: string };
      if (normalizedError.code === 4001) {
        throw {
          code: 'USER_REJECTED',
          message: 'User rejected the connection request.',
        } as WalletError;
      }
      throw {
        code: 'CONNECTION_FAILED',
        message: normalizedError.message || 'Failed to connect to MetaMask.',
      } as WalletError;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    if (this.connection) {
      this.removeEventListeners();
      this.connection = null;
      this.provider = null;
      this.emit('disconnect', null);
    }
  }

  /**
   * Get current connection
   */
  getConnection(): WalletConnection | null {
    return this.connection;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.connection !== null && this.connection.connected;
  }

  /**
   * Switch to a specific network
   */
  async switchNetwork(chainId: number): Promise<void> {
    if (!this.provider) {
      throw {
        code: 'NO_PROVIDER',
        message: 'Wallet not connected.',
      } as WalletError;
    }

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: unknown) {
      const normalizedError = error as { code?: number; message?: string };
      if (normalizedError.code === 4902) {
        throw {
          code: 'NETWORK_NOT_ADDED',
          message: 'This network is not added to MetaMask.',
        } as WalletError;
      }
      throw {
        code: 'NETWORK_SWITCH_FAILED',
        message: normalizedError.message || 'Failed to switch network.',
      } as WalletError;
    }
  }

  /**
   * Sign a message
   */
  async signMessage(message: string): Promise<string> {
    if (!this.connection) {
      throw {
        code: 'NOT_CONNECTED',
        message: 'Wallet not connected.',
      } as WalletError;
    }
    if (!this.provider) {
      throw {
        code: 'NO_PROVIDER',
        message: 'Wallet provider not available.',
      } as WalletError;
    }

    try {
      const signature = await this.provider.request({
        method: 'personal_sign',
        params: [message, this.connection.address],
      }) as string;

      return signature;
    } catch (error: unknown) {
      const normalizedError = error as { code?: number; message?: string };
      if (normalizedError.code === 4001) {
        throw {
          code: 'USER_REJECTED_SIGNATURE',
          message: 'User rejected the signature request.',
        } as WalletError;
      }
      throw {
        code: 'SIGNATURE_FAILED',
        message: normalizedError.message || 'Failed to sign message.',
      } as WalletError;
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<string> {
    if (!this.connection) {
      throw {
        code: 'NOT_CONNECTED',
        message: 'Wallet not connected.',
      } as WalletError;
    }
    if (!this.provider) {
      throw {
        code: 'NO_PROVIDER',
        message: 'Wallet provider not available.',
      } as WalletError;
    }

    try {
      const balance = await this.provider.request({
        method: 'eth_getBalance',
        params: [this.connection.address, 'latest'],
      }) as string;

      // Convert from Wei to ETH
      const ethBalance = parseInt(balance, 16) / 1e18;
      return ethBalance.toFixed(4);
    } catch (error: unknown) {
      const normalizedError = error as { message?: string };
      throw {
        code: 'BALANCE_FETCH_FAILED',
        message: normalizedError.message || 'Failed to fetch balance.',
      } as WalletError;
    }
  }

  /**
   * Subscribe to wallet events
   */
  on(event: string, callback: WalletEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from wallet events
   */
  off(event: string, callback: WalletEventCallback): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, data: unknown): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Setup MetaMask event listeners
   */
  private setupEventListeners(): void {
    if (!this.provider) return;

    // Account changes
    this.provider.on('accountsChanged', (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? (args[0] as string[]) : [];
      if (accounts.length === 0) {
        this.disconnect();
      } else if (this.connection) {
        this.connection.address = accounts[0]!;
        this.emit('accountsChanged', accounts[0]);
      }
    });

    // Chain changes
    this.provider.on('chainChanged', (...args: unknown[]) => {
      const chainId = typeof args[0] === 'string' ? args[0] : null;
      if (this.connection && chainId) {
        this.connection.chainId = parseInt(chainId, 16);
        this.emit('chainChanged', this.connection.chainId);
      }
    });

    // Disconnection
    this.provider.on('disconnect', () => {
      this.disconnect();
    });
  }

  /**
   * Remove MetaMask event listeners
   */
  private removeEventListeners(): void {
    if (!this.provider) return;

    this.provider.removeAllListeners('accountsChanged');
    this.provider.removeAllListeners('chainChanged');
    this.provider.removeAllListeners('disconnect');
  }
}

// Export singleton instance
export const walletConnector = Web3WalletConnector.getInstance();

// Network configurations
export const NETWORKS = {
  ETHEREUM_MAINNET: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    blockExplorer: 'https://etherscan.io',
  },
  POLYGON_MAINNET: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
  },
  ETHEREUM_SEPOLIA: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
};
