import { describe, expect, it } from 'vitest';

import { SceneKey } from '../game/scenes/scene-keys';
import { parseAgentLaunchOptions } from './launch-options';

describe('parseAgentLaunchOptions', () => {
  it('keeps agent tooling disabled without the query flag', () => {
    expect(parseAgentLaunchOptions('', true)).toEqual({
      enabled: false,
      showHud: false,
      startScene: null,
    });
  });

  it('enables the hud and a valid start scene in dev mode', () => {
    expect(parseAgentLaunchOptions('?agent-tools=1&scene=game', true)).toEqual({
      enabled: true,
      showHud: true,
      startScene: SceneKey.Game,
    });
  });

  it('allows a clean screenshot mode while keeping the bridge active', () => {
    expect(parseAgentLaunchOptions('?agent-tools=1&hud=0&scene=menu', true)).toEqual({
      enabled: true,
      showHud: false,
      startScene: SceneKey.Menu,
    });
  });

  it('ignores agent flags outside dev mode', () => {
    expect(parseAgentLaunchOptions('?agent-tools=1&scene=game', false)).toEqual({
      enabled: false,
      showHud: false,
      startScene: null,
    });
  });

  it('ignores unsupported scene shortcuts', () => {
    expect(parseAgentLaunchOptions('?agent-tools=1&scene=boot', true)).toEqual({
      enabled: true,
      showHud: true,
      startScene: null,
    });
  });
});
