/**
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Send-Command-Reference-Guide
 */

import { executeCommand, ExecuteCommandRequest } from './requests';

export type TwoLetterDay = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA';

/**
 * This should be a time string in the format of `HH:MM:SS`
 */
export type TimeFormat = string;

/**
 * This should be a time string in the format of `H:MM` or `H:MMTT`.
 *
 * - `8:00`
 * - `8:00PM`
 */
export type HourFormat = string;

/**
 * The Activate FWI Cloud License player command allows users to send an invite
 * code created in FWI Cloud to a content player without having to touch the
 * content player physically.
 *
 * @since Windows 5.7.0
 * @since Web 5.7.0
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Activate-FWI-Cloud-License-Player-Command
 * @param inviteCode Six-digit code generated in FWI Cloud. When omitted, the player
 * attempts to activate using the hardware ID.
 */
export function activateCloudLicense(inviteCode?: string): ExecuteCommandRequest {
  let attributes: Record<string, unknown> | undefined;
  if (inviteCode) {
    attributes = { InviteCode: inviteCode };
  }

  return executeCommand('ActivateCloudLicense', attributes);
}

/**
 * The Add Display Timer player command adds a timer to the player.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Add-Display-Timer-Player-Command
 * @param days A list of two-letter day abbreviations.
 * @param timeOn Time the display turns on, in the format `HH:MM:SS`.
 * @param timeOff Time the display turns off, in the format `HH:MM:SS`.
 */
export function addDisplayTimer(
  days: readonly TwoLetterDay[],
  timeOn: TimeFormat,
  timeOff: TimeFormat
): ExecuteCommandRequest {
  return executeCommand('AddDisplayTimer', {
    Days: days.join(','),
    TimeOn: timeOn,
    TimeOff: timeOff,
  });
}

/**
 * The Auto-Adjust Display player command forces the display to adjust itself to
 * the proper settings.
 *
 * @since Windows 5.1.0
 * @since Web 5.4.0
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Auto-Adjust-Display-Player-Command
 */
export function autoAdjustDisplay(): ExecuteCommandRequest {
  return executeCommand('AutoCalibrateDisplay');
}

/**
 * The Check Firmware Update player command forces the player to immediately
 * check for a firmware update for the display.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Check-Firmware-Update-Player-Command
 */
export function checkFirmwareUpdate(): ExecuteCommandRequest {
  return executeCommand('CheckFirmwareUpdate');
}

/**
 * Check For New Deployment forces Content Player to immediately check its
 * current deployment location for a new deployment.
 *
 * @since Windows 5.1.0
 * @since Web 5.4.0
 * @since SSP 1.0.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Check-For-New-Deployment-Player-Command
 * @param refresh Boolean if the deployment should be forcefully refreshed.
 */
export function checkDeployment(refresh = false): ExecuteCommandRequest {
  return executeCommand('CheckDeployment', { Refresh: refresh });
}

/**
 * The Check For Software Update player command forces Content Player to
 * immediately check a predefined (defined using the Set software update
 * location command) shared location for a software update.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.9.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android 1.1.0
 * @since Mac 1.1.0
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Check-For-Software-Update-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Software-Update-Location-Player-Command
 */
export function checkForUpdate(): ExecuteCommandRequest {
  return executeCommand('CheckForUpdate');
}

/**
 * The Clear Logs player command allows users to delete any logs on a Content
 * Player, including play logs, interactivity logs, and diagnostic logs.
 *
 * @since Windows 5.11.0
 * @since Web 5.11.0
 * @since SSP 1.7.0
 * @since BrightSign 1.7.0
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Clear-Logs-Player-Command
 */
export function clearLogs(): ExecuteCommandRequest {
  return executeCommand('ClearLogs');
}

/**
 * The Clear Player Cache player command deletes all content from the Content
 * Player's cache, and optionally restarts the player during the cache clearing
 * process. Restarting the player during this process allows the machine to
 * delete any content that might be in use currently by the player when the
 * command is sent, meaning it is a more thorough cache-clearing process.
 *
 * #### Restart Behavior:
 *
 * Defines if the player should be restarted during the cache clearing process.
 * Possible values are true and false. If false, invalid, or missing:
 *
 * - Clear as much of the memory cache as possible
 * - Clear as much of the disk cache as possible for the currently running
 *   channel
 * - Expect minimal impact on the player as it recovers and rebuilds its cached
 *   content
 *
 * If true:
 *
 *  - The player is restarted during a hard cache clear
 *  - The player is stopped
 *  - The memory cache is cleared to release any associated files
 *  - Be sure to clear as much of the disk cache as possible
 *  - The player is restarted.
 *
 * @since Windows 5.5.0
 * @since Web 5.5.0
 * @since SSP 1.0.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Clear-Player-Cache-Player-Command
 * @param restart Boolean if the player should also be restarted. See the
 * documentation above about "Restart Behavior"
 */
export function clearCache(restart = false): ExecuteCommandRequest {
  return executeCommand('ClearCache', { RestartPlayer: restart });
}

/**
 * The Configure Command Polling player command enables and sets the interval
 * at which Content Player looks to its remote deployment server for player
 * commands. This separates the command polling from the remote deployment
 * polling interval, which is useful when Content Player needs to receive player
 * commands frequently without downloading new deployment information.
 *
 * For example, a player’s content changes infrequently and only needs to check
 * for a deployment once a day. The player can still check for commands (such as
 * a display control, player restart, or ReaderId) every minute.
 *
 * @since Windows 5.1.0
 * @since Web 5.4.0
 * @since SSP 1.0.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Configure-Command-Polling-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Deployment-Polling-Interval-Player-Command
 * @param enabled Boolean if the polling should be enabled
 * @param interval Interval at which Content Player looks for new commands, in
 * the format of `HH:MM:SS`.
 */
