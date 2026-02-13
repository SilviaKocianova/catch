export class InputManager {
  private keys: Set<string> = new Set();


  private lastSpaceTime = 0;
  private _doubleTapFired = false;

  constructor() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (!this.keys.has(k)) {
        if (k === ' ') {
          const now = Date.now();
          if (now - this.lastSpaceTime < 300) {
            this._doubleTapFired = true;
          }
          this.lastSpaceTime = now;
        }
      }
      this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
  }


  consumeDoubleTap(): boolean {
    if (this._doubleTapFired) {
      this._doubleTapFired = false;
      return true;
    }
    return false;
  }

  isDown(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  anyDown(...keys: string[]): boolean {
    return keys.some(k => this.isDown(k));
  }

  get left():  boolean { return this.anyDown('a', 'arrowleft'); }
  get right(): boolean { return this.anyDown('d', 'arrowright'); }
  get jump():  boolean { return this.anyDown('w', 'arrowup', ' '); }
}