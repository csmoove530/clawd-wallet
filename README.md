# 🦁 CLAWD Wallet

**Claude's Lightweight Autonomous Wallet for Developers**

Terminal-native x402 payment wallet for Base USDC. Make cryptocurrency payments without leaving your terminal - perfect for developers using Claude Code.

---

## ⚠️ Security Disclaimer

**IMPORTANT: READ BEFORE USE**

CLAWD Wallet is self-custodial cryptocurrency software. You are solely responsible for:

- **Securing your private keys** - Never share your private key with anyone. Anyone with your private key has full access to your funds.
- **Backing up your wallet** - Your private key is stored in your OS keychain. If you lose access to your system, you may lose access to your funds.
- **Testing with small amounts** - Start with small amounts (e.g., $1-5 USDC) to familiarize yourself with the system.
- **Verifying transactions** - Always verify payment details before approving.
- **Keeping software updated** - Use the latest version for security fixes.

**This software is provided "AS IS" without warranty of any kind.** The authors are not responsible for lost funds, security breaches, or damages resulting from use of this software. Use at your own risk.

**Cryptocurrency transactions are irreversible.** Once a payment is made, it cannot be undone. Exercise caution with all transactions.

See [SECURITY.md](SECURITY.md) for security best practices and responsible disclosure information.

---

## What is CLAWD Wallet?

CLAWD Wallet is an MCP (Model Context Protocol) server that enables AI assistants like Claude to make autonomous payments for services using the x402 protocol. It's designed to be:

- **Terminal-native**: Never leave the command line
- **Conversational**: Just say "yes" to approve payments
- **Self-custodial**: Your keys, your control
- **Developer-focused**: Built for coders, by coders

## Features

✅ Self-custodial wallet with OS-native secure key storage
✅ x402 protocol support for Base USDC payments
✅ MCP server integration with Claude Code
✅ Spend limits and security controls
✅ Transaction history and audit logging
✅ Service discovery for x402-enabled APIs
✅ Terminal-native approval flow
✅ **TAP (Trusted Agent Protocol)** - Verified identity for premium merchant access

## Installation

```bash
# Install globally
npm install -g @clawd/x402-wallet-mcp

# Initialize wallet
clawd init

# Fund your wallet (send USDC on Base to the displayed address)

# Configure Claude Code integration
clawd install
```

## Quick Start

### 1. Initialize Wallet

```bash
$ clawd init

🦁 Initializing CLAWD Wallet...

✓ Generated new wallet
✓ Configuration created

✓ Wallet created successfully!

📍 Your wallet address:
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

💰 To fund your wallet:
Send USDC on Base network to the address above
```

### 2. Fund Your Wallet

Send USDC on Base network to your wallet address:
- **Token**: USDC
- **Network**: Base (Chain ID: 8453)
- **Contract**: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

### 3. Check Status

```bash
$ clawd status

🦁 CLAWD Wallet Status

Wallet:
  Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
  Network: base-mainnet

Balance:
  $10.00 USDC

Security Limits:
  Max per transaction: $10.00 USDC
  Auto-approve under: $0.10 USDC
  Daily limit: $50.00 USDC
```

### 4. Configure Claude Code

```bash
$ clawd install

✓ CLAWD Wallet MCP server installed

Next steps:
  1. Restart Claude Code
  2. Try: "Check my CLAWD wallet balance"
```

### 5. Verify Your Identity (Optional)

Get verified for premium merchant access:

```bash
$ clawd verify

🆔 TAP Identity Verification

Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Network: base-mainnet

? Select identity verification level:
  ❯ KYC - Full verification (recommended for most merchants)
    Email - Email verification only (basic access)
    KYB - Business verification (for enterprises)

✓ Registered with TAP registry
  Agent ID: agent_abc123...
  Key ID: key_xyz789...

✓ Identity verified at KYC level

Your verified wallet:
  Agent ID:      agent_abc123def456
  Identity:      KYC (verified)
  Reputation:    50.0 (new user)
  Expires:       2026-01-31

✓ Premium merchants will now accept your payments!
```