export function configureCommandPolling(enabled: boolean, interval?: TimeFormat): ExecuteCommandRequest {
  return executeCommand('ConfigureCommandPolling', {
    Enabled: enabled,
    Interval: interval,
  });
}

/**
 * The Configure Deployment player command sets the published URL, and
 * optionally a username and password, for the player.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Configure-Deployment-Player-Command
 * @param url Url to be set for the player. Player verifies if the Url is valid
 * published Url. If not, it updates the player Url for security purposes.
 * @param username Username for a secured published Url. Must be used with the
 * `password` argument.
 * @param password Password for a secured published Url. Must be used with the
 * `username` argument.
 */
export function configureDeployment(url: string): ExecuteCommandRequest;
export function configureDeployment(url: string, username: string, password: string): ExecuteCommandRequest;
export function configureDeployment(url: string, username?: string, password?: string): ExecuteCommandRequest {
  return executeCommand('ConfigureDeployment', {
    rl: url,
    UserName: username,
    Password: password,
  });
}

/**
 * The Deployment Properties player command functions identically to the Set
 * Deployment Polling Interval player command.
 *
 * @since Windows 5.4.0
 * @since Web 5.4.0
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Configure-Deployment-Properties-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Deployment-Polling-Interval-Player-Command
 * @param interval Interval at which Content Player looks for new commands, in
 * the format of `HH:MM:SS`.
 */
export function configureDeploymentProperties(interval?: TimeFormat): ExecuteCommandRequest {
  let attributes: Record<string, unknown> | undefined;
  if (interval) {
    attributes = { Interval: interval };
  }

  return executeCommand('ConfigureDeploymentProperties', attributes);
}

/**
 * The Configure FWI Services Connection Properties player command sets the FWI
 * Services Connection Properties within in the Advanced tab of the player.
 * These control upload of logs, status, and screenshots.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Configure-FWI-Services-Connection-Properties-Player-Command
 * @param url FWI Services URL.
 * @param username FWI Services username.
 * @param password FWI Services password.
 * @param company FWI Services company.
 */
export function configureServicesProperties(
  url: string,
  username: string,
  password: string,
  company: string
): ExecuteCommandRequest {
  return executeCommand('ConfigureServicesProperties', {
    Url: url,
    UserName: username,
    Password: password,
    Company: company,
  });
}

/**
 * Configure Log Screenshot enables and sets the interval at which Content
 * Player captures (logs) a screenshot.
 *
 * - This screenshot is stored in on the local hard drive at
 *   `%FWI%\Signage\Logs`.
 * - These screenshots can be uploaded to a remote server using the Configure
 *   Upload Screenshot command.
 *
 * @since Windows 5.1.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Configure-Log-Screenshot-Player-Command
 * @param enabled Boolean if screenshot capture should be enabled.
 * @param interval The interval with which to capture screenshots, in the
 * format of `HH:MM:SS`.
 */
export function configureLogScreenshot(enabled: boolean, interval?: TimeFormat): ExecuteCommandRequest {
  return executeCommand('ConfigureLogScreenshot', {
    Enabled: enabled,
    Interval: interval,
  });
}

/**
 * Configure Memory-Usage Monitoring forces a restart of the player machine
 * when memory exceeds a provided threshold (in MB).
 *
 * @since Windows 5.2.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Configure-Memory-Usage-Monitoring-Player-Command
 * @param enabled Boolean if the memory-usage monitory should be enabled.
 * @param threshold The amount of memory consumed by player (in MB) to cause reboot.
 */
export function configureWatchMemoryUsage(enabled: boolean, threshold?: number): ExecuteCommandRequest {
  return executeCommand('ConfigureWatchMemoryUsage', {
    Enabled: enabled,
    Threshold: threshold,
  });
}

export type SyncronizationRole = 'Leader' | 'Follower' | 'None';

/**
 * The Configure Multicase player command allows Content Player to use
 * multicast sync, syncing content across multiple player machines and sending
 * commands to multiple players simultaneously.
 *
 * Note: This function does not affect the Video Synchronization properties
 * within FWI Media Player.
 *
 * @since Windows 5.2.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Configure-Multicast-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Video-Synchronization
 * @param role The synchronization role to assign the Content Player. When None
 * is used, multicast sync for that Content Player is disabled.
 * @param ip An open multicast IP address. For more information, contact a
 * network administrator.
 * @param port Multicast port number (as an integer). For more information,
 * contact a network administrator.
 * @param ttl Multicast TTL value (as an integer). For more information, contact
 * a network administrator.
 */
export function configureMulticast(
  role: SyncronizationRole,
  ip: string,
  port: number,
  ttl: number
): ExecuteCommandRequest {
  return executeCommand('ConfigureMulticast', {
    SyncRole: role,
    MulticastIPAddress: ip,
    MulticastPort: port,
    MulticastTtl: ttl,
  });
}

export interface PlayerRestartTime {
  /**
   * Time of day to restart the player machine (in the format `H:MM` or
   * `H:MMTT`).
   */
  time: HourFormat;
}

export interface PlayerRestartInterval {
  /**
   * Time interval at which to restart player as a timespan (in the format
   * `hh:mm:ss`).
   */
  interval: TimeFormat;
}

/**
 * `time` and `interval` are mutually exclusive. Only one or the other should
 * be used.
 */
export type PlayerRestartOptions = PlayerRestartTime | PlayerRestartInterval;

