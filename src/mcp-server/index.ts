#!/usr/bin/env node

/**
 * MCP Server for CLAWD Wallet
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { MCPTools } from './tools.js';

const server = new Server(
  {
    name: 'clawd-wallet',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'x402_payment_request',
        description: 'Make an x402 payment request to a service. Handles the full payment flow including approval and execution.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to make the request to'
            },
            method: {
              type: 'string',
              description: 'HTTP method (GET, POST, etc.)',
              default: 'GET'
            },
            description: {
              type: 'string',
              description: 'Description of the payment'
            },
            maxAmount: {
              type: 'number',
              description: 'Maximum amount willing to pay (in USDC)'
            },
            body: {
              type: 'string',
              description: 'Request body for POST requests'
            }
          },
          required: ['url']
        }
      },
      {
        name: 'x402_check_balance',
        description: 'Check current USDC balance on Base network',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'x402_get_address',
        description: 'Get wallet address for receiving funds',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'x402_transaction_history',
        description: 'Get recent transaction history',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of transactions to return',
              default: 10
            }
          }
        }
      },
      {
        name: 'x402_discover_services',
        description: 'Discover available x402 services',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Filter by category'
            },
            query: {
              type: 'string',
              description: 'Search query'
            }
          }
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'x402_payment_request':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await MCPTools.paymentRequest(args as any), null, 2)
            }
          ]
        };

      case 'x402_check_balance':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await MCPTools.checkBalance(), null, 2)
            }
          ]
        };

      case 'x402_get_address':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await MCPTools.getAddress(), null, 2)
            }
          ]
        };

      case 'x402_transaction_history':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await MCPTools.transactionHistory(args?.limit as number), null, 2)
            }
          ]
        };

      case 'x402_discover_services':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await MCPTools.discoverServices(args?.category as string, args?.query as string), null, 2)
            }
          ]
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: (error as Error).message
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('CLAWD Wallet MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
