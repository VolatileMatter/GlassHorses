// === TRAVEL HORSE ENTITY ===
// Jump model: press = instant launch, hold = reduced gravity (floaty ascent),
//             release = normal+fast gravity kicks in immediately.
// Horizontal lunge: horse moves to LEAD_X+LUNGE_FORWARD while airborne,
//                   very slowly drifts back to baseX after landing.

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
      this.id        = sourceHorse.id || sourceHorse.barn_name;
      this.name      = sourceHorse.barn_name || sourceHorse.name || 'Horse';
      this.color     = sourceHorse.color || '#8B5E3C';
      this.sourceRef = sourceHorse;

      this.baseX     = xPos;   // resting X position — horse drifts back here after landing
      this.x         = xPos;
      this.y         = TC.GROUND_Y - TC.HORSE_HEIGHT;
      this.vy        = 0;
      this.onGround  = true;
      this.isLead    = isLead;

      this.dead          = false;
      this.deathTimer    = 0;
      this.immunityFrames = 0;   // >0 = ghost through obstacles
      this.legPhase      = Math.random() * Math.PI * 2;

      // Jump state
      this.jumpHeld    = false;
      this.holdFrames  = 0;
      this.jumpLocked  = false;   // true while airborne, prevents double-jump

      // Coyote / buffer
      this._coyoteFrames = 0;
      this._jumpBuffer   = 0;

      // Follower ripple queue
      this._jumpQueue = [];
    }

    startJump() {
      if (this.dead || this.jumpLocked) return;
      const TC = _TC();
      const canJump = this.onGround || this._coyoteFrames > 0;
      if (!canJump) {
        this._jumpBuffer = TC.JUMP_BUFFER_FRAMES;
        return;
      }
      this._doLaunch();
    }

    _doLaunch() {
      const TC = _TC();
      this.vy           = TC.JUMP_VELOCITY;
      this.onGround     = false;
      this.jumpLocked   = true;
      this.jumpHeld     = true;
      this.holdFrames   = 0;
      this._coyoteFrames = 0;
      // Snap to lunge position immediately on takeoff
      this.x = this.baseX + TC.LUNGE_FORWARD;
    }

    releaseJump() {
      this.jumpHeld  = false;
      this.holdFrames = 0;
    }

    scheduleFollowerJump(force, delayFrames) {
      this._jumpQueue.push({ frames: delayFrames });
    }

    update() {
      const TC = _TC();

      if (this.dead) {
        this.deathTimer++;
        this.vy += TC.GRAVITY * 0.5;
        this.y  += this.vy;
        return;
      }

      if (this.immunityFrames > 0) this.immunityFrames--;

      // Countdowns
      if (!this.onGround && this._coyoteFrames > 0) this._coyoteFrames--;
      if (this._jumpBuffer > 0) this._jumpBuffer--;

      // Gravity selection
      let grav;
      if (this.vy < 0 && this.jumpHeld && this.holdFrames < TC.MAX_HOLD_FRAMES) {
        grav = TC.HOLD_GRAVITY;   // still rising AND button held → float
        this.holdFrames++;
      } else if (this.vy > 0) {
        grav = TC.GRAVITY * TC.FALL_GRAVITY_MULT;   // falling → punchy
      } else {
        grav = TC.GRAVITY;
      }

      this.vy += grav;
      this.y  += this.vy;

      // While airborne: hold x at lunge position (horse surges forward the whole arc)
      if (!this.onGround) {
        this.x = this.baseX + TC.LUNGE_FORWARD;
      }

      // Ground collision
      const groundY = TC.GROUND_Y - TC.HORSE_HEIGHT;
      if (this.y >= groundY) {
        const wasAirborne = !this.onGround;
        this.y         = groundY;
        this.vy        = 0;
        this.onGround  = true;
        this.jumpLocked = false;
        this.jumpHeld  = false;
        this.holdFrames = 0;
        this._coyoteFrames = TC.COYOTE_FRAMES;

        // Fire buffered jump on landing
        if (this.isLead && wasAirborne && this._jumpBuffer > 0) {
          this._jumpBuffer = 0;
          this._doLaunch();
        }
      } else {
        if (this.onGround) this._coyoteFrames = TC.COYOTE_FRAMES;
        this.onGround = false;
      }

      // After landing: very slowly drift x back to baseX
      if (this.onGround && Math.abs(this.x - this.baseX) > 0.2) {
        this.x += (this.baseX - this.x) * TC.LUNGE_RETURN;
      } else if (this.onGround) {
        this.x = this.baseX;
      }

      // Follower ripple
      if (!this.isLead && this._jumpQueue.length) {
        this._jumpQueue = this._jumpQueue.map(j => ({ frames: j.frames - 1 }));
        const ready = this._jumpQueue.find(j => j.frames <= 0);
        if (ready && this.onGround) {
          this._jumpQueue = this._jumpQueue.filter(j => j !== ready);
          this._doLaunch();
        }
      }

      if (this.onGround) this.legPhase += 0.22;
    }

    getBounds() {
      if (this.immunityFrames > 0) return null;   // ghost — skip collision
      const TC = _TC();
      const s  = TC.HORSE_SCALE || 0.72;
      return {
        x: this.x + 12 * s,
        y: this.y + 8  * s,
        w: (TC.HORSE_WIDTH  - 22) * s,
        h: (TC.HORSE_HEIGHT - 14) * s,
      };
    }

    kill() {
      this.dead       = true;
      this.deathTimer = 0;
      this.vy         = -5;
      if (this.sourceRef) {
        this.sourceRef.energy          = 0;
        this.sourceRef.travelExhausted = true;
        console.log(`⚡ ${this.name} exhausted`);
      }
    }

    draw(ctx) {
      const TC    = _TC();
      const scale = TC.HORSE_SCALE || 0.72;
      const alpha = this.dead ? Math.max(0, 1 - this.deathTimer / 40) : 1;

      // Ghost flicker while immune: alternate between normal and translucent cyan tint
      const isImmune = this.immunityFrames > 0;
      const flickerOn = isImmune && (Math.floor(this.immunityFrames / 2) % 2 === 0);

      ctx.save();
      ctx.globalAlpha = flickerOn ? 0.45 : alpha;
      ctx.translate(this.x, this.y + TC.HORSE_HEIGHT * (1 - scale));
      ctx.scale(scale, scale);

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

      // Hold indicator: arc showing remaining hold time while airborne + held
      if (this.isLead && this.jumpHeld && !this.onGround) {
        const remaining = 1 - Math.min(1, this.holdFrames / (TC.MAX_HOLD_FRAMES || 18));
        ctx.strokeStyle = `rgba(100,220,255,${0.3 + remaining * 0.6})`;
        ctx.lineWidth   = 2 + remaining * 2;
        ctx.beginPath();
        ctx.arc(30, 20, 26, -Math.PI / 2, -Math.PI / 2 + remaining * Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // Name tag
      if (!this.dead) {
        ctx.save();
        ctx.font      = '10px system-ui,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.isLead ? '#ffe840' : 'rgba(255,255,255,0.7)';
        ctx.fillText(this.name, this.x + 30 * scale, this.y - 4);
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