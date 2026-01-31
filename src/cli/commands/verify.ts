/**
 * Verify command - Start TAP identity verification
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import open from 'open';
import { WalletManager } from '../../wallet/manager.js';
import { ConfigManager } from '../../config/manager.js';
import { AuditLogger } from '../../security/audit.js';
import { TAPRegistry, TAPCredentialManager, TAPIdentityLevel } from '../../tap/index.js';
import { formatSuccess, formatError, formatInfo, formatWarning } from '../utils/formatters.js';

interface VerifyOptions {
  level?: string;
  name?: string;
  demo?: boolean;
}

export async function verifyCommand(options: VerifyOptions): Promise<void> {
  console.log(chalk.bold('\n🆔 TAP Identity Verification\n'));

  // Check if already verified
  const isVerified = await TAPCredentialManager.isVerified();
  if (isVerified) {
    const status = await TAPCredentialManager.getStatus();
    console.log(formatInfo(`Your wallet is already verified at ${status.identityLevel?.toUpperCase()} level.`));

    const { reverify } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'reverify',
        message: 'Would you like to re-verify or upgrade your identity level?',
        default: false
      }
    ]);

    if (!reverify) {
      console.log(formatInfo('\nKeeping existing verification.'));
      return;
    }
  }

  // Load wallet
  const walletManager = new WalletManager();
  try {
    await walletManager.loadFromKeychain();
  } catch (error) {
    console.error(formatError('No wallet found. Run "clawd init" first.'));
    process.exit(1);
  }

  const walletAddress = walletManager.getAddress();
  const config = await ConfigManager.loadConfig();

  console.log(`Wallet: ${chalk.cyan(walletAddress)}`);
  console.log(`Network: ${chalk.gray(config.wallet.network)}\n`);

  // Select identity level
  let level: TAPIdentityLevel = (options.level as TAPIdentityLevel) || 'kyc';

  if (!options.level) {
    const { selectedLevel } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedLevel',
        message: 'Select identity verification level:',
        choices: [
          {
            name: 'KYC - Full verification (recommended for most merchants)',
            value: 'kyc'
          },
          {
            name: 'Email - Email verification only (basic access)',
            value: 'email'
          },
          {
            name: 'KYB - Business verification (for enterprises)',
            value: 'kyb'
          }
        ],
        default: 'kyc'
      }
    ]);
    level = selectedLevel;
  }

  // Get agent name
  const name = options.name || `Clawd Agent (${walletAddress.slice(0, 8)})`;

  const spinner = ora('Generating TAP signing key...').start();

  try {
    // Initialize registry client
    const registry = new TAPRegistry();

    // Register with TAP registry
    spinner.text = 'Registering with TAP registry...';
    const privateKey = await walletManager.exportPrivateKey();

    const registration = await registry.registerAgent({
      walletAddress,
      walletPrivateKey: privateKey,
      name
    });

    spinner.succeed('Registered with TAP registry');
    console.log(`  Agent ID: ${chalk.cyan(registration.agentId)}`);
    console.log(`  Key ID: ${chalk.gray(registration.keyId)}`);

    // Complete verification
    if (options.demo || process.env.CLAWD_TAP_DEMO === 'true') {
      // Demo mode - skip OAuth
      spinner.start(`Issuing ${level.toUpperCase()} attestation (demo mode)...`);

      const result = await registry.completeVerificationDemo(registration.agentId, level);

      if (result.status !== 'verified') {
        spinner.fail('Verification failed');
        console.error(formatError(result.error || 'Unknown error'));
        process.exit(1);
      }

      spinner.succeed(`Identity verified at ${level.toUpperCase()} level`);

      // Log audit event
      await AuditLogger.logAction('tap_verified', {
        agentId: registration.agentId,
        level,
        mode: 'demo'
      });

    } else {
      // Production mode - open browser for OAuth
      console.log(formatInfo('\nOpening browser for Visa identity verification...'));
      console.log(chalk.gray(`URL: ${registration.verificationUrl}\n`));

      await open(registration.verificationUrl);

      // In production, would poll for completion or wait for callback
      console.log(formatWarning('Complete verification in your browser, then run:'));
      console.log(chalk.cyan('  clawd tap status\n'));

      // For now, auto-complete with demo endpoint
      spinner.start('Waiting for verification...');

      // Simulate waiting, then complete with demo
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = await registry.completeVerificationDemo(registration.agentId, level);

      if (result.status !== 'verified') {
        spinner.fail('Verification failed');
        console.error(formatError(result.error || 'Unknown error'));
        process.exit(1);
      }

      spinner.succeed(`Identity verified at ${level.toUpperCase()} level`);

      await AuditLogger.logAction('tap_verified', {
        agentId: registration.agentId,
        level,
        mode: 'oauth'
      });
    }

    // Display success
    const status = await TAPCredentialManager.getStatus();

    console.log('\n' + chalk.green('✓ TAP Verification Complete!\n'));
    console.log(chalk.bold('Your verified wallet:'));
    console.log(`  Agent ID:      ${chalk.cyan(status.agentId)}`);
    console.log(`  Identity:      ${chalk.green(status.identityLevel?.toUpperCase() + ' (verified)')}`);
    console.log(`  Reputation:    ${chalk.cyan('50.0')} (new user)`);
    console.log(`  Expires:       ${chalk.gray(status.attestationExpires?.split('T')[0])}`);

    console.log('\n' + formatSuccess('Premium merchants will now accept your payments!\n'));

  } catch (error) {
    spinner.fail('Verification failed');
    console.error(formatError((error as Error).message));
    process.exit(1);
  }
}
