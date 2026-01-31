# IFTTT and SmartLife Setup Guide

This guide explains how to set up IFTTT webhooks with SmartLife/Tuya devices for farm_clawed actuator control.

## Overview

farm_clawed uses IFTTT as a bridge between the automation system and SmartLife/Tuya devices. The flow is:

```
farm_clawed → IFTTT Webhook → SmartLife Scene → Device
```

## Prerequisites

1. SmartLife app installed with your devices configured
2. IFTTT account (free tier works)
3. SmartLife devices (valves, sensors)

## Step 1: Set Up SmartLife Scenes

Create scenes in the SmartLife app that farm_clawed will trigger:

### Scene Naming Convention

Use this naming pattern for consistency:

```
FARM_<ZONE>_<ACTION>_<DURATION>
```

Examples:
- `FARM_LEMON_WATER_1MIN` - Water lemon zone for 1 minute
- `FARM_LEMON_WATER_5MIN` - Water lemon zone for 5 minutes
- `FARM_LEMON_STOP` - Emergency stop lemon zone
- `FARM_ALL_OFF` - Emergency stop all zones

### Creating a Watering Scene

1. Open SmartLife app
2. Go to **Smart** tab
3. Tap **+** to create new scene
4. Name it `FARM_LEMON_WATER_1MIN`
5. Add action:
   - Select your valve device
   - Set action: Turn On
   - Set delay: 60 seconds
   - Add another action: Turn Off
6. Save the scene

### Creating an Emergency Stop Scene

1. Create scene named `FARM_LEMON_STOP`
2. Add action:
   - Select your valve device
   - Set action: Turn Off
3. Save the scene

## Step 2: Connect SmartLife to IFTTT

1. Go to [ifttt.com](https://ifttt.com)
2. Go to **My Applets** → **Services**
3. Search for "SmartLife"
4. Connect your SmartLife account

## Step 3: Get Your IFTTT Webhook Key

1. Go to [ifttt.com/maker_webhooks](https://ifttt.com/maker_webhooks)
2. Click **Documentation**
3. Copy your webhook key (long alphanumeric string)

Save this key - you'll need it for farm_clawed configuration.

## Step 4: Create IFTTT Applets

Create an applet for each scene:

### Applet: Trigger Water 1 Minute

1. Go to **Create** → **New Applet**
2. **If This**: Choose **Webhooks** → **Receive a web request**
3. Event Name: `farm_lemon_water_1min` (lowercase, underscores)
4. **Then That**: Choose **SmartLife** → **Activate Scene**
5. Select your `FARM_LEMON_WATER_1MIN` scene
6. Save the applet

### Repeat for Other Scenes

Create applets for:
- `farm_lemon_water_2min` → `FARM_LEMON_WATER_2MIN`
- `farm_lemon_water_5min` → `FARM_LEMON_WATER_5MIN`
- `farm_lemon_stop` → `FARM_LEMON_STOP`
- `farm_all_off` → `FARM_ALL_OFF`

## Step 5: Configure farm_clawed

Add to your farm_clawed configuration (`~/.farm_clawed/farm_clawed.json`):

```json
{
  "farm": {
    "ifttt": {
      "enabled": true,
      "webhookKeyEnvVar": "IFTTT_WEBHOOK_KEY",
      "scenePrefix": "FARM_"
    }
  }
}
```

Set the environment variable:

```bash
export IFTTT_WEBHOOK_KEY="your_webhook_key_here"
```

Or add to `~/.farm_clawed/.env`:

```
IFTTT_WEBHOOK_KEY=your_webhook_key_here
```

## Step 6: Test the Connection

Test from command line:

```bash
# Test webhook directly
curl -X POST "https://maker.ifttt.com/trigger/farm_lemon_water_1min/with/key/YOUR_KEY"

# Or use farm_clawed
farm_clawed farm water status
```

## Scene Reference

### Standard Scenes

| Scene Name | IFTTT Event | Description | Duration |
|------------|-------------|-------------|----------|
| FARM_LEMON_WATER_1MIN | farm_lemon_water_1min | Water for 1 minute | 60s |
| FARM_LEMON_WATER_2MIN | farm_lemon_water_2min | Water for 2 minutes | 120s |
| FARM_LEMON_WATER_5MIN | farm_lemon_water_5min | Deep water 5 minutes | 300s |
| FARM_LEMON_WATER_10MIN | farm_lemon_water_10min | Deep soak 10 minutes | 600s |
| FARM_LEMON_STOP | farm_lemon_stop | Emergency stop | - |
| FARM_ALL_OFF | farm_all_off | Stop all zones | - |

### Estimated Water Usage

Based on typical garden hose flow (~2.5 GPM at low pressure):

| Duration | Estimated Gallons |
|----------|------------------|
| 1 minute | 0.5 gal |
| 2 minutes | 1.0 gal |
| 5 minutes | 2.5 gal |
| 10 minutes | 5.0 gal |

## Safety Considerations

### Automation Levels

| Level | Behavior |
|-------|----------|
| 0-1 | No actuator control (recommendations only) |
| 2 | Requires manual approval for each action |
| 3 | Auto-execute safe actions, approval for others |
| 4 | Full automation with Jidoka safety |

### Safety Checks

Before executing any watering scene, farm_clawed checks:

1. **Moisture ceiling**: Won't water if soil > 70% moisture
2. **Watering interval**: Minimum 4 hours between waterings
3. **Daily limit**: Won't exceed configured daily water limit
4. **Sensor status**: Requires recent sensor reading

### Emergency Stop

Emergency stop scenes (`FARM_*_STOP`, `FARM_ALL_OFF`) bypass all safety checks and execute immediately.

## Troubleshooting

### Webhook not triggering

1. Check IFTTT applet is enabled
2. Verify webhook key is correct
3. Check IFTTT activity log for errors
4. Ensure SmartLife connection is active

### Scene not activating

1. Check scene exists in SmartLife app
2. Verify scene name matches exactly
3. Test scene manually in SmartLife app
4. Check device is online

### Valve not responding

1. Check device battery/power
2. Verify WiFi connection
3. Check SmartLife app can control device
4. Try power cycling the device

## Security Notes

1. **Keep webhook key secret**: Treat it like a password
2. **Use environment variables**: Don't hardcode keys in config
3. **Monitor activity**: Check IFTTT activity log regularly
4. **Set daily limits**: Configure max daily water usage
5. **Test emergency stop**: Verify stop scenes work before relying on them

## Example Setup for Lemon Tree Experiment

```json
{
  "farm": {
    "permacultureDepth": 1,
    "automationLevel": 2,
    "ifttt": {
      "enabled": true,
      "webhookKeyEnvVar": "IFTTT_WEBHOOK_KEY",
      "scenePrefix": "FARM_"
    },
    "safety": {
      "actuatorsEnabled": true,
      "stopTriggers": {
        "overwaterThresholdPercent": 70,
        "overwaterDurationMinutes": 60
      }
    },
    "experiments": [
      {
        "id": "lemon-tree",
        "name": "Santa Teresa Lemon",
        "enabled": true
      }
    ]
  }
}
```

## Further Reading

- [IFTTT Webhooks Documentation](https://ifttt.com/maker_webhooks)
- [SmartLife App Guide](https://www.tuya.com/)
- [farm_clawed Safety System](./ARCHITECTURE_REVIEW.md#safetyjidoka-system)

