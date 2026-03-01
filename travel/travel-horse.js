// === TRAVEL HORSE ENTITY ===
// Lead horse must clear obstacles. Followers mirror with staggered "ripple" delay.
// Charged jump: hold space to build power, release to launch.
//
// Improvements:
//   • Coyote time    — jump still works a few frames after leaving ground
//   • Jump buffering — pre-press is honoured the moment hooves land
//   • Gravity scaling — fall faster than rise (snappy, feels responsive)
//   • Elastic "string" follower physics — beautiful ripple wave effect

const TravelHorse = (() => {

  function _TC() { return window.TravelConstants; }

  function shadeColor(hex, amount) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return '#8B5E3C';
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
      const TC = _TC();
      this.id         = sourceHorse.id || sourceHorse.barn_name;
      this.name       = sourceHorse.barn_name || sourceHorse.name || 'Horse';
      this.color      = sourceHorse.color || '#8B5E3C';
      this.sourceRef  = sourceHorse;

      this.x          = xPos;
      this.y          = TC.GROUND_Y - TC.HORSE_HEIGHT;
      this.vy         = 0;
      this.onGround   = true;
      this.isLead     = isLead;

      this.dead       = false;
      this.deathTimer = 0;

      this.legPhase   = Math.random() * Math.PI * 2;

      // Jump charge (lead horse)
      this.jumpHeld       = false;
      this.jumpHoldFrames = 0;
      this.jumpLocked     = false;

      // Coyote time — frames remaining where jump is still allowed after leaving ground
      this._coyoteFrames  = 0;
      // Jump buffer — frames remaining where a pre-press will auto-fire on landing
      this._jumpBuffer    = 0;

      // Follower queued jumps (ripple wave)
      this._jumpQueue = [];
    }

    // ---- Lead: begin charging ----
    startJump() {
      if (this.dead || this.jumpLocked) return;
      const canJump = this.onGround || this._coyoteFrames > 0;
      if (!canJump) {
        // Buffer the input so it fires on landing
        const TC = _TC();
        this._jumpBuffer = TC.JUMP_BUFFER_FRAMES;
        return;
      }
      this.jumpHeld       = true;
      this.jumpHoldFrames = 0;
    }

    // ---- Lead: release to launch — returns force so followers can mirror ----
    releaseJump() {
      if (!this.jumpHeld || this.dead) { this.jumpHeld = false; return undefined; }
      const TC    = _TC();
      const ratio = Math.min(1, this.jumpHoldFrames / TC.JUMP_HOLD_FRAMES);
      const force = TC.JUMP_FORCE_MIN + (TC.JUMP_FORCE_MAX - TC.JUMP_FORCE_MIN) * ratio;

      const canJump = this.onGround || this._coyoteFrames > 0;
      if (canJump) {
        this.vy            = force;
        this.onGround      = false;
        this.jumpLocked    = true;
        this._coyoteFrames = 0;
      }
      this.jumpHeld       = false;
      this.jumpHoldFrames = 0;
      return force;
    }

    // ---- Follower: schedule a mirrored jump with ripple delay ----
    scheduleFollowerJump(force, delayFrames) {
      this._jumpQueue.push({ frames: delayFrames, force });
    }

    update() {
      const TC = _TC();

      if (this.dead) {
        this.deathTimer++;
        this.vy += TC.GRAVITY * 0.5;
        this.y  += this.vy;
        return;
      }

      // Charge accumulation while key held on ground (or coyote)
      if (this.isLead && this.jumpHeld && (this.onGround || this._coyoteFrames > 0)) {
        this.jumpHoldFrames = Math.min(TC.JUMP_HOLD_FRAMES, this.jumpHoldFrames + 1);
      }

      // Coyote time countdown
      if (!this.onGround && this._coyoteFrames > 0) {
        this._coyoteFrames--;
      }

      // Jump buffer countdown
      if (this._jumpBuffer > 0) {
        this._jumpBuffer--;
      }

      // Gravity — fall faster than rise for snappy feel
      const gravMult = (this.vy > 0) ? (TC.FALL_GRAVITY_MULT || 1.85) : 1.0;
      this.vy += TC.GRAVITY * gravMult;
      this.y  += this.vy;

      const groundY = TC.GROUND_Y - TC.HORSE_HEIGHT;
      if (this.y >= groundY) {
        const wasAirborne = !this.onGround;
        this.y        = groundY;
        this.vy       = 0;
        this.onGround = true;
        this.jumpLocked   = false;
        this._coyoteFrames = TC.COYOTE_FRAMES || 7;

        // Fire buffered jump the moment we land
        if (this.isLead && wasAirborne && this._jumpBuffer > 0) {
          this._jumpBuffer = 0;
          this.jumpHeld       = true;
          this.jumpHoldFrames = 0;
        }
      } else {
        // Just left the ground — start coyote timer
        if (this.onGround) {
          this._coyoteFrames = TC.COYOTE_FRAMES || 7;
        }
        this.onGround = false;
      }

      // Process follower ripple-wave jump queue
      if (!this.isLead && this._jumpQueue.length) {
        this._jumpQueue = this._jumpQueue.map(j => ({ ...j, frames: j.frames - 1 }));
        const ready = this._jumpQueue.find(j => j.frames <= 0);
        if (ready && this.onGround) {
          this.vy       = ready.force;
          this.onGround = false;
          this._jumpQueue = this._jumpQueue.filter(j => j !== ready);
        }
      }

      if (this.onGround) this.legPhase += 0.22;
    }

    get chargeRatio() {
      const TC = _TC();
      return Math.min(1, this.jumpHoldFrames / TC.JUMP_HOLD_FRAMES);
    }

    getBounds() {
      const TC = _TC();
      return {
        x: this.x + 12,
        y: this.y + 8,
        w: TC.HORSE_WIDTH  - 22,
        h: TC.HORSE_HEIGHT - 14,
      };
    }

    kill() {
      this.dead       = true;
      this.deathTimer = 0;
      this.vy         = -5;
      if (this.sourceRef) {
        this.sourceRef.energy           = 0;
        this.sourceRef.travelExhausted  = true;
        console.log(`⚡ ${this.name} exhausted — needs food+sleep`);
      }
    }

    draw(ctx) {
      const TC    = _TC();
      const alpha = this.dead ? Math.max(0, 1 - this.deathTimer / 40) : 1;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(this.x, this.y);

      if (this.dead) {
        ctx.translate(TC.HORSE_WIDTH / 2, TC.HORSE_HEIGHT / 2);
        ctx.rotate(this.deathTimer * 0.13);
        ctx.translate(-TC.HORSE_WIDTH / 2, -TC.HORSE_HEIGHT / 2);
      }

      const c  = this.color;
      const lp = this.onGround ? this.legPhase : 0;

      // Body
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(30, 25, 28, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Neck
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(48, 15); ctx.lineTo(56, 5); ctx.lineTo(62, 8); ctx.lineTo(54, 20);
      ctx.fill();

      // Head
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(58, 6, 10, 7, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(62, 4, 2, 0, Math.PI * 2); ctx.fill();

      // Nostril
      ctx.fillStyle = '#5a3a1a';
      ctx.beginPath(); ctx.arc(67, 7, 1.5, 0, Math.PI * 2); ctx.fill();

      // Mane
      ctx.fillStyle = shadeColor(c, -40);
      ctx.beginPath();
      ctx.moveTo(50, 3);
      ctx.bezierCurveTo(46, -4, 40, -3, 35, 2);
      ctx.bezierCurveTo(40, 1, 46, 0, 50, 3);
      ctx.fill();

      // Tail
      ctx.strokeStyle = shadeColor(c, -40);
      ctx.lineWidth   = 3;
      ctx.beginPath();
      ctx.moveTo(4, 20);
      ctx.bezierCurveTo(-8, 15, -10, 30, -4, 38);
      ctx.stroke();

      // Legs
      ctx.strokeStyle = c;
      ctx.lineWidth   = 5;
      ctx.lineCap     = 'round';
      _drawLeg(ctx, 42, 38, Math.sin(lp) * 12);
      _drawLeg(ctx, 35, 38, Math.sin(lp + Math.PI) * 12);
      _drawLeg(ctx, 16, 38, Math.sin(lp + Math.PI) * 12);
      _drawLeg(ctx,  9, 38, Math.sin(lp) * 12);

      // Lead crown
      if (this.isLead && !this.dead) {
        ctx.fillStyle = '#ffe840';
        ctx.beginPath();
        ctx.moveTo(54, -4); ctx.lineTo(58, -11); ctx.lineTo(62, -5);
        ctx.lineTo(66, -12); ctx.lineTo(70, -4); ctx.lineTo(66, -2); ctx.lineTo(54, -2);
        ctx.fill();
      }

      // Charge arc (lead, while holding jump)
      if (this.isLead && this.jumpHeld && this.jumpHoldFrames > 3) {
        const ratio = this.chargeRatio;
        ctx.strokeStyle = `rgba(100,200,255,${0.5 + ratio * 0.5})`;
        ctx.lineWidth   = 2 + ratio * 3;
        ctx.beginPath();
        ctx.arc(30, 25, 22 + ratio * 10, Math.PI, 0);
        ctx.stroke();
      }

      ctx.restore();

      // Name tag
      if (!this.dead) {
        ctx.save();
        ctx.font      = '10px system-ui,sans-serif';
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