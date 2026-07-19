export function renderHud(ctx, { score, level, lives, canvasWidth, canvasHeight }) {
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillStyle = '#ffffff';

  ctx.textAlign = 'left';
  ctx.fillText(`${String(score).padStart(6, '0')}`, 8, 12);

  ctx.textAlign = 'right';
  ctx.fillText(`ROUND ${level + 1}`, canvasWidth - 8, 12);

  const iconWidth = 12;
  const iconHeight = 3;
  const gap = 4;
  const y = canvasHeight - 10;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e0e0e0';
  for (let i = 0; i < lives; i += 1) {
    ctx.fillRect(8 + i * (iconWidth + gap), y, iconWidth, iconHeight);
  }
}

export function renderCenterMessage(ctx, canvasWidth, canvasHeight, lines) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px "Press Start 2P", monospace';

  const lineHeight = 16;
  const startY = canvasHeight / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, canvasWidth / 2, startY + i * lineHeight);
  });
}
