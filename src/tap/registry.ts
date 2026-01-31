/**
 * TAP Registry API client
 */

import { ethers } from 'ethers';
import * as ed from '@noble/ed25519';
import type {
  TAPIdentityLevel,
  TAPRegistryChallenge,
  TAPRegistrationResponse,
  TAPAgentInfo,
  TAPAttestation,
  TAPVerificationResult
} from './types.js';
import { TAPKeychain } from './keychain.js';
import { TAPCredentialManager } from './credentials.js';

const DEFAULT_REGISTRY_URL = process.env.CLAWD_TAP_REGISTRY || 'https://tap-registry.visa.com/v1';
const CHAIN_ID = 8453; // Base mainnet

export class TAPRegistry {
  private registryUrl: string;

  constructor(registryUrl?: string) {
    this.registryUrl = registryUrl || DEFAULT_REGISTRY_URL;
  }

  /**
   * Generate a new Ed25519 key pair for TAP signing
   */
  async generateKeyPair(): Promise<{ privateKey: Uint8Array; publicKey: string }> {
    const privateKey = ed.utils.randomPrivateKey();
    const publicKey = await ed.getPublicKeyAsync(privateKey);

    return {
      privateKey,
      publicKey: Buffer.from(publicKey).toString('base64')
    };
  }

  /**
   * Get SIWE challenge from registry
   */
  async getChallenge(walletAddress: string): Promise<{ challenge: TAPRegistryChallenge; message: string }> {
    const caip10Address = `eip155:${CHAIN_ID}:${walletAddress.toLowerCase()}`;

    const response = await fetch(`${this.registryUrl}/v1/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: caip10Address,
        chain_id: CHAIN_ID
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get challenge: ${response.statusText}`);
    }

    return response.json() as Promise<{ challenge: TAPRegistryChallenge; message: string }>;
  }

  /**
   * Register agent with TAP registry
   */
  async registerAgent(params: {
    walletAddress: string;
    walletPrivateKey: string;
    name: string;
  }): Promise<{ agentId: string; verificationUrl: string; keyId: string; publicKey: string }> {
    // Generate Ed25519 key pair
    const { privateKey, publicKey } = await this.generateKeyPair();

    // Store private key in keychain
    await TAPKeychain.savePrivateKey(Buffer.from(privateKey).toString('hex'));

    const caip10Address = `eip155:${CHAIN_ID}:${params.walletAddress.toLowerCase()}`;

    // Get SIWE challenge
    const { message: siweMessage } = await this.getChallenge(params.walletAddress);

    // Sign with wallet
    const wallet = new ethers.Wallet(params.walletPrivateKey);
    const walletSignature = await wallet.signMessage(siweMessage);

    // Register with registry
    const response = await fetch(`${this.registryUrl}/v1/agents/register-wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: caip10Address,
        name: params.name,
        public_key: publicKey,
        algorithm: 'ed25519',
        wallet_signature: walletSignature,
        wallet_message: siweMessage
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as { detail?: string };
      throw new Error(error.detail || `Registration failed: ${response.statusText}`);
    }

    const data = await response.json() as TAPRegistrationResponse;

    // Save agent info
    await TAPCredentialManager.saveAgent(
      {
        agentId: data.agent.id,
        keyId: data.agent.keys[0].key_id,
        publicKey,
        registeredAt: new Date().toISOString()
      },
      caip10Address,
      params.name,
      this.registryUrl
    );

    return {
      agentId: data.agent.id,
      verificationUrl: data.verification_url,
      keyId: data.agent.keys[0].key_id,
      publicKey
    };
  }

  /**
   * Complete identity verification (demo mode)
   * In production, this would poll for OAuth completion
   */
  async completeVerificationDemo(agentId: string, level: TAPIdentityLevel): Promise<TAPVerificationResult> {
    const response = await fetch(
      `${this.registryUrl}/v1/agents/${agentId}/verify-demo?level=${level}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as { detail?: string };
      return {
        status: 'failed',
        error: error.detail || 'Verification failed'
      };
    }

    interface VerifyDemoResponse {
      agent: {
        identity: {
          level: TAPIdentityLevel;
          attestation_jwt: string;
          issued_at: string;
          expires_at: string;
        };
      };
    }

    const data = await response.json() as VerifyDemoResponse;

    // Save attestation
    const attestation: TAPAttestation = {
      identityLevel: data.agent.identity.level,
      attestationJwt: data.agent.identity.attestation_jwt,
      issuedAt: data.agent.identity.issued_at,
      expiresAt: data.agent.identity.expires_at,
      issuer: this.registryUrl
    };

    await TAPCredentialManager.saveAttestation(attestation);

    return {
      status: 'verified',
      agentId,
      identityLevel: data.agent.identity.level,
      reputationScore: 50.0 // New user baseline
    };
  }

  /**
   * Verify agent with registry (for merchants)
   */
  async verifyAgent(walletAddress: string, attestation: string): Promise<{
    valid: boolean;
    identityLevel?: TAPIdentityLevel;
    reputationScore?: number;
    error?: string;
  }> {
    const response = await fetch(`${this.registryUrl}/v1/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: walletAddress,
        attestation
      })
    });

    if (!response.ok) {
      return {
        valid: false,
        error: `Verification failed: ${response.statusText}`
      };
    }

    interface VerifyResponse {
      valid: boolean;
      error?: string;
      identity_level?: TAPIdentityLevel;
      reputation?: {
        reputation_score?: number;
      };
    }

    const data = await response.json() as VerifyResponse;

    if (!data.valid) {
      return {
        valid: false,
        error: data.error
      };
    }

    return {
      valid: true,
      identityLevel: data.identity_level,
      reputationScore: data.reputation?.reputation_score
    };
  }

  /**
   * Get reputation from registry
   */
  async getReputation(agentId: string): Promise<{
    totalTransactions: number;
    uniqueMerchants: number;
    disputeRate: number;
    reputationScore: number;
  } | null> {
    try {
      const agent = await TAPCredentialManager.loadAgent();
      const attestation = await TAPCredentialManager.loadAttestation();

      if (!agent || !attestation) {
        return null;
      }

      const result = await this.verifyAgent(agent.walletAddress, attestation.attestationJwt);

      if (!result.valid) {
        return null;
      }

      // The full reputation data comes from the verify endpoint
      return {
        totalTransactions: 0, // Would come from registry
        uniqueMerchants: 0,
        disputeRate: 0,
        reputationScore: result.reputationScore || 0
      };
    } catch {
      return null;
    }
  }
}
