export class ScreenManager {
  private startEl:    HTMLElement;
  private winEl:      HTMLElement;
  private gameOverEl: HTMLElement;
  private startBtn:   HTMLButtonElement;
  constructor(private onStart: () => void) {
    this.startEl    = document.getElementById('start-screen')!;
    this.winEl      = document.getElementById('win-screen')!;
    this.gameOverEl = document.getElementById('game-over-screen')!;
    this.startBtn   = document.getElementById('start-btn')! as HTMLButtonElement;
    this.startBtn.addEventListener('click', () => {
      this.hideStart();
      this.onStart();
    });
  }
  showStart(): void    { this.startEl.style.display    = 'flex'; }
  hideStart(): void    { this.startEl.style.display    = 'none'; }
  showWin(message?: string): void {
    if (message) {
      const msgEl = document.getElementById('win-message');
      if (msgEl) msgEl.innerHTML = message;
    }
    this.winEl.style.display = 'flex';
  }
  hideWin(): void { this.winEl.style.display = 'none'; }
  showGameOver(): void { this.gameOverEl.style.display = 'flex'; }
  hideGameOver(): void { this.gameOverEl.style.display = 'none'; }
}