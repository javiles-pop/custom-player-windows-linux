# Documentation Guide

**📖 Read these docs in order for the smoothest learning experience:**

## 🚀 New to this project? Start here:

### 1. **[GETTING-STARTED.md](GETTING-STARTED.md)** ← Start here!
*Get the app running in 5 minutes*
- Environment setup
- Run browser player locally
- First activation

### 2. **[ARCHITECTURE.md](ARCHITECTURE.md)**
*Understand how it all works*
- Channel download flow
- File storage structure
- Why it doesn't render content

### 3. Choose your path:
- **Browser Player**: [../device_browser/README.md](../device_browser/) - GUI app for desktops
- **Headless Service**: [../headless-player/README.md](../headless-player/) - Server deployment

## 🔧 Building for production:

### 4. **[ELECTRON.md](ELECTRON.md)** - Windows/Linux installers
### 5. **[LINUX-INSTALLER.md](LINUX-INSTALLER.md)** - Ubuntu packaging details

## 🎯 Special situations:

### Coming from old shim? **[MIGRATION-GUIDE.md](MIGRATION-GUIDE.md)**
*Key differences from BrightSign/Samsung/LG players*

### Having issues? **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**
*Common errors and fixes*

### Advanced topics:
- **[MQTT-ARCHITECTURE.md](MQTT-ARCHITECTURE.md)** - Deep dive into cloud communication
- **[PARTNER-SETUP-GUIDE.md](PARTNER-SETUP-GUIDE.md)** - Partner deployment

---

## 🎯 Quick Paths by Role:

**New Developer (never seen this before):**
1. GETTING-STARTED.md → 2. ARCHITECTURE.md → 3. Pick implementation

**Existing Shim Developer:**
1. MIGRATION-GUIDE.md → 2. GETTING-STARTED.md → 3. Pick implementation

**DevOps/Deployment:**
1. GETTING-STARTED.md → 2. ELECTRON.md or LINUX-INSTALLER.md → 3. PARTNER-SETUP-GUIDE.md

**Stuck/Debugging:**
→ TROUBLESHOOTING.md (has all the common fixes)