// === TRAVEL HORSE ENTITY ===
// Represents a horse in travel mode.
// Only the lead horse needs to clear obstacles.
// Followers mirror the lead with a slight delay.

const TravelHorse = (() => {
  const C = () => window.TravelConstants;

  function shadeColor(hex, amount) {
    if (!hex || !hex.startsWith('#')) return hex || '#8B5E3C';
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    return `rgb(${r},${g},${b})`;
  }

  class Horse {
    constructor(sourceHorse, xPos, isLead) {
      const C2 = C();
      this.id = sourceHorse.id || sourceHorse.barn_name;
      this.name = sourceHorse.barn_name || sourceHorse.name || 'Horse';
      this.color = sourceHorse.color || '#8B5E3C';
      this.sourceRef = sourceHorse; // reference into HorseManager's live data

      this.x = xPos;
      this.y = C2.GROUND_Y - C2.HORSE_HEIGHT;
      this.vy = 0;
      this.onGround = true;
      this.isLead = isLead;

      // Death / exit state
      this.dead = false;
      this.deathTimer = 0;

      // Animation
      this.legPhase = Math.random() * Math.PI * 2;

      // Jump charge (for lead horse)
      this.jumpHeld = false;
      this.jumpHoldFrames = 0;
      this.jumpLocked = false; // prevent re-jump mid-air while holding

      // Follower: mirrored jump history from lead
      this._jumpQueue = []; // { framesUntilJump, force }

      // Visual trail for followers (y history of lead)
      this._yHistory = [];
    }

    // --- Lead horse: start charging ---
    startJump() {
      if (!this.onGround || this.dead || this.jumpLocked) return;
      this.jumpHeld = true;
      this.jumpHoldFrames = 0;
    }

    // --- Lead horse: release to jump ---
    releaseJump() {
      if (!this.jumpHeld || this.dead) return;
      const C2 = C();
      const ratio = Math.min(1, this.jumpHoldFrames / C2.JUMP_HOLD_FRAMES);
      const force = C2.JUMP_FORCE_MIN + (C2.JUMP_FORCE_MAX - C2.JUMP_FORCE_MIN) * ratio;
      if (this.onGround) {
        this.vy = force;
        this.onGround = false;
        this.jumpLocked = true;
      }
      this.jumpHeld = false;
      this.jumpHoldFrames = 0;
      return force; // returned so followers can mirror
    }

    // --- Follower: schedule a mirrored jump ---
    scheduleFollowerJump(force, delayFrames) {
      this._jumpQueue.push({ frames: delayFrames, force });
    }

    update() {
      const C2 = C();

      if (this.dead) {
        this.deathTimer++;
        // Tumble off bottom
        this.vy += C2.GRAVITY * 0.5;
        this.y += this.vy;
        return;
      }

      // Charge accumulation (lead)
      if (this.isLead && this.jumpHeld && this.onGround) {
        this.jumpHoldFrames = Math.min(C2.JUMP_HOLD_FRAMES, this.jumpHoldFrames + 1);
      }

      // Physics
      this.vy += C2.GRAVITY;
      this.y += this.vy;

      if (this.y >= C2.GROUND_Y - C2.HORSE_HEIGHT) {
        this.y = C2.GROUND_Y - C2.HORSE_HEIGHT;
        this.vy = 0;
        this.onGround = true;
        this.jumpLocked = false;
      }

      // Follower jump queue
      if (!this.isLead) {
        this._jumpQueue = this._jumpQueue.map(j => ({ ...j, frames: j.frames - 1 }));
        const ready = this._jumpQueue.find(j => j.frames <= 0);
        if (ready && this.onGround) {
          this.vy = ready.force;
          this.onGround = false;
          this._jumpQueue = this._jumpQueue.filter(j => j !== ready);
        }
      }

      this.legPhase += this.onGround ? 0.22 : 0;
    }

    getBounds() {
      // Tighter hitbox (more forgiving)
      return {
        x: this.x + 12,
        y: this.y + 8,
        w: C().HORSE_WIDTH - 22,
        h: C().HORSE_HEIGHT - 14,
      };
    }

    kill() {
      this.dead = true;
      this.deathTimer = 0;
      this.vy = -6; // little hop on death
      // Drain energy on source horse
      if (this.sourceRef) {
        this.sourceRef.energy = 0;
        this.sourceRef.travelExhausted = true;
        console.log(`⚡ ${this.name} exhausted — needs food & sleep before travelling again`);
      }
    }

    get chargeRatio() {
      return Math.min(1, this.jumpHoldFrames / C().JUMP_HOLD_FRAMES);
    }

    draw(ctx) {
      const C2 = C();
      const alpha = this.dead ? Math.max(0, 1 - this.deathTimer / 40) : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(this.x, this.y);

      if (this.dead) {
        ctx.translate(C2.HORSE_WIDTH / 2, C2.HORSE_HEIGHT / 2);
        ctx.rotate(this.deathTimer * 0.13);
        ctx.translate(-C2.HORSE_WIDTH / 2, -C2.HORSE_HEIGHT / 2);
      }

      const c = this.color;
      const lp = this.onGround ? this.legPhase : 0;

      // Body
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(30, 25, 28, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Neck
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(48, 15);
      ctx.lineTo(56, 5);
      ctx.lineTo(62, 8);
      ctx.lineTo(54, 20);
      ctx.fill();

      // Head
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(58, 6, 10, 7, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(62, 4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Nostril
      ctx.fillStyle = '#5a3a1a';
      ctx.beginPath();
      ctx.arc(67, 7, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Mane
      ctx.fillStyle = shadeColor(c, -40);
      ctx.beginPath();
      ctx.moveTo(50, 3);
      ctx.bezierCurveTo(46, -4, 40, -3, 35, 2);
      ctx.bezierCurveTo(40, 1, 46, 0, 50, 3);
      ctx.fill();

      // Tail
      ctx.strokeStyle = shadeColor(c, -40);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(4, 20);
      ctx.bezierCurveTo(-8, 15, -10, 30, -4, 38);
      ctx.stroke();

      // Legs
      ctx.strokeStyle = c;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      _drawLeg(ctx, 42, 38, Math.sin(lp) * 12);
      _drawLeg(ctx, 35, 38, Math.sin(lp + Math.PI) * 12);
      _drawLeg(ctx, 16, 38, Math.sin(lp + Math.PI) * 12);
      _drawLeg(ctx, 9,  38, Math.sin(lp) * 12);

      // Lead crown indicator
      if (this.isLead && !this.dead) {
        ctx.fillStyle = '#ffe840';
        ctx.beginPath();
        // Small crown above head
        ctx.moveTo(54, -4);
        ctx.lineTo(58, -10);
        ctx.lineTo(62, -5);
        ctx.lineTo(66, -11);
        ctx.lineTo(70, -4);
        ctx.lineTo(66, -2);
        ctx.lineTo(54, -2);
        ctx.fill();
      }

      // Jump charge indicator (lead only, while holding)
      if (this.isLead && this.jumpHeld && this.jumpHoldFrames > 2) {
        const ratio = this.chargeRatio;
        ctx.strokeStyle = `rgba(100, 200, 255, ${0.5 + ratio * 0.5})`;
        ctx.lineWidth = 2 + ratio * 3;
        ctx.beginPath();
        ctx.arc(30, 25, 22 + ratio * 10, Math.PI, 0);
        ctx.stroke();
      }

      ctx.restore();

      // Name label (above horse)
      if (!this.dead) {
        ctx.save();
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.isLead ? '#ffe840' : 'rgba(255,255,255,0.7)';
        ctx.fillText(this.name, this.x + 30, this.y - 6);
        ctx.restore();
      }
    }
  }

  function _drawLeg(ctx, bx, by, swing) {
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + swing * 0.4, by + 14);
    ctx.lineTo(bx + swing * 0.6, by + 26);
    ctx.stroke();
  }

  return { Horse };
})();

window.TravelHorse = TravelHorse;
console.log('✅ travel-horse.js loaded');