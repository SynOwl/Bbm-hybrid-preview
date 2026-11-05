export function spawnConfettiCSS(_id?: string): void {
  if (typeof document === 'undefined') return;
  const colors = ['#FF78F0', '#64DCFF', '#FFD700', '#FF5252', '#AB47BC', '#03A9F4'];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('div');
    const size = 6 + Math.random() * 8;
    c.style.cssText = `
      position: fixed;
      top: -20px;
      left: ${Math.random() * 100}vw;
      width: ${size}px;
      height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() < 0.5 ? '50%' : '2px'};
      z-index: 9999;
      pointer-events: none;
      animation: confettiFall ${2 + Math.random() * 2}s linear ${Math.random() * 0.5}s forwards;
    `;
    document.body.appendChild(c);
    setTimeout(() => {
      if (c.parentNode) c.parentNode.removeChild(c);
    }, 5000);
  }
}