/**
 * Configure Player Restart Schedule enables the Content Player software to
 * restart at a specific time of day or at a specific interval. This command
 * requires either the TimeOfDay or Interval parameter, but cannot be used with
 * both.
 *
 * @since Windows 5.2.1
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Configure-Player-Restart-Schedule-Player-Command
 * @param enabled Boolean if the automatic Content Player software restart is
 * enabled.
 * @param options Either the time of day to restart the player machine or the
 * interval at which to restart the player as a timespan.
 */
export function configurePlayerRestart(enabled: boolean, options?: PlayerRestartOptions): ExecuteCommandRequest {
  const { time, interval } = (options || {}) as Partial<PlayerRestartTime> & Partial<PlayerRestartInterval>;

  return executeCommand('ConfigurePlayerRestart', {
    Enabled: enabled,
    TimeOfDay: time,
    Interval: interval,
  });
}

/**
 * Configure Upload Screenshot enables upload of screenshots to FWI Services.
 *
 * @since Windows 5.1.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Configure-Upload-Screenshot-Player-Command
 * @param enabled Boolean if the log upload is enabled.
 */
export function configureUploadScreenshot(enabled: boolean): ExecuteCommandRequest {
  return executeCommand('ConfigureUploadScreenshot', { Enabled: enabled });
}

/**
 * The Delete All Display Timers player command that deletes all display
 * timers.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Delete-All-Display-Timers-Player-Command
 */
export function deleteAllDisplayTimers(): ExecuteCommandRequest {
  return executeCommand('DeleteAllDisplayTimers');
}

/**
 * The Delete Display Timer player command deletes a single timer matching the
 * supplied day(s) and time values. If a matching timer does not exist, the
 * command is ignored.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Delete-Display-Timer-Player-Command
 * @param days A list of two-letter day abbreviations.
 * @param timeOn Time on value, in the format `HH:MM:SS`.
 * @param timeOff Time off value, in the format `HH:MM:SS`.
 */
export function deleteDisplayTimer(
  days: readonly TwoLetterDay[],
  timeOn: TimeFormat,
  timeOff: TimeFormat
): ExecuteCommandRequest {
  return executeCommand('DeleteDisplayTimer', {
    Days: days.join(','),
    TimeOn: timeOn,
    TimeOff: timeOff,
  });
}

/**
 * The Delete Persistent Variables player command removes all persistent
 * variable values stored on a device.
 *
 * @since Windows 5.5.0
 * @since Web 5.5.0
 * @since SSP 1.0.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Delete-Persistent-Variables-Player-Command
 */
export function deletePersistentVariables(): ExecuteCommandRequest {
  return executeCommand('DeletePersistentVariables');
}

/**
 * The Disable Auto-Display Power player command:
 *
 * - Disables Content Player from automatically powering off and on for a
 *   display with an RS-232 connection.
 * - May be enabled using the Enable Auto-Display Power command.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Disable-Auto-Display-Power-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Auto-Display-Power-Player-Command
 */
export function disableAutoDisplayPower(): ExecuteCommandRequest {
  return executeCommand('DisableAutoDisplayPower');
}

/**
 * The Disable Auto-Reboot (Windows) player command:
 *
 * - Disables the Content Player from automatically rebooting the player
 *   machine.
 * - May be enabled using the Enable Auto-Reboot (Windows) command.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Disable-Auto-Reboot-Windows-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Auto-Reboot-Windows-Player-Command
 */
export function disableAutoReboot(): ExecuteCommandRequest {
  return executeCommand('DisableAutoReboot');
}

/**
 * The Disable Daily Reboot player command disables daily reboot options on a
 * player and stops daily reboot action.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Disable-Daily-Reboot-Player-Command
 */
export function disableDailyReboot(): ExecuteCommandRequest {
  return executeCommand('DisableDailyReboot');
}

/**
 * The Disable Display Timers player command temporarily disables all display
 * timers. Timers can be re-enabled using the Enable Display Timers Player
 * Command.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Disable-Display-Timers-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Display-Timers-Player-Command
 */
export function disableDisplayTimers(): ExecuteCommandRequest {
  return executeCommand('DisableDisplayTimers');
}

/**
 * The Disable Firmware Update Check player command temporarily disables
 * firmware updates. Firmware update checks can be re-enabled using the Enable
 * Firmware Update Check Player Command.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Disable-Firmware-Update-Check-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Firmware-Update-Check-Player-Command
 */
export function disableFirmwareUpdateCheck(): ExecuteCommandRequest {
  return executeCommand('DisableFirmwareUpdateCheck');
}

/**
 * The Disable Logs Upload player command temporarily disables log uploads. Log
 * uploads can be re-enabled using the Enable Logs Upload Player Command.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Disable-Logs-Upload-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Logs-Upload-Player-Command
 */
export function disableLogsUpload(): ExecuteCommandRequest {
  return executeCommand('DisableLogsUpload');
}

/**
 * The Disable Screenshot Upload player command temporarily disables screenshot
 * uploads for a player. Screenshot uploads may be re-enabled using the Enable
 * Screenshot Upload Player Command.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Disable-Screenshot-Upload-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Screenshot-Upload-Player-Command
 */
export function disableScreenshotUpload(): ExecuteCommandRequest {
  return executeCommand('DisableScreenshotUpload');
}

/**
 * The Disable Socket Request player command allows users to disable
 * credentials remotely, eliminating the need to manually update this in the
 * player's Configuration window on the player(s).
 *
 * @since Windows 5.11.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Disable-Socket-Request-Player-Command
 */
export function disableSocketRequest(): ExecuteCommandRequest {
  return executeCommand('DisableSocketRequest');
}