### 6. Use with Claude

In Claude Code, try:
- "Check my CLAWD wallet balance"
- "What x402 services are available?"
- "Make a payment to [service URL]"
- "Verify my identity for premium merchants"

## CLI Commands

### `clawd init`
Initialize a new wallet. Generates a keypair and stores it securely in your OS keychain.

### `clawd status`
Show wallet status including address, balance, limits, and recent transactions.

### `clawd balance`
Quick balance check.

### `clawd history [options]`
View transaction history.
- `-l, --limit <number>`: Number of transactions to show (default: 10)
- `-j, --json`: Output as JSON

### `clawd config <action> [key] [value]`
Manage configuration.

**Actions:**
- `show`: Display all configuration
- `set <key> <value>`: Update a setting
- `get <key>`: Get a specific setting

**Available keys:**
- `max-transaction`: Maximum amount per transaction (USDC)
- `auto-approve-under`: Auto-approve threshold (USDC)
- `daily-limit`: Maximum daily spend (USDC)
- `log-level`: Logging level (debug, info, warn, error)

**Example:**
```bash
clawd config set max-transaction 5.00
clawd config set auto-approve-under 0.50
```

### `clawd discover [options]`
Discover available x402 services.
- `-c, --category <category>`: Filter by category
- `-q, --query <query>`: Search query

### `clawd install`
Configure Claude Code integration by adding CLAWD Wallet to MCP servers.

### `clawd uninstall [options]`
Remove Claude Code integration.
- `--remove-wallet`: Also delete wallet and all data (irreversible!)

### `clawd export-key`
Export private key (dangerous operation, requires confirmation).

### `clawd verify [options]`
Verify your identity with TAP (Trusted Agent Protocol) for premium merchant access.

**Options:**
- `-l, --level <level>`: Identity level - `email`, `kyc`, or `kyb` (default: kyc)
- `-n, --name <name>`: Custom agent name
- `--demo`: Use demo verification (no browser OAuth)

**Example:**
```bash
# Full KYC verification (recommended)
clawd verify

# Email-only verification
clawd verify --level email

# Business verification
clawd verify --level kyb --name "Acme Corp Bot"
```

### `clawd tap status`
Show your TAP verification status and reputation score.

```bash
$ clawd tap status

🆔 TAP Status

Status:      ✓ Verified
Agent ID:    agent_abc123def456
Identity:    KYC
Reputation:  72.5
Expires:     2026-01-31
Registry:    https://tap-registry.visa.com/v1
```

## MCP Server Tools

When integrated with Claude Code, Claude can use these tools:

### `x402_payment_request`
Make an x402 payment request to a service.

**Parameters:**
- `url` (required): The x402-enabled API endpoint
- `method`: HTTP method (default: GET)
- `description`: Human-readable payment description
- `maxAmount`: Maximum USDC amount willing to pay
- `body`: Request body for POST requests

### `x402_check_balance`
Get current USDC balance on Base network.

### `x402_get_address`
Get wallet address for receiving funds.

### `x402_transaction_history`
Get recent transaction history.

**Parameters:**
- `limit`: Number of transactions to return (default: 10)

### `x402_discover_services`
Discover available x402 services.

**Parameters:**
- `category`: Filter by category
- `query`: Search query

### `x402_verify_identity`
Start TAP identity verification for premium merchant access.

**Parameters:**
- `level`: Identity level - `email`, `kyc`, or `kyb` (default: kyc)
- `name`: Custom agent name (optional)

**Example response:**
```json
{
  "success": true,
  "status": "verified",
  "agentId": "agent_abc123def456",
  "identityLevel": "kyc",
  "reputationScore": 50.0,
  "message": "Identity verified at KYC level. Premium merchants will now accept your payments."
}
```

### `x402_get_tap_status`
Get current TAP verification status and reputation.

