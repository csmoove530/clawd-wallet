/**
 * Config command - Manage configuration
 */

import chalk from 'chalk';
import { ConfigManager } from '../../config/manager.js';
import { AuditLogger } from '../../security/audit.js';
import { formatError, formatSuccess } from '../utils/formatters.js';
import { validatePositiveNumber } from '../utils/validators.js';

export async function configCommand(action: string, key?: string, value?: string): Promise<void> {
  try {
    switch (action) {
      case 'show':
        await showConfig();
        break;

      case 'set':
        if (!key || !value) {
          console.error(formatError('Usage: clawd config set <key> <value>'));
          process.exit(1);
        }
        await setConfig(key, value);
        break;

      case 'get':
        if (!key) {
          console.error(formatError('Usage: clawd config get <key>'));
          process.exit(1);
        }
        await getConfig(key);
        break;

      default:
        console.error(formatError(`Unknown action: ${action}`));
        console.log('Available actions: show, set, get');
        process.exit(1);
    }
  } catch (error) {
    console.error(formatError((error as Error).message));
    process.exit(1);
  }
}

async function showConfig(): Promise<void> {
  const config = await ConfigManager.loadConfig();
  console.log('\n' + chalk.bold('⚙️  Configuration\n'));
  console.log(JSON.stringify(config, null, 2));
  console.log('');
}

async function setConfig(key: string, value: string): Promise<void> {
  const config = await ConfigManager.loadConfig();

  switch (key) {
    case 'max-transaction':
      config.security.maxTransactionAmount = validatePositiveNumber(value);
      break;

    case 'auto-approve-under':
      config.security.autoApproveUnder = parseFloat(value);
      if (isNaN(config.security.autoApproveUnder) || config.security.autoApproveUnder < 0) {
        throw new Error('Value must be a non-negative number');
      }
      break;

    case 'daily-limit':
      config.security.dailyLimit = validatePositiveNumber(value);
      break;

    case 'log-level':
      if (!['debug', 'info', 'warn', 'error'].includes(value)) {
        throw new Error('Log level must be: debug, info, warn, or error');
      }
      config.mcp.logLevel = value as 'debug' | 'info' | 'warn' | 'error';
      break;

    default:
      throw new Error(`Unknown config key: ${key}`);
  }

  await ConfigManager.saveConfig(config);
  await AuditLogger.logAction('config_changed', { key, value });

  console.log(formatSuccess(`\n✓ Set ${key} = ${value}\n`));
}

async function getConfig(key: string): Promise<void> {
  const config = await ConfigManager.loadConfig();

  let value: any;
  switch (key) {
    case 'max-transaction':
      value = config.security.maxTransactionAmount;
      break;
    case 'auto-approve-under':
      value = config.security.autoApproveUnder;
      break;
    case 'daily-limit':
      value = config.security.dailyLimit;
      break;
    case 'log-level':
      value = config.mcp.logLevel;
      break;
    default:
      throw new Error(`Unknown config key: ${key}`);
  }

  console.log(`\n${key} = ${value}\n`);
}