/**
 * The Disable Software Update Check player command disables Content Player
 * from checking a predefined (using the Set Software Update Location command)
 * shared location for software updates on a daily basis.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.9.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android 1.1.0
 * @since Mac 1.1.0
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Disable-Software-Update-Check-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Software-Update-Location-Player-Command
 */
export function disableCheckForUpdate(): ExecuteCommandRequest {
  return executeCommand('DisableCheckForUpdate');
}

/**
 * The Disable Status Upload player command temporarily disables status
 * uploads. Status uploads can be re-enabled using the Enable Status Upload
 * Player Command.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Disable-Status-Upload-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Status-Upload-Player-Command
 */
export function disableStatusUpload(): ExecuteCommandRequest {
  return executeCommand('DisableStatusUpload');
}

/**
 * The Enable Auto-Display Power player command enables the Content Player to
 * automatically power off and on a display with an RS-232 connection. When
 * enabled, this feature defaults to 12:00 AM to 12:00 AM. These times may be
 * changed using the Set Display-Off End Time and Set Display-Off Start Time
 * commands. To disable Enable Auto-Display Power, use the Disable Auto-Display
 * Power command.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Auto-Display-Power-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Display-Off-End-Time-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Display-Off-Start-Time-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Disable-Auto-Display-Power-Player-Command
 */
export function enableAutoDisplayPower(): ExecuteCommandRequest {
  return executeCommand('EnableAutoDisplayPower');
}

/**
 * The Enable Auto-Reboot player command enables the Content Player to
 * automatically reboot the player machine at a certain time of day (set via the
 * Set Auto-Reboot Time (Windows) command). To disable automatic reboot, use the
 * Disable Auto-Reboot (Windows) command.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Auto-Reboot-Windows-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Auto-Reboot-Time-Windows-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Disable-Auto-Reboot-Windows-Player-Command
 */
export function enableAutoReboot(): ExecuteCommandRequest {
  return executeCommand('EnableAutoReboot');
}

/**
 * The Enable Daily Reboot player command enables daily player reboots,
 * optionally setting a new reboot time.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Daily-Reboot-Player-Command
 * @param time New reboot time, in the format `HH:MM:SS`.
 */
export function enableDailyReboot(time: TimeFormat): ExecuteCommandRequest {
  return executeCommand('EnableDailyReboot', { RebootTime: time });
}

/**
 * The Enable Display Timers player command enables display timers on the
 * player.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Display-Timers-Player-Command
 */
export function enableDisplayTimers(): ExecuteCommandRequest {
  return executeCommand('EnableDisplayTimers');
}

/**
 * The Enable Firmware Update Check player command enables firmware updates on
 * the player.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Firmware-Update-Check-Player-Command
 */
export function enableFirmwareUpdateCheck(): ExecuteCommandRequest {
  return executeCommand('EnableFirmwareUpdateCheck');
}

/**
 * The Enable Logs Upload player command enables log uploads with an optional
 * daily upload time.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Logs-Upload-Player-Command
 * @param time Time to upload logs, in the format `HH:MM:SS`.
 */
export function enableLogsUpload(time: TimeFormat): ExecuteCommandRequest {
  return executeCommand('EnableLogsUpload', { UploadTime: time });
}

/**
 * The Enable Screenshot Upload player command enables screenshot uploads at an
 * optional time of day for the upload.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Screenshot-Upload-Player-Command
 * @param time Time of day for screenshot uploads, in the format `HH:MM:SS`.
 */
export function enableScreenshotUpload(time: TimeFormat): ExecuteCommandRequest {
  return executeCommand('EnableScreenshotUpload', { UploadTime: time });
}

/**
 * The Enable Socket Request player command allows users to remotely enable and
 * update credentials, eliminating the need to manually set this in the
 * Configuration window on Content Player(s).
 *
 * @since Windows 5.11.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Socket-Request-Player-Command
 * @param username Username for the player(s).
 * @param password Password for the player(s).
 */
export function enableSocketRequest(username: string, password: string): ExecuteCommandRequest {
  return executeCommand('EnableSocketRequest', {
    UserName: username,
    Password: password,
  });
}

/**
 * The Enable Software Update Check player command enables Content Player to
 * check a predefined (using the Set Software Update Location command) shared
 * location for software updates daily.
 *
 * @since Windows 4.0.0
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.9.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Software-Update-Check-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Software-Update-Location-Player-Command
 */
export function enableCheckForUpdate(): ExecuteCommandRequest {
  return executeCommand('EnableCheckForUpdate');
}

/**
 * The Enable Status Upload player command enables status uploads with an
 * optional time of day for the uploads.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Status-Upload-Player-Command
 * @param time Time of day for the status upload, in the format `HH:MM:SS`.
 */
export function enableStatusUpload(time: TimeFormat): ExecuteCommandRequest {
  return executeCommand('EnableStatusUpload', { UploadTime: time });
}

/**
 * The Reboot Player player command forces an immediate reboot of the player
 * machine.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac 4.7.0
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Reboot-Player-Player-Command
 */
export function reboot(): ExecuteCommandRequest {
  return executeCommand('Reboot');
}

/**
 * The Refresh Player Status player command forces the Content Player to
 * immediately upload a new status to its predefined upload location.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Refresh-Player-Status-Player-Command
 */
export function refreshStatus(): ExecuteCommandRequest {
  return executeCommand('RefreshStatus');
}

/**
 * The Remove Configuration Access Code player command removes the access code
 * from Content Player.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Remove-Configuration-Access-Code-Player-Command
 */
export function removeAccessCode(): ExecuteCommandRequest {
  return executeCommand('RemoveAccessCode');
}

/**
 * The Renew License player command registers a license key for the Content
 * Player software.
 *
 * Example format: `#####-#####-#####-#####-#####-#`
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Renew-License-Player-Command
 * @param license The license key to register on the Content Player.
 */