**Example response:**
```json
{
  "success": true,
  "verified": true,
  "agentId": "agent_abc123def456",
  "identityLevel": "kyc",
  "reputationScore": 72.5,
  "attestationExpires": "2026-01-31T00:00:00Z"
}
```

## Security

CLAWD Wallet is designed with security in mind:

### Private Key Storage
- Keys stored in OS-native secure storage (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- Never exposed in logs or config files
- Same security model as SSH keys

### Spend Limits
- **Per-transaction maximum**: Prevent large unauthorized payments
- **Daily limit**: Cap total daily spending
- **Auto-approve threshold**: Small amounts can be auto-approved

### Audit Logging
- All actions logged to `~/.clawd/audit.log`
- Immutable append-only log
- Tracks approvals, executions, failures

### Configuration
Security settings in `~/.clawd/config.json`:

```json
{
  "security": {
    "maxTransactionAmount": 10.0,
    "autoApproveUnder": 0.1,
    "dailyLimit": 50.0
  }
}
```

## Verified Identity with TAP

### The Problem

AI agents making payments face a trust problem:

- **Merchants can't distinguish** between legitimate AI assistants and malicious bots
- **No accountability** - anonymous wallets can spam or abuse services
- **Premium services locked** - high-value APIs require identity verification
- **No reputation system** - good agents can't build trust over time

### The Solution: TAP (Trusted Agent Protocol)

TAP extends Visa's Trusted Agent Protocol to wallet-based identity, enabling:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  AI Agent       │      │  TAP Registry   │      │  Merchant       │
│  (CLAWD Wallet) │      │  (Visa)         │      │  (x402 Server)  │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │ 1. Register wallet     │                        │
         │───────────────────────>│                        │
         │                        │                        │
         │ 2. Verify identity     │                        │
         │   (email/KYC/KYB)      │                        │
         │───────────────────────>│                        │
         │                        │                        │
         │ 3. Receive attestation │                        │
         │<───────────────────────│                        │
         │   (signed JWT)         │                        │
         │                        │                        │
         │ 4. Payment request with TAP headers             │
         │─────────────────────────────────────────────────>
         │   X-PAYMENT: ...                                │
         │   X-TAP-ATTESTATION: eyJ...                     │
         │   X-TAP-SIGNATURE: ...                          │
         │                        │                        │
         │                        │ 5. Verify attestation  │
         │                        │<───────────────────────│
         │                        │                        │
         │                        │ 6. Return identity     │
         │                        │───────────────────────>│
         │                        │   level + reputation   │
         │                        │                        │
         │ 7. Payment accepted                             │
         │<─────────────────────────────────────────────────
```

### Identity Levels

| Level | Verification | Use Case |
|-------|--------------|----------|
| `anonymous` | Wallet signature only | Basic x402 services |
| `email` | Email verification | Most APIs |
| `kyc` | Full KYC (recommended) | Premium services, higher limits |
| `kyb` | Business verification | Enterprise APIs |

### Quick Start

```bash
# Verify your identity (one-time setup)
clawd verify --level kyc

# Check your TAP status anytime
clawd tap status
```

That's it. Once verified, TAP headers are **automatically included** in all x402 payments.

### How TAP Headers Work

When you make a payment, CLAWD automatically adds:

```http
POST /api/premium-data HTTP/1.1
X-PAYMENT: eyJzY2hlbWUiOiJleGFjdCIsIm5ldHdvcmsiOiJiYXNlIi4uLn0=
X-TAP-ATTESTATION: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
X-TAP-SIGNATURE: sig1=:MEUCIQDx...
X-TAP-KEY-ID: key_abc123
```

Merchants verify these headers to:
- Confirm your identity level meets their requirements
- Check your reputation score
- Decide whether to accept the payment

### Reputation System

Your reputation score (0-100) is based on:

| Factor | Impact |
|--------|--------|
| Successful transactions | +0.1 per transaction |
| Unique merchants | +0.5 per new merchant |
| Transaction volume | Logarithmic bonus |
| Disputes | -10.0 per dispute |
| Chargebacks | -25.0 per chargeback |

New users start at **50.0** (neutral). Premium merchants may require scores above 60 or 70.

### Benefits for Developers

**Without TAP:**
```
Payment rejected: Merchant requires identity verification
```

**With TAP:**
```
✓ Payment accepted ($0.05 USDC)
✓ Identity: KYC verified
✓ Reputation: 72.5
```

### Privacy Considerations

- TAP attestations contain **identity level**, not personal data
- Merchants see "KYC verified" but not your name/email
- You control which services receive your attestation
- Attestations expire (default: 1 year) and can be revoked

## Architecture

```
┌─────────────────┐
│   Claude Code   │
│                 │
│  ┌───────────┐  │
│  │  Claude   │  │
│  │  (Agent)  │  │
│  └─────┬─────┘  │
│        │        │
└────────┼────────┘
         │ MCP Protocol
         │
┌────────▼────────────────────────┐
│  CLAWD Wallet MCP Server        │
│  ┌──────────────────────────┐  │
│  │ x402 Protocol Client     │  │
│  │ • Payment flow           │  │
│  │ • Signature generation   │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Wallet Manager           │  │
│  │ • Key management         │  │
│  │ • Balance checking       │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ TAP Identity             │  │
│  │ • Agent registration     │  │
│  │ • Attestation signing    │  │
│  │ • Reputation tracking    │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Security & Limits        │  │
│  │ • Spend validation       │  │
│  │ • Audit logging          │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌─────────────────────┐
│ macOS   │ │ TAP Registry (Visa) │
│ Keychain│ │ • Identity verify   │
│         │ │ • Reputation store  │
└─────────┘ └─────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│  Base Network                   │
│  (USDC Payments)                │
└─────────────────────────────────┘
```

## How It Works

1. **Claude proposes a payment**: When Claude needs to call a paid API, it uses the `x402_payment_request` tool
2. **Initial request**: CLAWD makes an HTTP request to the service
3. **402 Payment Required**: Service responds with payment details
4. **Validation**: CLAWD checks spend limits and balance
5. **Approval** (if needed): User approves in terminal with `Y/n`
6. **Payment proof**: CLAWD signs a payment proof with the wallet
7. **Retry with proof**: Request is retried with payment authorization
8. **Service responds**: Paid data is returned to Claude
9. **Logging**: Transaction is logged for audit trail

## File Locations

- **Wallet keys**: OS Keychain (macOS Keychain, Windows Credential Manager, etc.)
- **TAP signing key**: OS Keychain (separate from wallet key)
- **TAP credentials**: `~/.clawd/tap/agent.json`, `~/.clawd/tap/attestation.json`
- **Configuration**: `~/.clawd/config.json`
- **Transaction history**: `~/.clawd/history.json`
- **Audit log**: `~/.clawd/audit.log`
- **Claude Code config**: `~/.claude/config.json`

## Advanced Configuration

### Custom x402 Service Registry

By default, CLAWD uses the public x402scan registry at `https://api.x402scan.com` to discover available services. This registry is open and community-maintained.

**To use a custom or self-hosted registry:**

```bash
# Set registry URL
export X402_REGISTRY_URL=https://your-registry.com

# Verify it's working
clawd discover
```

**Make it permanent:**

```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export X402_REGISTRY_URL=https://your-registry.com' >> ~/.bashrc
source ~/.bashrc
```

**Fallback behavior:**
- If the registry API is unavailable, CLAWD falls back to built-in services
- Timeout is 5 seconds per request
- Warnings are logged but the wallet continues to function

**Registry API Endpoints:**
Your custom registry should implement:
- `GET /services?query={query}&category={category}` - List services
- `GET /categories` - List available categories
- `GET /services?url={url}` - Get service by URL

**Use cases for custom registry:**
- Enterprise: Internal service catalog
- Development: Testing new services before public listing
- Privacy: Self-hosted registry for private infrastructure
- Regional: Localized service discovery

### Environment Variables

All available environment variables:

```bash
# Registry configuration
X402_REGISTRY_URL=https://api.x402scan.com  # Default x402 service registry

# TAP configuration
CLAWD_TAP_REGISTRY=https://tap-registry.visa.com/v1  # TAP Registry URL
CLAWD_TAP_DEMO=true                                   # Enable demo verification mode

# Wallet configuration
CLAWD_CONFIG_DIR=~/.clawd                   # Config directory
CLAWD_LOG_LEVEL=info                        # Log level (debug|info|warn|error)
```

## Differentiation from Coinbase Payments MCP

| Feature | Coinbase Payments MCP | CLAWD Wallet |
|---------|----------------------|--------------|
| Setup | Desktop app + email | Pure CLI |
| Wallet | Custodial-lite | Self-custodial |
| Approvals | Desktop GUI | Terminal inline |
| Discovery | GUI Bazaar | CLI + conversational |
| Philosophy | Consumer-friendly | Developer-native |
| Scope | Full-featured | Focused on x402 |

CLAWD Wallet is built for developers who live in the terminal and want transparent, self-custodial payments during AI-assisted coding sessions.

## Troubleshooting

### Wallet not found
```
Error: No wallet found in keychain
```
**Solution**: Run `clawd init` to create a wallet

### Configuration not found
```
Error: Configuration not found
```
**Solution**: Run `clawd init` to initialize

### Insufficient balance
```
Error: Insufficient balance
```
**Solution**: Fund your wallet with USDC on Base network

### MCP server not working
1. Verify installation: `clawd install`
2. Check Claude Code config: `~/.claude/config.json`
3. Restart Claude Code
4. Check MCP server path in config

## Development

### Build from Source

```bash
# Clone repository
git clone https://github.com/clawd/x402-wallet-mcp.git
cd x402-wallet-mcp

# Install dependencies
npm install

# Build
npm run build

# Link locally
npm link

# Test
clawd init
```

### Project Structure

```
clawd-wallet/
├── src/
│   ├── types/          # TypeScript type definitions
│   ├── wallet/         # Wallet management
│   ├── x402/           # x402 protocol client
│   ├── tap/            # TAP (Trusted Agent Protocol)
│   │   ├── credentials.ts  # Credential storage
│   │   ├── keychain.ts     # Ed25519 key management
│   │   ├── registry.ts     # TAP Registry API client
│   │   ├── signing.ts      # RFC 9421 signatures
│   │   └── types.ts        # TAP type definitions
│   ├── mcp-server/     # MCP server implementation
│   ├── cli/            # CLI commands
│   ├── config/         # Configuration management
│   └── security/       # Security & audit logging
├── tests/              # Test files
├── docs/               # Documentation
└── examples/           # Usage examples
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

## Resources

- **x402 Protocol**: https://x402.org
- **x402 Documentation**: https://docs.cdp.coinbase.com/x402
- **MCP Protocol**: https://modelcontextprotocol.io
- **Base Network**: https://base.org
- **Claude Code**: https://claude.ai/code

## Support

- **Issues**: https://github.com/clawd/x402-wallet-mcp/issues
- **Discussions**: https://github.com/clawd/x402-wallet-mcp/discussions
- **x402 Discord**: Join the x402 community

## Roadmap

- [x] **TAP (Trusted Agent Protocol)** - Verified identity for premium merchants
- [ ] Multi-chain support (Solana, other EVMs)
- [ ] Hardware wallet integration
- [ ] Advanced approval rules (domain whitelists, time-based limits)
- [ ] Transaction batching
- [ ] Gas optimization
- [ ] Web dashboard (optional)
- [ ] Native Anthropic integration
- [ ] TAP reputation analytics dashboard
- [ ] Multi-agent TAP delegation (allow sub-agents to use parent identity)

---

Built with ❤️ for developers who love the terminal

🦁 **CLAWD Wallet** - *Don't leave your terminal to make payments*
