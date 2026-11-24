import React, { useEffect, useRef } from 'react';
import {
  GOAL_Y_MAX,
  GOAL_Y_MIN,
  LiveMatchEngine,
  PITCH_H,
  PITCH_W,
} from '../engine/matchSimulation';

interface PitchCanvasProps {
  engineRef: React.MutableRefObject<LiveMatchEngine | null>;
}

// Persistent image cache so player photos load once from /player-images/ and render at 60fps
const imageCache = new Map<string, HTMLImageElement>();

function getCachedPlayerImage(url: string): HTMLImageElement | null {
  if (!url) return null;
  let img = imageCache.get(url);
  if (!img) {
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    imageCache.set(url, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

export const PitchCanvas: React.FC<PitchCanvasProps> = ({ engineRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId = 0;

    const renderFrame = () => {
      const canvas = canvasRef.current;
      const engine = engineRef.current;
      if (canvas && engine) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        const targetW = Math.max(320, Math.round(rect.width * dpr));
        const targetH = Math.max(200, Math.round(rect.height * dpr));

        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawPitchScene(ctx, targetW, targetH, dpr, engine);
        }
      }
      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [engineRef]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#07150F]">
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        aria-label="Live 2D fullscreen football pitch"
      />
    </div>
  );
};

function getShortDisplayName(fullName: string): string {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];
  if (parts[0].endsWith('.') && parts.length >= 2) {
    return parts.slice(1).join(' ');
  }
  if (trimmed.length <= 12) return trimmed;
  return parts[parts.length - 1];
}

function drawPitchScene(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  dpr: number,
  engine: LiveMatchEngine
) {
  ctx.save();

  const targetRatio = PITCH_W / PITCH_H;
  const outerMarginX = Math.max(22 * dpr, W * 0.032);
  const outerMarginY = Math.max(18 * dpr, H * 0.035);
  const availW = W - outerMarginX * 2;
  const availH = H - outerMarginY * 2;

  let fieldW = availW;
  let fieldH = fieldW / targetRatio;
  if (fieldH > availH) {
    fieldH = availH;
    fieldW = fieldH * targetRatio;
  }

  const padX = (W - fieldW) / 2;
  const padY = (H - fieldH) / 2;

  const toX = (px: number) => padX + (px / PITCH_W) * fieldW;
  const toY = (py: number) => padY + (py / PITCH_H) * fieldH;
  const scaleX = fieldW / PITCH_W;
  const scaleY = fieldH / PITCH_H;

  // 1. Dark floodlit stadium surround
  ctx.fillStyle = '#071710';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#0A2518';
  ctx.fillRect(
    padX - Math.min(24 * dpr, padX * 0.7),
    padY - Math.min(18 * dpr, padY * 0.7),
    fieldW + Math.min(24 * dpr, padX * 0.7) * 2,
    fieldH + Math.min(18 * dpr, padY * 0.7) * 2
  );

  // 2. Mowed alternating emerald grass stripes
  const stripeCount = 12;
  const stripeW = fieldW / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#0F5434' : '#14663F';
    ctx.fillRect(padX + i * stripeW, padY, stripeW + 0.6, fieldH);
  }

  // Stadium floodlight glow
  const lightGrad = ctx.createRadialGradient(
    W * 0.5,
    H * 0.5,
    fieldH * 0.12,
    W * 0.5,
    H * 0.5,
    fieldW * 0.68
  );
  lightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.09)');
  lightGrad.addColorStop(0.68, 'rgba(255, 255, 255, 0.01)');
  lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  ctx.fillStyle = lightGrad;
  ctx.fillRect(padX, padY, fieldW, fieldH);

  // 3. White pitch markings
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.78)';
  ctx.lineWidth = Math.max(1.5, 1.75 * dpr);
  ctx.strokeRect(padX, padY, fieldW, fieldH);

  ctx.beginPath();
  ctx.moveTo(toX(50), padY);
  ctx.lineTo(toX(50), padY + fieldH);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(toX(50), toY(32), 9.15 * scaleY, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(248, 250, 252, 0.9)';
  ctx.beginPath();
  ctx.arc(toX(50), toY(32), 2.8 * dpr, 0, Math.PI * 2);
  ctx.fill();

  const penW = 16.5 * scaleX;
  const penH = 40.3 * scaleY;
  const penY = toY(32) - penH / 2;
  ctx.strokeRect(padX, penY, penW, penH);
  ctx.strokeRect(padX + fieldW - penW, penY, penW, penH);

  const sixW = 5.5 * scaleX;
  const sixH = 18.3 * scaleY;
  const sixY = toY(32) - sixH / 2;
  ctx.strokeRect(padX, sixY, sixW, sixH);
  ctx.strokeRect(padX + fieldW - sixW, sixY, sixW, sixH);

  ctx.beginPath();
  ctx.arc(toX(11.5), toY(32), 2.2 * dpr, 0, Math.PI * 2);
  ctx.arc(toX(88.5), toY(32), 2.2 * dpr, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(toX(11.5), toY(32), 9.15 * scaleY, -0.64, 0.64);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(toX(88.5), toY(32), 9.15 * scaleY, Math.PI - 0.64, Math.PI + 0.64);
  ctx.stroke();

  const cr = 2.0 * scaleY;
  ctx.beginPath();
  ctx.arc(padX, padY, cr, 0, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(padX + fieldW, padY, cr, Math.PI / 2, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(padX, padY + fieldH, cr, -Math.PI / 2, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(padX + fieldW, padY + fieldH, cr, Math.PI, Math.PI * 1.5);
  ctx.stroke();

  // 4. Goals
  const goalTop = toY(GOAL_Y_MIN);
  const goalBot = toY(GOAL_Y_MAX);
  const goalH = goalBot - goalTop;
  const goalDepth = Math.min(26 * dpr, Math.max(14 * dpr, padX * 0.68));

  const drawGoal = (xStart: number, depth: number) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(xStart, goalTop, depth, goalH);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 0.9 * dpr;
    ctx.beginPath();
    for (let i = 1; i < 7; i++) {
      const y = goalTop + (goalH * i) / 7;
      ctx.moveTo(xStart, y);
      ctx.lineTo(xStart + depth, y);
    }
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.6 * dpr;
    ctx.strokeRect(xStart, goalTop, depth, goalH);
  };

  drawGoal(padX - goalDepth, goalDepth);
  drawGoal(padX + fieldW, goalDepth);

  const swapped = engine.phase === 'SECOND_HALF';
  const leftTeam = swapped ? engine.awayClub : engine.homeClub;
  const rightTeam = swapped ? engine.homeClub : engine.awayClub;

  ctx.font = `700 ${Math.round(11 * dpr)}px "Oswald", sans-serif`;
  ctx.fillStyle = 'rgba(248, 250, 252, 0.45)';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillText(`${leftTeam.name.toUpperCase()} END`, padX + 4 * dpr, padY - 6 * dpr);
  ctx.textAlign = 'right';
  ctx.fillText(`${rightTeam.name.toUpperCase()} END`, padX + fieldW - 4 * dpr, padY - 6 * dpr);

  // 5. Render ALL 22 Players with Player Photo inside Circle + Jersey Number + Name
  const playerR = Math.max(12.5 * dpr, Math.min(19.5 * dpr, fieldH * 0.033));
  const nameFontSize = Math.max(9.5 * dpr, Math.min(12.5 * dpr, playerR * 0.72));

  for (const p of engine.entities) {
    const cx = toX(p.x);
    const cy = toY(p.y);
    const club = p.teamSide === 'home' ? engine.homeClub : engine.awayClub;
    const isCarrier = engine.ball.ownerId === p.playerId;
    const isDiving = p.position === 'GK' && p.diveTimer > 0;

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + playerR * 0.82, playerR * 1.0, playerR * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();

    // Active ball carrier highlight halo
    if (isCarrier) {
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2.8 * dpr;
      ctx.beginPath();
      ctx.arc(cx, cy, playerR * 1.28, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Circular player avatar clipped with portrait photo from /player-images/
    const photoImg = getCachedPlayerImage(p.photoUrl);

    ctx.save();
    ctx.translate(cx, cy);
    if (isDiving) {
      ctx.scale(0.88, 1.32);
    }

    // Base fill fallback
    ctx.beginPath();
    ctx.arc(0, 0, playerR, 0, Math.PI * 2);
    ctx.fillStyle = p.position === 'GK' ? '#0F172A' : club.primaryColor;
    ctx.fill();

    // Draw player photo clipped to circle
    if (photoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, playerR - 1 * dpr, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(photoImg, -playerR, -playerR, playerR * 2, playerR * 2);
      ctx.restore();
    }

    // Team kit border ring around circular photo
    ctx.beginPath();
    ctx.arc(0, 0, playerR, 0, Math.PI * 2);
    ctx.strokeStyle =
      p.position === 'GK'
        ? p.teamSide === 'home'
          ? '#FACC15'
          : '#38BDF8'
        : club.primaryColor;
    ctx.lineWidth = 2.8 * dpr;
    ctx.stroke();

    // Subtle crisp outer highlight ring for visibility on turf
    ctx.beginPath();
    ctx.arc(0, 0, playerR + 1.2 * dpr, 0, Math.PI * 2);
    ctx.strokeStyle = isCarrier ? '#FDE047' : 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1.1 * dpr;
    ctx.stroke();

    ctx.restore();

    // Compact Jersey Number Badge on top-right edge of circle
    const badgeR = Math.max(6.2 * dpr, playerR * 0.42);
    const bx = cx + playerR * 0.72;
    const by = cy - playerR * 0.72;

    ctx.fillStyle = p.position === 'GK' ? '#0F172A' : club.primaryColor;
    ctx.beginPath();
    ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.2 * dpr;
    ctx.stroke();

    ctx.fillStyle = p.position === 'GK' ? '#FACC15' : club.secondaryColor;
    ctx.font = `700 ${Math.round(badgeR * 1.12)}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(p.number), bx, by + 0.4 * dpr);

    // ALWAYS draw Player Name right beneath every player circle
    const shortName = getShortDisplayName(p.name);
    ctx.font = `${isCarrier ? '700' : '600'} ${Math.round(nameFontSize)}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const labelY = cy + playerR + 3.5 * dpr;

    ctx.lineWidth = 3.4 * dpr;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(6, 12, 20, 0.94)';
    ctx.strokeText(shortName, cx, labelY);

    ctx.fillStyle = isCarrier ? '#FDE047' : '#F8FAFC';
    ctx.fillText(shortName, cx, labelY);
  }

  // 6. Ball Trail
  const ball = engine.ball;
  if (ball.trail.length > 1) {
    for (let i = 1; i < ball.trail.length; i++) {
      const alpha = (i / ball.trail.length) * (ball.isShot ? 0.62 : 0.28);
      ctx.strokeStyle = ball.isShot
        ? `rgba(250, 204, 21, ${alpha})`
        : `rgba(248, 250, 252, ${alpha})`;
      ctx.lineWidth = (ball.isShot ? 4.2 : 2.2) * dpr * (i / ball.trail.length);
      ctx.beginPath();
      ctx.moveTo(toX(ball.trail[i - 1].x), toY(ball.trail[i - 1].y));
      ctx.lineTo(toX(ball.trail[i].x), toY(ball.trail[i].y));
      ctx.stroke();
    }
  }

  // 7. Football with elevation shadow
  const ballX = toX(ball.x);
  const ballY = toY(ball.y);
  const ballR = Math.max(5.5 * dpr, playerR * 0.4);
  const lift = Math.min(14 * dpr, ball.z * 1.45 * dpr);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(ballX + lift * 0.25, ballY + ballR * 0.75, ballR * 1.1, ballR * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(ballX, ballY - lift, ballR + lift * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.4 * dpr;
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(ballX, ballY - lift, ballR * 0.36, 0, Math.PI * 2);
  ctx.fill();

  // 8. Celebration Particles
  for (const pt of engine.particles) {
    const alpha = Math.max(0, Math.min(1, pt.life / pt.maxLife));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(toX(pt.x), toY(pt.y), pt.size * scaleX * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}