export function renewLicense(license: string): ExecuteCommandRequest {
  return executeCommand('RenewLicense', { LicenseKey: license });
}

/**
 * The Restart Player player command forces an immediate restart of the Content
 * Player application. For a manual restart of the Content Player machine, refer
 * to the Reboot Player command.
 *
 * @since Windows 5.2.1
 * @since Web 5.4.0
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Restart-Player-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Reboot-Player-Player-Command
 * @param reason Optional reason for restarting the Content Player, which is
 * visible in the Content Player Monitor Log, located at
 * `fwi%Signage\Logs\MonitorLog.txt`.
 */
export function restartPlayer(reason?: string): ExecuteCommandRequest {
  let attributes: Record<string, unknown> | undefined;
  if (reason) {
    attributes = { Reason: reason };
  }

  return executeCommand('RestartPlayer', attributes);
}

/**
 * The Run script player command:
 *
 * Executes a script in Content Player;
 * - Is most often used when sending commands from one player to another
 * - May execute any valid script in the Scripting window.
 * - For a full list of scripts, refer to the Script Reference article.
 *
 * @since Windows 4.6.2
 * @since Web 5.4.0
 * @since SSP 1.0.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Run-Script-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Script-Reference
 * @param script Script to execute on the receiving Content Player. Unlike the
 * Scripting tab of the Interactivity or Play Triggers window, the script should
 * not have a closing semi-colon, e.g., Template.PlayContent(content,region).
 * @param scripts Any other scripts to run
 */
export function runScript(script: string, ...scripts: readonly string[]): ExecuteCommandRequest {
  const attributes = [script, ...scripts].reduce(
    (obj, s, i) => ({
      ...obj,
      [`${i}`]: s,
    }),
    {}
  );

  return executeCommand('RunScript', attributes);
}

/**
 * The Send Installer Parameters player command allows users to change the
 * default locations for items, such as application directory, device profile,
 * etc.
 *
 * @since Windows 5.4.0
 * @since Web 5.4.0
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Send-Installer-Parameters-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Content-Player-for-Windows-Installation
 */
export function sendInstallerParameters(name: string, value: unknown): ExecuteCommandRequest {
  return executeCommand('SendInstallerParameters', {
    Parameter: `${name}=${value}`,
  });
}

/**
 * With the release of version 5.10.0, the Send Logs to FWI Cloud send command
 * allows users to transmit application logs to FWI Cloud on demand, alleviating
 * the need to wait for the scheduled time to elapse before viewing them. This
 * may also be set in Content Player for Windows Configuration screen on the
 * Device tab.
 *
 * Note: The Default Log Upload Time is 00:15:00 (15 minutes).
 *
 * @since Windows 5.10.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Send-Logs-to-FWI-Cloud-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Content-Player-for-Windows-Configuration-Device-Tab
 * @param cloud Boolean if the device is using both FWI Services and FWI Cloud
 * Logs. This will send logs to FWI Services when `false` and to FWI Cloud when
 * `true`.
 */
export function sendLogs(cloud = false): ExecuteCommandRequest {
  return executeCommand(`SendLogs${cloud ? 'ToCloud' : ''}`);
}

/**
 * The Send Reader ID player command initiates a Reader ID on the Content
 * Player, which is most frequently used when sending commands from one player
 * to another.
 *
 * @since Windows 4.5.0
 * @since Web 5.4.0
 * @since SSP 1.0.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Send-Reader-ID-Player-Command
 * @param readerId Reader ID to be executed on the receiving Content Player
 * machine.
 */
export function sendReaderId(readerId: string): ExecuteCommandRequest {
  return executeCommand('SendReaderId', { ReaderId: readerId });
}

/**
 * The Set Auto-Reboot Time (Windows) player command sets the desired daily
 * reboot time when Auto-Reboot is enabled.
 *
 * To enable / disable Auto-Reboot, use the Enable Auto-Reboot (Windows) and
 * Disable Auto-Reboot (Windows) commands, respectively.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Auto-Reboot-Time-Windows-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Auto-Reboot-Windows-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Disable-Auto-Reboot-Windows-Player-Command
 * @param time The desired daily reboot time, in the format `H:MM` or `H:MMTT`.
 */
export function setAutoRebootTime(time: HourFormat): ExecuteCommandRequest {
  return executeCommand('SetAutoRebootTime', { RebootTime: time });
}

export interface ChannelEndTime {
  /**
   * An optional time of day when the channel reverts to the main deployment,
   * which is the (default) channel. The player reverts to the main deployment
   * regardless of what channel the player is displaying when it receives the
   * command.
   */
  time: HourFormat;
}

export interface ChannelDuration {
  /**
   * An optional duration for the channel to play before reverting to the main
   * deployment, which is the (default) channel. The player reverts to the main
   * deployment regardless of what channel the player is displaying when it
   * receives the command.
   */
  duration: TimeFormat;
}

/**
 * The `time` and `duration` parameters are mutually exclusive. Only one of the
 * other should be used.
 */
export type ChannelOptions = ChannelEndTime | ChannelDuration;

/**
 * The Set Channel player command forces the Content Player to change to a
 * separate channel by name. Channels are created when one is added to the
 * Network Overview in Content Manager, assigned to a Content Player, and then
 * deployed. This command allows the Content Player to change between the
 * channels, regardless of their current broadcasting status.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Channel-Player-Command
 * @param channelId The ID (name) of the channel to begin displaying.
 * @param options An optional end time or duration for the channel.
 */
