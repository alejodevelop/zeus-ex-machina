import { SceneKey } from '../game/scenes/scene-keys';

const AGENT_START_SCENES = [SceneKey.Game, SceneKey.Menu] as const;

export type AgentStartScene = (typeof AGENT_START_SCENES)[number];

export interface AgentLaunchOptions {
  enabled: boolean;
  showHud: boolean;
  startScene: AgentStartScene | null;
}

export function parseAgentLaunchOptions(search: string, isDev: boolean): AgentLaunchOptions {
  const params = new URLSearchParams(search);
  const enabled = isDev && readFlag(params.get('agent-tools'));

  return {
    enabled,
    showHud: enabled && readFlag(params.get('hud'), true),
    startScene: enabled ? parseStartScene(params.get('scene')) : null,
  };
}

function parseStartScene(rawValue: string | null): AgentStartScene | null {
  if (rawValue === null) {
    return null;
  }

  const normalizedValue = rawValue.trim().toLowerCase();

  return AGENT_START_SCENES.find((sceneKey) => sceneKey === normalizedValue) ?? null;
}

function readFlag(rawValue: string | null, fallback = false): boolean {
  if (rawValue === null) {
    return fallback;
  }

  const normalizedValue = rawValue.trim().toLowerCase();

  if (
    normalizedValue === '' ||
    normalizedValue === '1' ||
    normalizedValue === 'true' ||
    normalizedValue === 'yes' ||
    normalizedValue === 'on'
  ) {
    return true;
  }

  if (
    normalizedValue === '0' ||
    normalizedValue === 'false' ||
    normalizedValue === 'no' ||
    normalizedValue === 'off'
  ) {
    return false;
  }

  return fallback;
}
