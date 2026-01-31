#!/usr/bin/env node

/**
 * CLAWD Wallet CLI
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { statusCommand } from './commands/status.js';
import { balanceCommand } from './commands/balance.js';
import { historyCommand } from './commands/history.js';
import { configCommand } from './commands/config.js';
import { discoverCommand } from './commands/discover.js';
import { installCommand } from './commands/install.js';
import { uninstallCommand } from './commands/uninstall.js';
import { exportKeyCommand } from './commands/export-key.js';
import { verifyCommand } from './commands/verify.js';
import { tapStatusCommand } from './commands/tap-status.js';

const program = new Command();

program
  .name('clawd')
  .description('CLAWD Wallet - Terminal-native x402 payments for developers')
  .version('0.1.0');

// Init command
program
  .command('init')
  .description('Initialize a new CLAWD Wallet')
  .action(async () => {
    await initCommand();
  });

// Status command
program
  .command('status')
  .description('Show wallet status and recent activity')
  .action(async () => {
    await statusCommand();
  });

// Balance command
program
  .command('balance')
  .description('Check USDC balance')
  .action(async () => {
    await balanceCommand();
  });

// History command
program
  .command('history')
  .description('View transaction history')
  .option('-l, --limit <number>', 'Number of transactions to show', '10')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    await historyCommand({
      limit: parseInt(options.limit),
      json: options.json
    });
  });

// Config command
program
  .command('config <action> [key] [value]')
  .description('Manage configuration (actions: show, set, get)')
  .action(async (action, key, value) => {
    await configCommand(action, key, value);
  });

// Discover command
program
  .command('discover')
  .description('Discover available x402 services')
  .option('-c, --category <category>', 'Filter by category')
  .option('-q, --query <query>', 'Search query')
  .action(async (options) => {
    await discoverCommand(options);
  });

// Install command
program
  .command('install')
  .description('Configure Claude Code integration')
  .action(async () => {
    await installCommand();
  });

// Uninstall command
program
  .command('uninstall')
  .description('Remove Claude Code integration')
  .option('--remove-wallet', 'Also remove wallet and all data')
  .action(async (options) => {
    await uninstallCommand(options);
  });

// Export-key command
program
  .command('export-key')
  .description('Export private key (dangerous!)')
  .action(async () => {
    await exportKeyCommand();
  });

// Verify command - TAP identity verification
program
  .command('verify')
  .description('Verify your identity with TAP (Trusted Agent Protocol)')
  .option('-l, --level <level>', 'Identity level: email, kyc, or kyb', 'kyc')
  .option('-n, --name <name>', 'Custom agent name')
  .option('--demo', 'Use demo verification (no browser OAuth)')
  .action(async (options) => {
    await verifyCommand(options);
  });

// TAP subcommands
const tapCommand = program
  .command('tap')
  .description('TAP (Trusted Agent Protocol) management');

tapCommand
  .command('status')
  .description('Show TAP verification status and reputation')
  .action(async () => {
    await tapStatusCommand();
  });

// Error handling
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error: any) {
  if (error.code !== 'commander.help' && error.code !== 'commander.version') {
    console.error(chalk.red('\nError: ' + error.message + '\n'));
    process.exit(1);
  }
}
