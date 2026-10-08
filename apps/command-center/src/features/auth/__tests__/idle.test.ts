import { IDLE_TIMEOUT_MS, IDLE_WARNING_MS, idlePhase } from '../idle';

describe('idlePhase', () => {
  const start = 1_000_000;
  it('is active until the warning window', () => {
    expect(idlePhase(start, start)).toBe('active');
    expect(idlePhase(start + IDLE_TIMEOUT_MS - IDLE_WARNING_MS - 1, start)).toBe('active');
  });
  it('warns in the last two minutes', () => {
    expect(idlePhase(start + IDLE_TIMEOUT_MS - IDLE_WARNING_MS, start)).toBe('warning');
    expect(idlePhase(start + IDLE_TIMEOUT_MS - 1, start)).toBe('warning');
  });
  it('expires at the limit, including time spent in the background', () => {
    expect(idlePhase(start + IDLE_TIMEOUT_MS, start)).toBe('expired');
    expect(idlePhase(start + 5 * IDLE_TIMEOUT_MS, start)).toBe('expired');
  });
});
