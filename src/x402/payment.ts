/**
 * x402 payment execution handler
 */

import { ethers } from 'ethers';
import { X402Client } from './client.js';
import { WalletManager } from '../wallet/manager.js';
import { BalanceChecker } from '../wallet/balance.js';
import { TransactionHistory } from '../wallet/history.js';
import { SpendLimits } from '../security/limits.js';
import { AuditLogger } from '../security/audit.js';
import { ConfigManager } from '../config/manager.js';
import type { PaymentDetails, Transaction } from '../types/index.js';

export class PaymentHandler {
  private walletManager: WalletManager;
  private balanceChecker: BalanceChecker | null = null;

  constructor() {
    this.walletManager = new WalletManager();
  }

  /**
   * Initialize payment handler
   */
  async initialize(): Promise<void> {
    await this.walletManager.loadFromKeychain();
    const config = await ConfigManager.loadConfig();
    this.balanceChecker = new BalanceChecker(
      config.wallet.rpcUrl,
      config.wallet.usdcContract
    );
  }

  /**
   * Execute full x402 payment flow
   */
  async executePayment(
    url: string,
    method: string = 'GET',
    body?: string,
    description?: string
  ): Promise<{ success: boolean; response?: any; error?: string; txHash?: string }> {
    try {
      // Step 1: Make initial request
      const initialResponse = await X402Client.makeRequest(url, { method, body });

      // Step 2: Check if payment is required
      if (initialResponse.status !== 402) {
        return {
          success: true,
          response: initialResponse.body ? JSON.parse(initialResponse.body) : null
        };
      }

      // Step 3: Parse payment details
      const wwwAuth = initialResponse.headers['www-authenticate'];
      if (!wwwAuth) {
        return {
          success: false,
          error: 'Payment required but no payment details provided'
        };
      }

      const paymentInfo = X402Client.parsePaymentHeaders(wwwAuth);
      if (!paymentInfo) {
        return {
          success: false,
          error: 'Invalid payment details in response'
        };
      }

      // Step 4: Validate amount
      const amount = parseFloat(paymentInfo.amount);
      const validation = await this.validateAmount(amount);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Step 5: Check balance
      const hasBalance = await this.checkBalance(amount);
      if (!hasBalance) {
        return {
          success: false,
          error: 'Insufficient balance'
        };
      }

      // Step 6: Create payment details
      const paymentDetails: PaymentDetails = {
        recipient: paymentInfo.recipient,
        amount,
        currency: paymentInfo.currency,
        description: description || paymentInfo.description || 'x402 payment',
        nonce: paymentInfo.nonce
      };

      // Step 7: Get wallet and generate signature
      const wallet = this.walletManager.getWallet();
      const signature = await X402Client.generatePaymentProof(wallet, paymentDetails);

      // Step 8: Pre-flight check - verify server will accept payment before transferring
      // Send signature without tx_hash to confirm server is ready to accept
      const preflightAuthHeader = X402Client.createAuthorizationHeader(
        wallet.address,
        paymentDetails.recipient,
        paymentInfo.amount,
        paymentDetails.currency,
        paymentDetails.nonce,
        signature
        // No tx_hash yet - this is just a pre-flight check
      );

      const preflightResponse = await X402Client.makeRequest(url, {
        method,
        body,
        headers: {
          'Authorization': preflightAuthHeader,
          'X-Payment-Preflight': 'true'  // Indicate this is a pre-flight check
        }
      });

      // If server rejects the pre-flight (4xx/5xx errors other than 402), abort before transfer
      if (preflightResponse.status >= 400 && preflightResponse.status !== 402) {
        // Server rejected our payment intent - don't transfer USDC
        return {
          success: false,
          error: `Server rejected payment intent (status ${preflightResponse.status}). No funds transferred.`
        };
      }

      // Step 9: Execute onchain USDC transfer (only after pre-flight succeeds)
      if (!this.balanceChecker) {
        throw new Error('Payment handler not initialized');
      }

      const transferResult = await this.balanceChecker.transferUSDC(
        wallet,
        paymentDetails.recipient,
        amount
      );

      // Step 10: Create authorization header with tx_hash
      const authHeader = X402Client.createAuthorizationHeader(
        wallet.address,
        paymentDetails.recipient,
        paymentInfo.amount,
        paymentDetails.currency,
        paymentDetails.nonce,
        signature,
        transferResult.txHash  // Include tx_hash for onchain verification
      );

      // Step 11: Retry request with payment proof and tx_hash
      const paymentResponse = await X402Client.makeRequest(url, {
        method,
        body,
        headers: {
          'Authorization': authHeader
        }
      });

      // Step 12: Log transaction
      if (paymentResponse.status === 200) {
        const transaction: Transaction = {
          id: transferResult.txHash,  // Use actual tx_hash as ID
          timestamp: Date.now(),
          service: new URL(url).hostname,
          description: paymentDetails.description,
          amount,
          currency: paymentDetails.currency,
          status: 'success'
        };

        await TransactionHistory.addTransaction(transaction);
        await AuditLogger.logAction('payment_executed', {
          url,
          amount,
          txHash: transferResult.txHash,
          service: transaction.service
        });

        return {
          success: true,
          txHash: transferResult.txHash,
          response: paymentResponse.body ? JSON.parse(paymentResponse.body) : null
        };
      }

      // Payment failed
      await AuditLogger.logAction('payment_failed', {
        url,
        amount,
        status: paymentResponse.status
      });

      return {
        success: false,
        error: `Payment failed with status ${paymentResponse.status}`
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Validate transaction amount against limits
   */
  async validateAmount(amount: number): Promise<{ valid: boolean; errors: string[] }> {
    return await SpendLimits.validateTransaction(amount);
  }

  /**
   * Check if wallet has sufficient balance
   */
  async checkBalance(requiredAmount: number): Promise<boolean> {
    if (!this.balanceChecker) {
      throw new Error('Payment handler not initialized');
    }

    const wallet = this.walletManager.getWallet();
    return await this.balanceChecker.hasSufficientBalance(wallet.address, requiredAmount);
  }
}
