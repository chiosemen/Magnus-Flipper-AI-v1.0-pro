# Magnus Foundry DevOps

**Your Trading Terminal for Mobile App Deployment**

Think of this like building your own trading terminal for the app: orders in, executions out, all from the cloud.

---

## 📦 What's Inside

This is a complete cloud-based mobile DevOps stack for Magnus Flipper AI, built on:

- **Expo/EAS** – Cloud builds for iOS & Android
- **GitHub Actions** – CI/CD orchestration
- **Sentry** – Crash reporting & monitoring
- **Foundry Pipelines** – Custom YAML-based build orchestration

---

## 🗂️ Folder Structure

```
magnus-foundry-devops/
├── README.md
├── .foundry/
│   ├── foundry.yaml              # Central orchestrator
│   ├── ios-build.yaml            # iOS cloud build pipeline
│   ├── android-build.yaml        # Android cloud build pipeline
│   ├── tunnel.yaml               # Dev tunnel for live testing
│   ├── ota-release.yaml          # Over-the-air update pipeline
│   ├── monitoring.yaml           # Hourly health checks
│   └── crash-reporting.yaml      # Sentry integration
├── .github/
│   └── workflows/
│       ├── mobile-cloud-build.yml         # Triggered on push/manual
│       ├── mobile-ota-release.yml         # OTA deployment workflow
│       ├── mobile-release-tags.yml        # Tag-based releases
│       └── mobile-monitoring-checks.yml   # Scheduled monitoring
└── mobile/
    ├── eas.json                  # EAS build configuration
    ├── App.js                    # App entry point with Sentry
    ├── sentry.properties         # Sentry config (template)
    ├── sentry.expo.js            # Sentry initialization
    └── .env.example              # Environment variable template
```

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** (v18+)
- **pnpm** (or npm/yarn)
- **Expo account** – Sign up at [expo.dev](https://expo.dev)
- **GitHub account** with Actions enabled
- **Sentry account** (optional, for crash reporting)

### 2. Set Up Environment Variables

Copy the template and fill in your values:

```bash
cd mobile
cp .env.example .env
```

Required variables:
- `EXPO_TOKEN` – Get from [expo.dev/settings/access-tokens](https://expo.dev/accounts/[your-account]/settings/access-tokens)
- `EXPO_PUBLIC_SENTRY_DSN` – Get from [sentry.io](https://sentry.io)
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` – From Sentry settings

### 3. Configure GitHub Secrets

In your GitHub repo, go to **Settings → Secrets and variables → Actions** and add:

- `EXPO_TOKEN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

### 4. Install Dependencies

```bash
cd mobile
pnpm install
```

---

## 🏗️ Building Your App

### Cloud Build (iOS/Android)

Trigger from GitHub Actions UI:

1. Go to **Actions** → **Magnus Cloud Mobile Build**
2. Click **Run workflow**
3. Select branch and run

Or automatically on push to `main`:

```bash
git push origin main
```

Builds are executed on:
- **iOS**: macOS Ventura + Xcode 16
- **Android**: Ubuntu Latest

### Local Build (for testing)

```bash
cd mobile
npx eas build -p ios --profile development --local
npx eas build -p android --profile development --local
```

---

## 📡 OTA (Over-The-Air) Updates

Deploy updates **without App Store review** using EAS Update.

### Staging Release

```bash
cd mobile
npx eas update --branch staging --message "Your update message"
```

Or from GitHub Actions:

1. Go to **Actions** → **Magnus OTA Release**
2. Choose `staging` channel
3. Run workflow

### Production Release

```bash
cd mobile
npx eas update --branch production --message "Production update"
```

Or from GitHub Actions:

1. Go to **Actions** → **Magnus OTA Release**
2. Choose `production` channel
3. Run workflow

### Tag-Based Releases

Push a git tag to trigger automatic production OTA:

```bash
git tag mobile-v1.0.0
git push origin mobile-v1.0.0
```

---

## 🔍 Monitoring & Health Checks

### Automated Monitoring

Runs hourly via GitHub Actions (`.github/workflows/mobile-monitoring-checks.yml`):

- **Dependency audit** – Checks for security vulnerabilities
- **Type checking** – Runs linter
- **Expo Doctor** – Validates Expo configuration

View results in **Actions** → **Magnus Mobile Monitoring**

### Manual Health Check

```bash
cd mobile
pnpm audit
pnpm lint
npx expo doctor
```

---

## 🐛 Crash Reporting (Sentry)

### How It Works

1. **App.js** wraps the root component with `withSentry()`
2. Crashes are automatically sent to Sentry
3. Source maps are uploaded during builds for readable stack traces

### Upload Source Maps

Manually upload source maps:

```bash
cd mobile
npx sentry-expo upload-sourcemaps
```

Or trigger from GitHub Actions:

1. Go to **Actions** → **Magnus Cloud Mobile Build**
2. Source maps are uploaded automatically after build

### View Crashes

Go to [sentry.io](https://sentry.io) → Your Project → Issues

---

## 🔧 Development Workflow

### Local Development with Tunnel

Start Expo dev server accessible from any device:

```bash
cd mobile
npx expo start --tunnel
```

This creates a public URL you can scan with Expo Go app.

### Testing on Physical Device

1. Install **Expo Go** app on iOS/Android
2. Run `npx expo start --tunnel`
3. Scan QR code with your device

---

## 📋 Available Pipelines

| Pipeline | File | Trigger | Purpose |
|----------|------|---------|---------|
| **iOS Build** | `.foundry/ios-build.yaml` | Manual | Build iOS app in cloud |
| **Android Build** | `.foundry/android-build.yaml` | Manual | Build Android app in cloud |
| **Dev Tunnel** | `.foundry/tunnel.yaml` | Manual | Start dev server with public URL |
| **OTA Release** | `.foundry/ota-release.yaml` | Manual | Push updates without App Store |
| **Monitoring** | `.foundry/monitoring.yaml` | Hourly | Health checks & audits |
| **Crash Reporting** | `.foundry/crash-reporting.yaml` | Manual | Upload source maps to Sentry |

---

## 🎯 GitHub Actions Workflows

| Workflow | File | Trigger | Description |
|----------|------|---------|-------------|
| **Cloud Build** | `mobile-cloud-build.yml` | Push to main, Manual | Build iOS + Android in parallel |
| **OTA Release** | `mobile-ota-release.yml` | Manual (input: staging/production) | Deploy OTA update |
| **Release Tags** | `mobile-release-tags.yml` | Git tag `mobile-v*` | Auto-deploy to production |
| **Monitoring** | `mobile-monitoring-checks.yml` | Hourly, Manual | Run health checks |

---

## 🛠️ Configuration Files

### `eas.json`

Defines build profiles and OTA channels:

- **development**: Internal builds with simulator support
- **production**: Store-ready builds
- **staging/production channels**: For OTA updates

### `foundry.yaml`

Central orchestrator that defines:

- Project metadata (name, type)
- Cloud machines (iOS: macOS, Android: Ubuntu)
- Pipeline references

### `sentry.expo.js`

Initializes Sentry with:

- DSN from environment variable
- 20% trace sampling
- Auto session tracking

---

## 📦 Creating a Distribution Package

To create a ZIP of this entire setup:

```bash
cd magnus-foundry-devops
zip -r ../magnus-foundry-devops.zip .
```

This creates `magnus-foundry-devops.zip` in the parent directory.

---

## 🔐 Security Best Practices

1. **Never commit secrets** – Use `.env` and GitHub Secrets
2. **Rotate tokens regularly** – Expo and Sentry tokens
3. **Review dependency audits** – Run `pnpm audit` regularly
4. **Monitor Sentry alerts** – Set up notifications for critical errors
5. **Use branch protection** – Require PR reviews for `main`

---

## 🚨 Troubleshooting

### Build Fails on GitHub Actions

1. Check GitHub Secrets are set correctly
2. Verify `EXPO_TOKEN` is valid
3. Check workflow logs for specific errors

### OTA Update Not Appearing

1. Ensure build profile matches OTA branch
2. Check device is using correct build
3. Verify `eas.json` channel configuration

### Sentry Not Receiving Crashes

1. Verify `EXPO_PUBLIC_SENTRY_DSN` is set
2. Check source maps are uploaded
3. Test with intentional crash: `throw new Error("test")`

### Expo Doctor Errors

Run `npx expo doctor` and follow suggestions. Common issues:

- Outdated dependencies
- Conflicting package versions
- Missing peer dependencies

---

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [Sentry for React Native](https://docs.sentry.io/platforms/react-native/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## 🎮 Think Like a Trader

This DevOps setup is your **trading terminal**:

- **Orders** = Build/deploy commands
- **Executions** = Successful builds/releases
- **Risk Management** = Monitoring & crash reporting
- **Liquidity** = OTA updates (fast iteration)
- **Settlement** = App Store releases (final trade)

Just like in trading: **automate, monitor, iterate**.

---

## 📄 License

This configuration is part of Magnus Flipper AI.

---

**Built with ⚡ by the Magnus team**
