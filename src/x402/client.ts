/**
 * x402 protocol client implementation
 */

import { ethers } from 'ethers';
import type { PaymentDetails } from '../types/index.js';

export interface X402Response {
  status: number;
  headers: Record<string, string>;
  body?: string;
}

export interface PaymentInfo {
  recipient: string;
  amount: string;
  currency: string;
  nonce: string;
  description?: string;
}

export class X402Client {
  /**
   * Make an HTTP request with x402 support
   */
  static async makeRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<X402Response> {
    const response = await fetch(url, options);

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let body: string | undefined;
    if (response.status === 402 || response.ok) {
      try {
        body = await response.text();
      } catch {
        // Body might not be available
      }
    }

    return {
      status: response.status,
      headers,
      body
    };
  }

  /**
   * Parse payment details from WWW-Authenticate header
   * Format: x402 recipient="0x...", amount="1.5", currency="USDC", nonce="...", description="..."
   */
  static parsePaymentHeaders(wwwAuthenticate: string): PaymentInfo | null {
    if (!wwwAuthenticate.startsWith('x402 ')) {
      return null;
    }

    const params = wwwAuthenticate.slice(5); // Remove 'x402 '
    const matches = params.matchAll(/(\w+)="([^"]+)"/g);

    const info: Partial<PaymentInfo> = {};
    for (const match of matches) {
      const [, key, value] = match;
      info[key as keyof PaymentInfo] = value;
    }

    if (!info.recipient || !info.amount || !info.currency || !info.nonce) {
      return null;
    }

    return info as PaymentInfo;
  }

  /**
   * Generate payment proof signature
   */
  static async generatePaymentProof(
    wallet: ethers.HDNodeWallet | ethers.Wallet,
    payment: PaymentDetails
  ): Promise<string> {
    // Create message to sign
    const message = ethers.solidityPackedKeccak256(
      ['address', 'address', 'uint256', 'string', 'string', 'string'],
      [
        wallet.address,
        payment.recipient,
        ethers.parseUnits(payment.amount.toString(), 6), // USDC has 6 decimals
        payment.currency,
        payment.nonce,
        payment.description
      ]
    );

    // Sign the message
    const signature = await wallet.signMessage(ethers.getBytes(message));
    return signature;
  }

  /**
   * Create Authorization header for payment
   */
  static createAuthorizationHeader(
    payer: string,
    recipient: string,
    amount: string,
    currency: string,
    nonce: string,
    signature: string
  ): string {
    return `x402 payer="${payer}", recipient="${recipient}", amount="${amount}", currency="${currency}", nonce="${nonce}", signature="${signature}"`;
  }
}
