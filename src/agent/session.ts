import { parseAgentLaunchOptions } from './launch-options';

export const agentLaunchOptions = parseAgentLaunchOptions(window.location.search, import.meta.env.DEV);
