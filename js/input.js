export class InputManager {
  constructor() {
    this._down = new Set();
    this._pressedEdge = new Set();

    this._onKeyDown = (e) => {
      if (!this._down.has(e.code)) this._pressedEdge.add(e.code);
      this._down.add(e.code);
    };
    this._onKeyUp = (e) => {
      this._down.delete(e.code);
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  isDown(code) {
    return this._down.has(code);
  }

  // Edge-triggered: true once per physical key press, regardless of how
  // many update ticks pass before it's checked.
  consumePress(code) {
    if (this._pressedEdge.has(code)) {
      this._pressedEdge.delete(code);
      return true;
    }
    return false;
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