export function setChannel(channelId: string, options?: ChannelOptions): ExecuteCommandRequest {
  const { time, duration } = (options || {}) as Partial<ChannelEndTime> & Partial<ChannelDuration>;

  return executeCommand('SetChannel', {
    ChannelId: channelId,
    EndTime: time,
    Duration: duration,
  });
}

/**
 * The Set Configuration Access Code player command sets or resets the access
 * code on a Content Player device. This does not require knowledge of the
 * existing access code.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Configuration-Access-Code-Player-Command
 * @param accessCode New code assigned to the Content Player. **This can only
 * be a string of numbers**, or an empty string which disables the access code
 * on the Content Player
 */
export function setAccessCode(accessCode: string): ExecuteCommandRequest {
  return executeCommand('SetAccessCode', { AccessCode: accessCode });
}

/**
 * The Set Configuration Hot-Spot player command allows users to assign a
 * corner of the display to access specific commands by touching that corner. To
 * configure a hot spot, ensure the deployment is set to LAN or Server, and then
 * configure a box using four sets of coordinates for each corner of the box.
 *
 * Note: There were no examples at the time of writing this for what the
 * HotSpots should look like.
 *
 * @since Windows 4.5.0
 * @since Web 5.4.0
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Configuration-Hot-Spot-Player-Command
 * @param hotSpots Rectangle coordinates, separated by pipes for multiple spots.
 */
export function setConfigurationHotSpot(hotSpots: unknown): ExecuteCommandRequest {
  return executeCommand('SetConfigurationHotSpot', { HotSpots: hotSpots });
}

// https://fourwindsinteractive.force.com/articles/User_Guide/Set-Custom-Setting-By-RS-232-Player-Command
// setSettingByRs232
// omitting for now since I have no idea what this really looks like.

/**
 * The Set Daily Reboot Time player command sets the reboot time for a player.
 * When the daily reboots are enabled, the player reboots at the supplied time.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Daily-Reboot-Time-Player-Command
 * @param time Time the player reboots if daily reboots are enabled, in the
 * format `HH:MM:SS`.
 */
export function setDailyRebootTime(time: TimeFormat): ExecuteCommandRequest {
  return executeCommand('SetDailyRebootTime', { RebootTime: time });
}

/**
 * The Set Deployment Polling Interval (identical to the Configure Deployment
 * Properties) player command sets the interval at which Content Player looks
 * for changes to its current deployment on a predefined remote server.
 *
 * @since Windows 5.0.0
 * @since Web 5.4.0
 * @since SSP 1.0.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Deployment-Polling-Interval-Player-Command
 * @param interval Polling interval or frequency with which to check for a
 * remote deployment, in the format `HH:MM:SS`. Note: Remove the Polling
 * Interval text and just enter the time in `HH:MM:SS` format.
 */
export function setDeploymentPollingInterval(interval: TimeFormat): ExecuteCommandRequest {
  return executeCommand('SetDeploymentPollingInterval', { Interval: interval });
}

/**
 * When Auto-Display Power is enabled and an RS-232 connection is being used,
 * the Set Display Off End-Time player command sets the desired time to power on
 * a display. Auto-Display Power may be enabled and disabled using the Enable
 * Auto-Display Power and Disable Auto-Display Power commands, respectively.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Display-Off-End-Time-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Enable-Auto-Display-Power-Player-Command
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Disable-Auto-Display-Power-Player-Command
 * @param endTime Desired time to power on a display every day, in the format
 * `H:MM` or `H:MMTT`. If this parameter is omitted, the current time is used.
 * @param auto Boolean if an auto-adjustment on the display should be enabled
 * when the screen powers on.
 */
export function setDisplayOffEnd(endTime?: HourFormat, auto?: boolean): ExecuteCommandRequest {
  let attributes: Record<string, unknown> | undefined;
  if (endTime || auto) {
    attributes = {
      EndTime: endTime,
      AutoAdjustOnPowerOn: auto,
    };
  }

  return executeCommand('SetDisplayOffEnd', attributes);
}

/**
 * When Auto-Display Power is enabled and an RS-232 connection is used, the Set
 * Display Off-Start Time player command sets the desired time to power a
 * display off. Auto-Display Power may be enabled and disabled using the Enable
 * Auto-Display Power and Disable Auto-Display Power commands, respectively.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Display-Off-Start-Time-Player-Command
 * @param time The desired time to power a display on every day, in the format
 * `H:MM` or `H:MMTT`.
 */
export function setDisplayOffStart(time: HourFormat): ExecuteCommandRequest {
  return executeCommand('SetDisplayOffStart', { StartTime: time });
}

/**
 * The Set Display Orientation player command sets the rotation of the player
 * on the display.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Display-Orientation-Player-Command
 * @param angle The new orientation of the player. (Values of 180 and 270 cause
 * performance issues and are not currently supported.)
 */
export function setDisplayOrientation(angle: '0' | '90'): ExecuteCommandRequest {
  return executeCommand('SetDisplayOrientation', { RotationAngle: angle });
}

/**
 * The Set Display Volume player command sets the volume of a the display using
 * an RS-232 connection.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP 1.3.0
 * @since BrightSign N/A
 * @since LG 1.3.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Display-Volume-Player-Command
 * @param volume The new volume level, as an integer (0-100). This value is a
 * percentage of the display's maximum volume level.
 */
export function setVolume(volume: number): ExecuteCommandRequest {
  if (process.env.NODE_ENV !== 'production') {
    const msg = 'Volume must be an integer between 0-100';
    if (volume < 0 || volume > 100) {
      throw new RangeError(msg);
    }

    if (!Number.isInteger(volume)) {
      throw new TypeError(msg);
    }
  }

  return executeCommand('SetVolume', { VolumeLevel: volume });
}

