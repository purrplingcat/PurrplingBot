import chalk from 'chalk'

export default function log(message: any, level: string): void {
  switch (level) {
    case 'info':
      console.log(chalk.whiteBright(`[INFO] ${message}`));
      break;
    case 'warning':
      console.log(chalk.yellowBright(`[WARN] ${message}`));
      break;
    case 'error':
      console.log(chalk.redBright(`[ERROR] ${message}`));
      break;
    case 'ready':
      console.log(chalk.hex('#00FFFF')(`[READY] ${message}`));
      break;
    case 'debug':
      console.log(`[DEBUG] ${message}`);
      break;
    default:
      console.log(message);
      break;
  }
}

export const info = (...args: any[]): void => log(args, 'info');
export const warn = (...args: any[]): void => log(args, 'warning');
export const error = (...args: any[]): void => log(args, 'error');
export const ready = (...args: any[]): void => log(args, 'ready');
export const debug = (...args: any[]): void => log(args, 'debug');
