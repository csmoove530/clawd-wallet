/**
 * Status command - Show wallet status
 */

import chalk from 'chalk';
import ora from 'ora';
import { WalletManager } from '../../wallet/manager.js';
import { BalanceChecker } from '../../wallet/balance.js';
import { ConfigManager } from '../../config/manager.js';
import { TransactionHistory } from '../../wallet/history.js';
import { TAPCredentialManager } from '../../tap/index.js';
import { formatCurrency, formatAddress, formatError, formatTimestamp, formatStatus } from '../utils/formatters.js';

export async function statusCommand(): Promise<void> {
  const spinner = ora('Loading wallet status...').start();

  try {
    // Load config
    const config = await ConfigManager.loadConfig();

    // Load wallet
    const walletManager = new WalletManager();
    await walletManager.loadFromKeychain();
    const address = walletManager.getAddress();

    // Check balance
    const balanceChecker = new BalanceChecker(config.wallet.rpcUrl, config.wallet.usdcContract);
    const balance = await balanceChecker.getBalance(address);

    // Get recent transactions
    const history = await TransactionHistory.getHistory(3);

    spinner.stop();

    // Display status
    console.log('\n' + chalk.bold('🦁 CLAWD Wallet Status\n'));

    console.log(chalk.bold('Wallet:'));
    console.log(`  Address: ${chalk.cyan(formatAddress(address, false))}`);
    console.log(`  Network: ${chalk.green(config.wallet.network)}`);

    console.log('\n' + chalk.bold('Balance:'));
    console.log(`  ${chalk.green(formatCurrency(balance.balance, balance.symbol))}`);

    console.log('\n' + chalk.bold('Security Limits:'));
    console.log(`  Max per transaction: ${formatCurrency(config.security.maxTransactionAmount)}`);
    console.log(`  Auto-approve under: ${formatCurrency(config.security.autoApproveUnder)}`);
    console.log(`  Daily limit: ${formatCurrency(config.security.dailyLimit)}`);

    if (history.length > 0) {
      console.log('\n' + chalk.bold('Recent Transactions:'));
      history.forEach(tx => {
        console.log(`  ${formatStatus(tx.status)} ${formatCurrency(tx.amount)} - ${tx.description}`);
        console.log(`    ${chalk.gray(tx.service)} • ${chalk.gray(formatTimestamp(tx.timestamp))}`);
      });
    } else {
      console.log('\n' + chalk.gray('No transactions yet'));
    }

    // TAP Identity Status
    console.log('\n' + chalk.bold('Identity (TAP):'));
    try {
      const tapStatus = await TAPCredentialManager.getStatus();

      if (tapStatus.verified) {
        console.log(`  Status: ${chalk.green('Verified ✓')}`);
        console.log(`  Level: ${chalk.cyan(tapStatus.identityLevel?.toUpperCase())}`);
        if (tapStatus.attestationExpires) {
          const expiresAt = new Date(tapStatus.attestationExpires);
          const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          console.log(`  Expires: ${chalk.gray(`${daysLeft} days`)}`);
        }
      } else if (tapStatus.agentId) {
        console.log(`  Status: ${chalk.yellow('Pending verification')}`);
        console.log(`  ${chalk.gray('Run "clawd verify" to complete')}`);
      } else {
        console.log(`  Status: ${chalk.gray('Not verified')}`);
        console.log(`  ${chalk.gray('Run "clawd verify" for premium access')}`);
      }
    } catch {
      console.log(`  Status: ${chalk.gray('Not configured')}`);
    }

    console.log('\n' + chalk.bold('MCP Server:'));
    console.log(`  Status: ${config.mcp.enabled ? chalk.green('Enabled') : chalk.red('Disabled')}`);
    console.log(`  Log level: ${config.mcp.logLevel}`);

    console.log('');

  } catch (error) {
    spinner.fail('Failed to load status');
    console.error(formatError((error as Error).message));
    process.exit(1);
  }
}