/**
 * The Set Firmware Update Check Time player command sets a time of day to
 * check for firmware updates. If firmware updates are enabled, the player
 * checks at the specified time.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Firmware-Update-Check-Time-Player-Command
 * @param time Time of day to check for an update if firmware updates are
 * enabled, in the format `HH:MM:SS`.
 */
export function setFirmwareUpdateCheckTime(time: TimeFormat): ExecuteCommandRequest {
  return executeCommand('SetFirmwareUpdateCheckTime', { CheckTime: time });
}

/**
 * When firmware updates are enabled, the Set Firmware Update Check URL player
 * command sets the URL the player uses to retrieve firmware updates.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Firmware-Update-Check-URL-Player-Command
 * @param url Path to use for firmware updates.
 */
export function setFirmwareUpdateCheckUrl(url: string): ExecuteCommandRequest {
  return executeCommand('SetFirmwareUpdateCheckUrl', { Url: url });
}

/**
 * When log uploads are enabled, the Set Logs Upload Time player command sets
 * the time of day for this to occur.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Logs-Upload-Time-Player-Command
 * @param time Specified time to upload the logs.
 */
export function setLogsUploadTime(time: TimeFormat): ExecuteCommandRequest {
  return executeCommand('SetLogsUploadTime', { UploadTime: time });
}

/**
 * The Set Monitor Input player command sets the display's current input using
 * an RS-232 connection.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Monitor-Input-Player-Command
 * @param input Please see the link above for the input table.
 */
export function setMonitorInput(input: string): ExecuteCommandRequest {
  return executeCommand('SetMonitorInput', { MonitorVideoInput: input });
}

/**
 * Set playlog upload interval enables windows of time in which Content Player
 * uploads its logs to FWI Services.
 *
 * @since Windows 5.1.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Playlog-Upload-Interval-Player-Command
 * @param enabled Boolean if log upload should be enabled
 * @param timeWindows Time windows with from and to time separated by commas
 * and pipes, e.g., `12:00AM,1:00AM|7:00PM,8:30PM`.
 */
export function configurePlaylogUploadInterval(enabled: boolean, timeWindows?: string): ExecuteCommandRequest {
  return executeCommand('ConfigurePlaylogUploadInterval', {
    Enabled: enabled,
    TimeWindows: timeWindows,
  });
}

/**
 * When screenshot updates are enabled, the Set Screenshot Upload Time player
 * command sets the time of day for the uploads.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Screenshot-Upload-Time-Player-Command
 * @param time Time of day for uploads to occur.
 */
export function setScreenshotUploadTime(time: TimeFormat): ExecuteCommandRequest {
  return executeCommand('SetScreenshotUploadTime', { UploadTime: time });
}

/**
 * The Set Software Update Check Time (Samsung SSP) player command sets the
 * time the player checks for a software update.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.9.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Software-Update-Check-Time-Samsung-SSP-Player-Command
 * @param time Time for the software update check, in the format `HH:MM:SS`.
 */
export function setSoftwareUpdateCheckTime(time: TimeFormat): ExecuteCommandRequest {
  return executeCommand('SetSoftwareUpdateCheckTime', { CheckTime: time });
}

/**
 * When updated checks are enabled, the Set Software Update Check Time
 * (Windows) player command sets the time of day to check a predefined shared
 * location for software updates.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Software-Update-Check-Time-Windows-Player-Command
 * @param time Time of day to check for software updates, in the format `H:MM`
 * or `H:MMTT`.
 */
export function setCheckForUpdateTime(time: HourFormat): ExecuteCommandRequest {
  return executeCommand('SetCheckForUpdateTime', { CheckForUpdateTime: time });
}

/**
 * The Set Software Update Check URL player command sets the URL from which the
 * player retrieves software updates.
 *
 * The application checks the remote repository for the required update files. If
 * the files are not present or if the application in the folder is the installed
 * version, no update occurs.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.9.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Software-Update-Check-URL-Player-Command
 * @param url Path from which the player retrieves software updates.
 */
export function setSoftwareUpdateCheckUrl(url: string): ExecuteCommandRequest {
  return executeCommand('SetSoftwareUpdateCheckUrl', { Url: url });
}

/**
 * The Set Software Update Location player command sets the shared location for
 * software updates. This location must:
 *
 * - Be a URL, FTP, HTTP, or UNC path that is accessible by the Content
 *   Player(s); and
 * - Host the contents of the Content Player Upgrade_Package, which includes a
 *   .zip file and the Director.xml. The zip file is named according to the target
 *   Content Player software version, e.g., `5.1.1.4146.zip`.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Software-Update-Location-Player-Command
 * @param path URL, FTP, HTTP, or UNC path  to the Content Player upgrade
 * package.
 * @param username Username to access the Content Player upgrade package.
 * @param password User password to access the Content Player upgrade package.
 * Must be encrypted by CMD and extracted from the saved Send Command XML. Note:
 * If the password is unable to be decrypted by the Player, no value is added to
 * the field.
 */
export function setSoftwareUpdateLocation(path: string): ExecuteCommandRequest;
export function setSoftwareUpdateLocation(path: string, username: string, password: string): ExecuteCommandRequest;
export function setSoftwareUpdateLocation(path: string, username?: string, password?: string): ExecuteCommandRequest {
  return executeCommand('SetSoftwareUpdateLocation', {
    Path: path,
    UserName: username,
    Password: password,
  });
}

/**
 * Set Status Upload Interval enables and sets the interval at which Content
 * Player uploads status information to FWI Services.
 *
 * @since Windows 4.6.2
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Status-Upload-Interval-Player-Command
 * @param enabled Boolean if the status upload should be enabled
 * @param interval Time interval at which Content Player uploads a status, as a
 * timespan (in the format `HH:MM:SS`).
 */
