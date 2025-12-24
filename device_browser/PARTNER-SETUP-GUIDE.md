# Poppulo Partner Player - Ubuntu Setup Guide

## Quick Installation

### 1. Download the Player
Download `shim-browser-2.0.0.tar.gz` from the provided location to your Ubuntu machine.

### 2. Extract and Run
Open a terminal and run these commands:

```bash
# Navigate to download location (usually Downloads folder)
cd ~/Downloads

# Extract the player
tar -xzf shim-browser-2.0.0.tar.gz

# Navigate to extracted folder
cd shim-browser-2.0.0

# Make executable and run
chmod +x @fwishim-browser
./@fwishim-browser --no-sandbox
```

### 3. Device Activation
When the app first starts:
1. The app will attempt auto-activation using your device serial number
2. If auto-activation fails, you'll be prompted for an **invite code**
3. Create an invite code in Poppulo Cloud under the **Devices** module
4. Enter the invite code to activate your device

### 4. First Channel Download
After activation:
1. Your device will automatically receive a channel assignment from the cloud
2. The first channel will download automatically
3. This creates the content tracking system for your rendering application

## Content Integration

### Content Directory
All downloaded content is stored at:
```
~/Poppulo/Content/
```

### Channel Tracking
The app creates a tracking file at:
```
~/Poppulo/Content/current-channel.json
```

**Example content:**
```json
{
  "channelId": "4c24795c-e111-442b-89d6-7975e7d6d2d9",
  "version": 7,
  "path": "/home/username/Poppulo/Content/4c24795c-e111-442b-89d6-7975e7d6d2d9.7",
  "name": "My Channel",
  "lastUpdated": "2025-12-23T17:05:54.123Z"
}
```

### For Your Rendering Application
1. **Monitor** `~/Poppulo/Content/current-channel.json` for file changes
2. **Read** the `path` field to get the current channel directory
3. **Load content** from the directory specified in the `path` field
4. **Switch channels** automatically when the file updates

## Important Notes

- **No manual setup required** - content directory is created automatically
- **Channel updates** happen automatically from the cloud
- **File monitoring** - watch `current-channel.json` for real-time channel changes
- **First run** - the tracking file is only created after the first channel downloads
- **Network required** - device needs internet connection for activation and channel downloads

## Troubleshooting

**App won't start:**
- Ensure you're running directly on Ubuntu desktop (not via SSH)
- Use the `--no-sandbox` flag as shown above

**No current-channel.json file:**
- File is created only after first successful channel download
- Ensure device is activated and has received a channel assignment

**Permission errors:**
- Content is stored in user home directory - no special permissions needed

## Support
Contact Poppulo support for:
- Channel assignments
- Technical assistance

**For device activation:** Create invite codes directly in Poppulo Cloud under Devices module