/**
 * TAP Status command - Show TAP verification status
 */

import chalk from 'chalk';
import ora from 'ora';
import { TAPCredentialManager, TAPRegistry } from '../../tap/index.js';
import { formatError, formatWarning } from '../utils/formatters.js';

export async function tapStatusCommand(): Promise<void> {
  const spinner = ora('Loading TAP status...').start();

  try {
    const isConfigured = await TAPCredentialManager.isConfigured();

    if (!isConfigured) {
      spinner.stop();
      console.log('\n' + chalk.bold('🆔 TAP Status\n'));
      console.log(`  Status: ${chalk.yellow('Not configured')}`);
      console.log('\n' + chalk.gray('Run "clawd verify" to verify your identity.\n'));
      return;
    }

    const status = await TAPCredentialManager.getStatus();
    const agent = await TAPCredentialManager.loadAgent();

    spinner.stop();

    console.log('\n' + chalk.bold('🆔 TAP Status\n'));

    if (status.verified) {
      console.log(`  Status:        ${chalk.green('Verified ✓')}`);
      console.log(`  Agent ID:      ${chalk.cyan(status.agentId)}`);
      console.log(`  Identity:      ${chalk.green(status.identityLevel?.toUpperCase())}`);

      // Check expiry
      if (status.attestationExpires) {
        const expiresAt = new Date(status.attestationExpires);
        const now = new Date();
        const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 30) {
          console.log(`  Expires:       ${chalk.yellow(`${status.attestationExpires.split('T')[0]} (${daysLeft} days - renew soon!)`)}`);
        } else {
          console.log(`  Expires:       ${chalk.gray(`${status.attestationExpires.split('T')[0]} (${daysLeft} days)`)}`);
        }
      }

      // Try to get reputation from registry
      try {
        const registry = new TAPRegistry(status.registryUrl);
        const attestation = await TAPCredentialManager.loadAttestation();

        if (agent && attestation) {
          const verification = await registry.verifyAgent(agent.walletAddress, attestation.attestationJwt);

          if (verification.valid && verification.reputationScore !== undefined) {
            console.log(`  Reputation:    ${chalk.cyan(verification.reputationScore.toFixed(1))}`);
          }
        }
      } catch {
        // Silently fail reputation lookup
      }

      console.log(`  Registry:      ${chalk.gray(status.registryUrl)}`);

    } else {
      console.log(`  Status:        ${chalk.yellow('Not verified')}`);

      if (status.agentId) {
        console.log(`  Agent ID:      ${chalk.cyan(status.agentId)}`);
        console.log(`  ${chalk.gray('(Registered but verification pending or expired)')}`);
      }

      console.log('\n' + formatWarning('Run "clawd verify" to complete verification.'));
    }

    console.log('');

  } catch (error) {
    spinner.fail('Failed to load TAP status');
    console.error(formatError((error as Error).message));
    process.exit(1);
  }
}