export function setStatusUploadInterval(enabled: boolean, interval?: TimeFormat): ExecuteCommandRequest {
  return executeCommand('SetStatusUploadInterval', {
    Enabled: enabled,
    Interval: interval,
  });
}

/**
 * When status uploads are enabled, the Set Status Upload Time player command
 * sets the status upload time interval (HH:MM:SS) for the player. For example,
 * when set to 22:00:00, the status uploads every 22 hours.
 *
 * @since Windows N/A
 * @since Web N/A
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Status-Upload-Time-Player-Command
 * @param time Duration of time in `HH:MM:SS` between status uploads.
 */
export function setStatusUploadTime(time: TimeFormat): ExecuteCommandRequest {
  return executeCommand('SetStatusUploadTime', { UploadTime: time });
}

/**
 * The Set Ticker Performance and Speed player command sets the speed at which
 * ticker content (also referred to as crawl or scrolling text) moves across a
 * screen in pixels per second.
 *
 * @since Windows 4.5.0
 * @since Web 5.4.0
 * @since SSP 1.0.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Ticker-Performance-and-Speed-Player-Command
 * @param speed Speed of the ticker in pixels per second. Accepts integers
 * between 50 and 1000. Default value is 250.
 */
export function setTickerMetrics(speed: number): ExecuteCommandRequest {
  if (process.env.NODE_ENV !== 'production') {
    const msg = 'Speed must be an integer between 50-1000';
    if (speed < 50 || speed > 1000) {
      throw new RangeError(msg);
    }

    if (!Number.isInteger(speed)) {
      throw new TypeError(msg);
    }
  }

  return executeCommand('SetTickerMetrics', { Speed: speed });
}

/**
 * The Set Variable remote command enables Content Manager Desktop / Web users
 * to send multiple variables to a player all at once. This command supports all
 * available variables for the Content Player.
 *
 * The variables should normally be `PascalCased`.
 *
 * @since Windows 5.7.0
 * @since Web 5.7.0
 * @since SSP 1.0.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Set-Variable-Player-Command
 * @param variable an object containg `Key: Value` pairs of configuration to
 * change
 */
export function setVariable(variable: Record<string, unknown>): ExecuteCommandRequest {
  return executeCommand('SetVariable', variable);
}

/**
 * The Stop Player player command forces the Content Player application to stop
 * immediately.
 *
 * Note: Preferred to use the `stop()` command instead.
 *
 * @since Windows 4.5.0
 * @since Web 5.4.0
 * @since SSP 1.0.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Stop-Player-Player-Command
 */
export function stopPlayer(): ExecuteCommandRequest {
  return executeCommand('StopPlayer');
}

/**
 * The Store Data player command:
 *
 * - Saves data (text) to a file. The Content Player user must have write-access
 *   to the supplied path.
 * - Executing this command multiple times to the same path overwrites the
 *   existing file. The command does not append data to an existing file.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP N/A
 * @since BrightSign N/A
 * @since LG N/A
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Store-Data-Player-Command
 * @param data The data, as a text string, to store.
 * @param path The destination storage location. May be an absolute path, or a
 * relative path where the starting destination is the "Content" folder of the
 * default channel at `%FWI%\Signage\Channels\(default)\Content`.
 * @param channelId A channel ID which serves as the new relative starting path
 * for the Path string above. For instance, if a channel id of "MyChannel" was
 * provided, and a Path of "MyData.txt" was provided, the data would be saved to
 * `%FWI%\Signage\Channels\MyChannel\Content\MyData.txt`.
 */
export function storeData(data: string, path: string, channelId?: string): ExecuteCommandRequest {
  return executeCommand('StoreData', {
    Data: data,
    Path: path,
    ChannelId: channelId,
  });
}

/**
 * The Turn Display Off player command immediately powers off the display using
 * an RS-232 connection.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP 1.3.0
 * @since BrightSign 1.3.0
 * @since LG 1.3.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Turn-Display-Off-Player-Command
 */
export function turnDisplayOff(): ExecuteCommandRequest {
  return executeCommand('DisplayOff');
}

/**
 * The Turn Display On player command immediately powers on the display using
 * an RS-232 connection.
 *
 * @since Windows 4.5.0
 * @since Web N/A
 * @since SSP 1.3.0
 * @since BrightSign 1.3.0
 * @since LG 1.3.0
 * @since IOS N/A
 * @since Android N/A
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Turn-Display-On-Player-Command
 */
export function turnDisplayOn(): ExecuteCommandRequest {
  return executeCommand('DisplayOn');
}

/**
 * The Upload Screenshot player command forces Content Player to immediately
 * upload the most recent screenshot to the predefined upload location.
 *
 * @since Windows 5.0.0
 * @since Web 5.4.0
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android 1.1.0
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Upload-Screenshot-Player-Command
 */
export function uploadScreenshot(): ExecuteCommandRequest {
  return executeCommand('UploadScreenshot');
}

/**
 * The Upload Status player command forces Content Player to immediately upload
 * the status to the predefined upload location.
 *
 * @since Windows 4.5.0
 * @since Web 5.4.0
 * @since SSP 1.1.0
 * @since BrightSign 1.3.0
 * @since LG 1.4.0
 * @since IOS N/A
 * @since Android 1.1.0
 * @since Mac N/A
 * @see https://fourwindsinteractive.force.com/articles/User_Guide/Upload-Status-Player-Command
 */
export function uploadStatus(): ExecuteCommandRequest {
  return executeCommand('UploadStatus');
}
