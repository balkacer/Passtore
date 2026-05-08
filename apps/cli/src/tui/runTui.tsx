import { render } from 'ink';
import { TuiApp } from './TuiApp.js';

export async function runTui(): Promise<void> {
  const instance = render(<TuiApp />);
  await instance.waitUntilExit();
}
