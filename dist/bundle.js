"use strict";
(() => {

  var CANVAS_W = 800;
  var CANVAS_H = 450;
  var WORLD_W = 6e3;
  var GRAVITY = 0.45;
  var GROUND_Y = CANVAS_H - 80;
  var PLAYER_SPEED = 4;
  var PLAYER_JUMP_FORCE = -11;
  var HEART_MAX_SPEED = 5.2;
  var HEART_ACCEL = 0.18;
  var HEART_FLEE_RADIUS = 300;
  var HEART_JUMP_RADIUS = 150;
  var HEART_JUMP_COOLDOWN = 60;
  var HEART_NEAR_END_ZONE = 300;
  var DOG_SPEED = 3.2;
  var DOG_START_OFFSET = -300;
  var DOG_BITE_RADIUS_X = 28;
  var DOG_BITE_RADIUS_Y = 28;
  var DOG_SLOW_ZONE = 800;
  var SPACE_GRAVITY = 0.04;
  var SPACE_FLOAT_SPEED = 2.5;
  var HEART_FLOAT_TRIGGER = 500;
  var MOON_X = WORLD_W - 300;
  var MOON_Y = -900;
  var MOON_RADIUS = 120;
  var HEART_ORBIT_RADIUS = 180;
  var SPACE_WIN_RADIUS = 70;
  var CAMERA_LEAD = 0.38;
  var CAMERA_LERP = 0.1;
  var BG_ELEMENT_COUNT = 300;
  var PLATFORM_COUNT = 25;
  var COLORS = {
    heartRed: "#ff3060",
    heartPink: "#ffb3c1",
    heartGlow: "rgba(255,80,110,0.4)",
    playerBody: "#c8607c",
    playerHead: "#e8a0a8",
    playerLimb: "#a04060",
    groundTop: "#3d1a28",
    groundBottom: "#1a0810",
    groundLine: "rgba(255,100,130,0.35)",
    bgStar: "#ffb3c6",
    bgPetal: "#ff8fa3",
    bgDark: "#110408",
    bgMid: "#1e0810",
    bgLight: "#2a1020",
    platformTop: "rgba(200,80,110,0.4)",
    platformBottom: "rgba(100,30,50,0.2)",
    platformStroke: "rgba(255,100,130,0.4)",
    particleStep: "rgba(255,150,170,0.5)"
  };

  
  var InputManager = class {
    constructor() {
      this.keys = /* @__PURE__ */ new Set();
      this.lastSpaceTime = 0;
      this._doubleTapFired = false;
      window.addEventListener("keydown", (e) => {
        const k = e.key.toLowerCase();
        if (!this.keys.has(k)) {
          if (k === " ") {
            const now = Date.now();
            if (now - this.lastSpaceTime < 300) {
              this._doubleTapFired = true;
            }
            this.lastSpaceTime = now;
          }
        }
        this.keys.add(k);
      });
      window.addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));
    }

    consumeDoubleTap() {
      if (this._doubleTapFired) {
        this._doubleTapFired = false;
        return true;
      }
      return false;
    }
    isDown(key) {
      return this.keys.has(key.toLowerCase());
    }
    anyDown(...keys) {
      return keys.some((k) => this.isDown(k));
    }
    get left() {
      return this.anyDown("a", "arrowleft");
    }
    get right() {
      return this.anyDown("d", "arrowright");
    }
    get jump() {
      return this.anyDown("w", "arrowup", " ");
    }
  };


  var Player = class {
    constructor(startX, startY) {
      this.vx = 0;
      this.vy = 0;
      this.w = 28;
      this.h = 36;
      this.onGround = false;
      this.facing = 1;
      this.isAstronaut = false;
      this.animFrame = 0;
      this.animTimer = 0;
      this.stepParticleTimer = 0;
      this.thrustTimer = 0;
      this.x = startX;
      this.y = startY;
    }
    update(input, world, particles) {
      if (this.isAstronaut) {
        this.updateAstronaut(input, particles);
      } else {
        this.updateNormal(input, world, particles);
      }
      this.animTimer++;
      if (this.animTimer > 8) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 4;
      }
    }
    updateNormal(input, world, particles) {
      if (input.left) {
        this.vx = -PLAYER_SPEED;
        this.facing = -1;
      } else if (input.right) {
        this.vx = PLAYER_SPEED;
        this.facing = 1;
      } else this.vx *= 0.75;
      if (input.jump && this.onGround) {
        this.vy = PLAYER_JUMP_FORCE;
        this.onGround = false;
        for (let i = 0; i < 8; i++) {
          particles.spawn(
            this.x + this.w / 2,
            this.y + this.h,
            (Math.random() - 0.5) * 3,
            -Math.random() * 3,
            COLORS.heartPink,
            Math.random() * 3 + 1,
            20
          );
        }
      }
      this.vy += GRAVITY;
      this.x += this.vx;
      this.y += this.vy;
      this.x = Math.max(0, Math.min(WORLD_W - this.w, this.x));
      this.onGround = false;
      world.resolveCollisions(this);
      if (this.onGround && Math.abs(this.vx) > 1) {
        this.stepParticleTimer++;
        if (this.stepParticleTimer > 8) {
          this.stepParticleTimer = 0;
          particles.spawn(
            this.x + this.w / 2,
            this.y + this.h,
            (Math.random() - 0.5) * 1.5,
            -Math.random(),
            COLORS.particleStep,
            Math.random() * 2 + 1,
            15
          );
        }
      }
    }
    updateAstronaut(input, particles) {
      if (input.left) {
        this.vx -= 0.3;
        this.facing = -1;
      } else if (input.right) {
        this.vx += 0.3;
        this.facing = 1;
      } else this.vx *= 0.94;
      if (input.jump) {
        this.vy -= 0.5;
      } else {
        this.vy += SPACE_GRAVITY;
      }
      this.vx = Math.max(-SPACE_FLOAT_SPEED, Math.min(SPACE_FLOAT_SPEED, this.vx));
      this.vy = Math.max(-5, Math.min(2, this.vy));
      this.x += this.vx;
      this.y += this.vy;
      this.x = Math.max(0, Math.min(WORLD_W - this.w, this.x));
      if (this.y + this.h > GROUND_Y) {
        this.y = GROUND_Y - this.h;
        this.vy = 0;
      }
      this.thrustTimer++;
      if (this.thrustTimer > 3) {
        this.thrustTimer = 0;
        particles.spawn(
          this.x + this.w / 2,
          this.y + this.h,
          (Math.random() - 0.5) * 2,
          Math.random() * 2 + 1,
          Math.random() < 0.5 ? "#60c8ff" : "#a0e0ff",
          Math.random() * 3 + 1,
          25
        );
      }
    }
    draw(ctx, camX, camY) {
      const sx = this.x - camX;
      const sy = this.y - camY;
      ctx.save();
      ctx.translate(sx + this.w / 2, sy + this.h / 2);
      ctx.scale(this.facing, 1);
      const bounce = this.onGround && Math.abs(this.vx) > 0.5 && !this.isAstronaut ? Math.sin(this.animFrame * Math.PI / 2) * 2 : 0;
      if (!this.isAstronaut) {
        ctx.save();
        ctx.translate(0, this.h / 2 + 2);
        ctx.scale(1, 0.3);
        const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
        shadow.addColorStop(0, "rgba(0,0,0,0.4)");
        shadow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = shadow;
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.translate(0, bounce);
      if (this.isAstronaut) {
        this.drawAstronautSuit(ctx);
      } else {
        this.drawBody(ctx);
        this.drawHead(ctx);
        this.drawArms(ctx);
        this.drawLegs(ctx);
      }
      ctx.restore();
    }
    drawBody(ctx) {
      ctx.fillStyle = COLORS.playerBody;
      this.roundRect(ctx, -this.w / 2, -this.h / 2, this.w, this.h * 0.65, 6);
      ctx.fill();
    }
    drawHead(ctx) {
      const eyeY = -this.h / 2 - 10;
      this.drawHair(ctx, eyeY);
      ctx.fillStyle = COLORS.playerHead;
      ctx.beginPath();
      ctx.ellipse(0, eyeY, 13, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2d0a14";
      ctx.beginPath();
      ctx.ellipse(-5, eyeY, 2.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(5, eyeY, 2.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,100,120,0.4)";
      ctx.beginPath();
      ctx.ellipse(-8, eyeY + 3, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(8, eyeY + 3, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      this.drawBeard(ctx, eyeY);
    }
    drawHair(ctx, eyeY) {
      ctx.fillStyle = "#f5c842";
      ctx.beginPath();
      ctx.ellipse(0, eyeY - 6, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-12, eyeY - 2, 5, 7, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(12, eyeY - 2, 5, 7, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-5, eyeY - 14, 4, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(5, eyeY - 15, 4, 6, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, eyeY - 16, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    drawBeard(ctx, eyeY) {
      ctx.fillStyle = "#e06010";
      ctx.beginPath();
      ctx.ellipse(-8, eyeY + 7, 5, 4, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(8, eyeY + 7, 5, 4, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, eyeY + 11, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, eyeY + 15, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    drawArms(ctx) {
      const swing = this.onGround ? Math.sin(this.animFrame * Math.PI / 2) * 15 : -30;
      ctx.strokeStyle = COLORS.playerBody;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.save();
      ctx.translate(-this.w / 2, -this.h / 2 + 5);
      ctx.rotate(swing * Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-8, 14);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(this.w / 2, -this.h / 2 + 5);
      ctx.rotate(-swing * Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(8, 14);
      ctx.stroke();
      ctx.restore();
    }
    drawLegs(ctx) {
      const swing = this.onGround ? Math.sin(this.animFrame * Math.PI / 2) * 20 : 0;
      ctx.strokeStyle = COLORS.playerLimb;
      ctx.lineWidth = 8;
      ctx.save();
      ctx.translate(-6, this.h / 2 - 10);
      ctx.rotate(swing * Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-3, 14);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(6, this.h / 2 - 10);
      ctx.rotate(-swing * Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(3, 14);
      ctx.stroke();
      ctx.restore();
    }
    drawAstronautSuit(ctx) {
      const hw = this.w / 2;
      const hh = this.h / 2;
      ctx.fillStyle = "#ddeeff";
      this.roundRect(ctx, -hw - 2, -hh, this.w + 4, this.h * 0.7, 8);
      ctx.fill();
      ctx.strokeStyle = "#a0c0e0";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-6, -hh + 4);
      ctx.lineTo(-6, -hh + 16);
      ctx.moveTo(6, -hh + 4);
      ctx.lineTo(6, -hh + 16);
      ctx.stroke();
      ctx.fillStyle = "#b0c8e8";
      this.roundRect(ctx, -8, -hh + 6, 16, 10, 3);
      ctx.fill();
      ctx.fillStyle = "#ff8fa3";
      ctx.beginPath();
      ctx.ellipse(0, -hh + 11, 3, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      const eyeY = -hh - 12;
      ctx.fillStyle = "#ddeeff";
      ctx.beginPath();
      ctx.ellipse(0, eyeY, 16, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,200,80,0.45)";
      ctx.beginPath();
      ctx.ellipse(0, eyeY + 1, 11, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.ellipse(-4, eyeY - 3, 4, 3, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f5c842";
      ctx.beginPath();
      ctx.ellipse(0, eyeY - 13, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ddeeff";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      const armFloat = Math.sin(this.animFrame * Math.PI / 2) * 8;
      ctx.save();
      ctx.translate(-hw - 2, -hh + 8);
      ctx.rotate((-20 + armFloat) * Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-6, 14);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(hw + 2, -hh + 8);
      ctx.rotate((20 - armFloat) * Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(6, 14);
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = "#ddeeff";
      ctx.lineWidth = 9;
      ctx.save();
      ctx.translate(-5, hh - 8);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-3, 14);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(5, hh - 8);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(3, 14);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#a0b8d0";
      ctx.beginPath();
      ctx.ellipse(-8, hh + 6, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(8, hh + 6, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }
    get centerX() {
      return this.x + this.w / 2;
    }
    get centerY() {
      return this.y + this.h / 2;
    }
  };


  var Heart = class {
    constructor(startX, startY) {
      this.vx = 2.5;
      this.vy = 0;
      this.w = 30;
      this.h = 28;
      this.onGround = false;
      this.phase = "flee";
      this.scared = false;
      this.scaredLevel = 0;
      this.wiggle = 0;
      this.orbitAngle = 0;
      this.trailTimer = 0;
      this.jumpCooldown = 0;
      this.floatRiseTimer = 0;
      this.x = startX;
      this.y = startY;
    }
    update(player, world, particles, t) {
      if (this.phase === "caught") return;
      if (this.phase === "orbiting") {
        this.behaviorOrbiting(t, particles);
        return;
      }
      if (this.phase === "floating") {
        this.behaviorFloating(particles);
        return;
      }
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.updateFearState(dist);
      if (this.isNearEnd()) {
        this.behaviorWaiting(t);
        if (dist < 180) {
          this.phase = "floating";
          this.vx = 0;
          this.vy = -0.5;
          return;
        }
        this.applyPhysics();
        this.onGround = false;
        world.resolveCollisions(this);
        this.emitTrail(particles);
        return;
      }
      this.behaviorFleeing(player, dist);
      if (this.jumpCooldown > 0) this.jumpCooldown--;
      this.applyPhysics();
      this.onGround = false;
      world.resolveCollisions(this, () => {
        if (dist < 250) this.vx += 2.5;
      });
      this.emitTrail(particles);
    }
    behaviorFloating(particles) {
      this.floatRiseTimer++;
      const tx = MOON_X;
      this.vx += (tx - this.x) * 5e-4;
      this.vx *= 0.98;
      this.vy = Math.max(this.vy - 0.08, -4);
      this.x += this.vx;
      this.y += this.vy;
      if (this.floatRiseTimer % 3 === 0) {
        particles.spawn(
          this.x + this.w / 2,
          this.y + this.h,
          (Math.random() - 0.5) * 2,
          Math.random() * 1.5,
          Math.random() < 0.5 ? COLORS.heartRed : COLORS.heartPink,
          Math.random() * 3 + 1,
          40
        );
      }
      const dx = this.x - MOON_X;
      const dy = this.y - MOON_Y;
      if (Math.sqrt(dx * dx + dy * dy) < HEART_ORBIT_RADIUS + 60) {
        this.phase = "orbiting";
        this.orbitAngle = Math.atan2(dy, dx);
      }
    }
    behaviorOrbiting(t, particles) {
      this.orbitAngle += 0.018;
      this.x = MOON_X + Math.cos(this.orbitAngle) * HEART_ORBIT_RADIUS;
      this.y = MOON_Y + Math.sin(this.orbitAngle) * HEART_ORBIT_RADIUS;
      if (t % 4 === 0) {
        particles.spawn(
          this.x + this.w / 2,
          this.y + this.h / 2,
          (Math.random() - 0.5) * 1,
          (Math.random() - 0.5) * 1,
          COLORS.heartPink,
          Math.random() * 2 + 1,
          30
        );
      }
    }
    updateFearState(dist) {
      this.scared = dist < HEART_FLEE_RADIUS;
      this.scaredLevel = Math.max(0, Math.min(1, (HEART_FLEE_RADIUS - dist) / HEART_FLEE_RADIUS));
    }
    behaviorFleeing(player, dist) {
      if (this.scared) {
        const direction = this.x > player.x ? 1 : -1;
        this.vx += HEART_ACCEL * direction;
        const playerIsClose = dist < HEART_JUMP_RADIUS;
        const playerBehind = player.x < this.x;
        if (playerIsClose && playerBehind && this.onGround && this.jumpCooldown <= 0) {
          this.vy = PLAYER_JUMP_FORCE * 0.85;
          this.onGround = false;
          this.jumpCooldown = HEART_JUMP_COOLDOWN;
        }
      } else {
        this.vx += 0.05;
      }
      this.vx = Math.max(-2, Math.min(HEART_MAX_SPEED, this.vx));
    }
    behaviorWaiting(t) {
      this.vx *= 0.92;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
      this.wiggle = Math.sin(t * 0.15) * 8;
    }
    applyPhysics() {
      this.vy += GRAVITY;
      this.x += this.vx;
      this.y += this.vy;
      this.x = Math.max(50, Math.min(WORLD_W - 80, this.x));
    }
    emitTrail(particles) {
      this.trailTimer++;
      const interval = this.scared ? 2 : 6;
      if (this.trailTimer > interval) {
        this.trailTimer = 0;
        particles.spawn(
          this.x + this.w / 2,
          this.y + this.h / 2,
          (Math.random() - 0.5) * 1.5,
          -Math.random() * 2 - 1,
          this.scared ? COLORS.heartRed : "rgba(255,150,170,0.6)",
          Math.random() * 3 + 2,
          this.scared ? 20 : 35
        );
      }
    }
    isNearEnd() {
      return this.x > WORLD_W - HEART_NEAR_END_ZONE;
    }
    isNearFloatTrigger() {
      return this.x > WORLD_W - HEART_FLOAT_TRIGGER;
    }
    isFloatingOrOrbiting() {
      return this.phase === "floating" || this.phase === "orbiting";
    }
    catch() {
      this.phase = "caught";
    }
    draw(ctx, camX, camY, t) {
      if (this.phase === "caught") return;
      const sx = this.x - camX;
      const sy = this.y - camY;
      if (!this.isFloatingOrOrbiting()) {
        this.drawShadow(ctx, sx);
      }
      if (this.scared) this.drawGlow(ctx, sx, sy, t);
      const pulse = Math.sin(t * 0.07) * 0.12 + 1;
      const size = 28 * pulse;
      this.drawHeartShape(ctx, sx, sy - size * 0.1, size, COLORS.heartRed, 1);
      this.drawHighlight(ctx, sx, sy);
      if (this.scared && this.scaredLevel > 0.5) this.drawExclamation(ctx, sx, sy, t);
    }
    drawShadow(ctx, sx) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(sx + 15, GROUND_Y + 4, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawGlow(ctx, sx, sy, t) {
      const pulse = Math.sin(t * 0.07) * 0.12 + 1;
      const size = 28 * pulse;
      const gs = size * 1.4;
      const gx = sx - gs / 2;
      const gy = sy - gs * 0.1;
      ctx.save();
      ctx.globalAlpha = this.scaredLevel * 0.3;
      ctx.fillStyle = COLORS.heartRed;
      ctx.shadowColor = COLORS.heartRed;
      ctx.shadowBlur = 20;
      this.drawHeartPath(ctx, gx, gy, gs);
      ctx.fill();
      ctx.restore();
    }
    drawHighlight(ctx, sx, sy) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = COLORS.heartPink;
      ctx.beginPath();
      ctx.ellipse(sx - 4, sy + 5, 5, 4, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawExclamation(ctx, sx, sy, t) {
      ctx.save();
      ctx.globalAlpha = (this.scaredLevel - 0.5) * 2;
      ctx.fillStyle = COLORS.heartPink;
      ctx.font = `bold ${12 + this.scaredLevel * 6}px 'Crimson Pro', serif`;
      ctx.textAlign = "center";
      ctx.fillText("!", sx, sy - 20 - Math.sin(t * 0.1) * 5);
      ctx.restore();
    }
    drawHeartShape(ctx, x, y, size, color, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10 + size * 0.3;
      this.drawHeartPath(ctx, x - size / 2, y, size);
      ctx.fill();
      ctx.restore();
    }
    drawHeartPath(ctx, x, y, size) {
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y + size * 0.25);
      ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size * 0.25);
      ctx.bezierCurveTo(x, y + size * 0.6, x + size / 2, y + size * 0.85, x + size / 2, y + size);
      ctx.bezierCurveTo(x + size / 2, y + size * 0.85, x + size, y + size * 0.6, x + size, y + size * 0.25);
      ctx.bezierCurveTo(x + size, y, x + size / 2, y, x + size / 2, y + size * 0.25);
      ctx.closePath();
    }
    get centerX() {
      return this.x + this.w / 2;
    }
    get centerY() {
      return this.y + this.h / 2;
    }
  };


  var Dog = class {
    constructor(startX, startY) {
      this.vx = DOG_SPEED;
      this.vy = 0;
      this.w = 36;
      this.h = 26;
      this.onGround = false;
      this.alive = true;
      this.animFrame = 0;
      this.animTimer = 0;
      this.barkTimer = 0;
      this.showBark = false;
      this.x = startX;
      this.y = startY;
    }
    update(player, world, particles) {
      if (!this.alive) return;
      const targetVx = player.x > this.x ? DOG_SPEED : DOG_SPEED * 0.5;
      this.vx += (targetVx - this.vx) * 0.08;
      const dist = player.x - this.x;
      if (dist < 200 && dist > 0) {
        this.vx = Math.min(this.vx + 0.15, DOG_SPEED * 1.3);
        this.barkTimer++;
        if (this.barkTimer > 40) {
          this.barkTimer = 0;
          this.showBark = true;
          setTimeout(() => {
            this.showBark = false;
          }, 600);
        }
      }
      this.vy += GRAVITY;
      this.x += this.vx;
      this.y += this.vy;
      this.x = Math.max(0, Math.min(WORLD_W - this.w, this.x));
      this.onGround = false;
      world.resolveCollisions(this);
      if (this.onGround && this.animFrame % 2 === 0) {
        particles.spawn(
          this.x + 4,
          this.y + this.h,
          (Math.random() - 0.5) * 1.5,
          -Math.random() * 0.8,
          "rgba(230,150,80,0.35)",
          Math.random() * 2 + 1,
          12
        );
      }
      this.animTimer++;
      if (this.animTimer > 6) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 4;
      }
    }

    isBiting(player) {
      if (!this.alive) return false;
      const dx = Math.abs(this.x + this.w / 2 - player.centerX);
      const dy = Math.abs(this.y + this.h / 2 - player.centerY);
      return dx < DOG_BITE_RADIUS_X && dy < DOG_BITE_RADIUS_Y;
    }
    draw(ctx, camX, t) {
      if (!this.alive) return;
      const sx = this.x - camX;
      const sy = this.y;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(sx + this.w / 2, GROUND_Y + 4, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(sx + this.w / 2, sy + this.h / 2);
      const bob = this.onGround ? Math.sin(this.animFrame * Math.PI / 2) * 1.5 : 0;
      ctx.translate(0, bob);
      this.drawBody(ctx, t);
      this.drawHead(ctx);
      this.drawLegs(ctx);
      this.drawTail(ctx, t);
      if (this.showBark) this.drawBark(ctx);
      ctx.restore();
    }
    drawBody(ctx, _t) {
      ctx.fillStyle = "#e07030";
      ctx.beginPath();
      ctx.ellipse(0, 2, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f5e8c8";
      ctx.beginPath();
      ctx.ellipse(2, 5, 9, 6, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    drawHead(ctx) {
      const hx = 14;
      const hy = -4;
      ctx.fillStyle = "#e07030";
      ctx.beginPath();
      ctx.ellipse(10, 0, 6, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e07030";
      ctx.beginPath();
      ctx.ellipse(hx, hy, 11, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f5e8c8";
      ctx.beginPath();
      ctx.ellipse(hx + 2, hy + 2, 7, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e07030";
      ctx.beginPath();
      ctx.moveTo(hx - 5, hy - 8);
      ctx.lineTo(hx - 10, hy - 18);
      ctx.lineTo(hx - 1, hy - 9);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx + 3, hy - 9);
      ctx.lineTo(hx + 5, hy - 19);
      ctx.lineTo(hx + 10, hy - 9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#c04a20";
      ctx.beginPath();
      ctx.moveTo(hx - 4, hy - 9);
      ctx.lineTo(hx - 8, hy - 16);
      ctx.lineTo(hx - 2, hy - 10);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx + 4, hy - 10);
      ctx.lineTo(hx + 5, hy - 16);
      ctx.lineTo(hx + 8, hy - 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#1a0a00";
      ctx.beginPath();
      ctx.ellipse(hx + 4, hy - 2, 2.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.ellipse(hx + 5, hy - 3, 1, 1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2a0a00";
      ctx.beginPath();
      ctx.ellipse(hx + 9, hy + 1, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#cc3030";
      ctx.beginPath();
      ctx.ellipse(hx + 10, hy + 5, 3, 2, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff6070";
      ctx.beginPath();
      ctx.ellipse(hx + 11, hy + 6, 2, 3, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    drawLegs(ctx) {
      const swing = this.onGround ? Math.sin(this.animFrame * Math.PI / 2) * 18 : 0;
      const altSwing = -swing;
      ctx.strokeStyle = "#e07030";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.save();
      ctx.translate(10, 6);
      ctx.rotate(swing * Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(2, 13);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(6, 6);
      ctx.rotate(altSwing * Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-2, 13);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(-8, 7);
      ctx.rotate(altSwing * Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(2, 13);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(-12, 7);
      ctx.rotate(swing * Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-2, 13);
      ctx.stroke();
      ctx.restore();
    }
    drawTail(ctx, t) {
      const wag = Math.sin(t * 0.18) * 20;
      ctx.save();
      ctx.translate(-14, -2);
      ctx.rotate((-60 + wag) * Math.PI / 180);
      ctx.strokeStyle = "#e07030";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-4, -10, 2, -16);
      ctx.stroke();
      ctx.fillStyle = "#f5e8c8";
      ctx.beginPath();
      ctx.ellipse(2, -16, 5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawBark(ctx) {
      ctx.save();
      ctx.translate(22, -18);
      ctx.fillStyle = "rgba(255,240,180,0.95)";
      ctx.strokeStyle = "rgba(200,120,40,0.8)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-2, -12, 32, 18, 6);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2, 4);
      ctx.lineTo(-4, 10);
      ctx.lineTo(8, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#8b3a00";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("WOF!", 14, 0);
      ctx.restore();
    }
    get centerX() {
      return this.x + this.w / 2;
    }
    get centerY() {
      return this.y + this.h / 2;
    }
  };


  var World = class {
    constructor() {
      this.groundY = GROUND_Y;
      this.platforms = this.generatePlatforms();
    }
    generatePlatforms() {
      const plats = [];
      for (let i = 0; i < PLATFORM_COUNT; i++) {
        plats.push({
          x: 400 + i * 220 + Math.sin(i * 1.7) * 80,
          y: CANVAS_H - 80 - 60 - Math.abs(Math.sin(i * 0.8)) * 100,
          w: 80 + Math.random() * 40,
          h: 12
        });
      }
      return plats;
    }

    resolveCollisions(entity, onPlatformLand) {
      if (entity.y + entity.h >= this.groundY) {
        entity.y = this.groundY - entity.h;
        entity.vy = 0;
        entity.onGround = true;
      }
      for (const p of this.platforms) {
        const prevBottom = entity.y + entity.h - entity.vy;
        if (entity.vy >= 0 && entity.x + entity.w > p.x && entity.x < p.x + p.w && entity.y + entity.h >= p.y && entity.y + entity.h <= p.y + p.h + 10 && prevBottom <= p.y + 2) {
          entity.y = p.y - entity.h;
          entity.vy = 0;
          entity.onGround = true;
          onPlatformLand?.();
        }
      }
    }
    draw(ctx, camX, camY = 0) {
      this.drawGround(ctx, camY);
      this.drawPlatforms(ctx, camX, camY);
      this.drawEndPortal(ctx, camX, camY);
    }
    drawGround(ctx, camY) {
      const screenGY = this.groundY - camY;
      const gGrad = ctx.createLinearGradient(0, screenGY, 0, screenGY + 200);
      gGrad.addColorStop(0, COLORS.groundTop);
      gGrad.addColorStop(1, COLORS.groundBottom);
      ctx.fillStyle = gGrad;
      ctx.fillRect(0, screenGY, 9999, 200);
      ctx.strokeStyle = COLORS.groundLine;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(255,80,110,0.4)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, screenGY);
      ctx.lineTo(9999, screenGY);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    drawPlatforms(ctx, camX, camY) {
      for (const p of this.platforms) {
        const sx = p.x - camX;
        const sy = p.y - camY;
        if (sx > 9999 + 100 || sx + p.w < -100) continue;
        const pGrad = ctx.createLinearGradient(sx, sy, sx, sy + p.h);
        pGrad.addColorStop(0, COLORS.platformTop);
        pGrad.addColorStop(1, COLORS.platformBottom);
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        roundRect(ctx, sx, sy, p.w, p.h, 4);
        ctx.fill();
        ctx.strokeStyle = COLORS.platformStroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    drawEndPortal(ctx, camX, camY) {
      const endX = WORLD_W - 100 - camX;
      const groundScreenY = this.groundY - camY;
      if (endX < -200 || endX > 9999 + 200) return;
      const pulse = Math.sin(Date.now() * 3e-3) * 0.5 + 0.5;
      ctx.save();
      ctx.translate(endX + 40, groundScreenY);
      const archGrad = ctx.createRadialGradient(0, -80, 10, 0, -80, 100);
      archGrad.addColorStop(0, `rgba(255,80,120,${0.3 + pulse * 0.2})`);
      archGrad.addColorStop(1, "rgba(255,80,120,0)");
      ctx.fillStyle = archGrad;
      ctx.fillRect(-100, -180, 200, 200);
      ctx.strokeStyle = `rgba(255,120,150,${0.6 + pulse * 0.3})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(255,100,130,0.8)";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, -80, 80, Math.PI, 0, false);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,160,180,${0.4 + pulse * 0.3})`;
      ctx.font = 'bold 14px "Crimson Pro", serif';
      ctx.textAlign = "center";
      ctx.shadowBlur = 0;
      ctx.fillText("\u2661", 0, -80);
      ctx.restore();
    }
  };
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }


  var Background = class {
    constructor() {
      this.elements = [];
      this.init();
    }
    init() {
      for (let i = 0; i < BG_ELEMENT_COUNT; i++) {
        this.elements.push({
          type: Math.random() < 0.6 ? "star" : "petal",
          x: Math.random() * WORLD_W,
          y: Math.random() * CANVAS_H * 0.8,
          size: Math.random() * 3 + 1,
          alpha: Math.random() * 0.4 + 0.1,
          twinkleSpeed: Math.random() * 0.03 + 0.01,
          twinkleOffset: Math.random() * Math.PI * 2,
          color: Math.random() < 0.5 ? COLORS.bgStar : COLORS.bgPetal
        });
      }
    }

    draw(ctx, camX, t, spaceAlpha = 0) {
      const groundAlpha = 1 - spaceAlpha;
      if (groundAlpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = groundAlpha;
      this.drawSky(ctx);
      this.drawElements(ctx, camX, t);
      ctx.restore();
    }
    drawSky(ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, COLORS.bgDark);
      grad.addColorStop(0.5, COLORS.bgMid);
      grad.addColorStop(1, COLORS.bgLight);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
    drawElements(ctx, camX, t) {
      for (const el of this.elements) {
        const screenX = ((el.x - camX * 0.2) % WORLD_W + WORLD_W) % WORLD_W;
        if (screenX < -20 || screenX > CANVAS_W + 20) continue;
        const twinkle = Math.sin(t * el.twinkleSpeed + el.twinkleOffset) * 0.5 + 0.5;
        ctx.save();
        ctx.globalAlpha = el.alpha * (0.5 + twinkle * 0.5);
        if (el.type === "star") {
          ctx.fillStyle = el.color;
          ctx.beginPath();
          ctx.arc(screenX, el.y, el.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = el.color;
          ctx.save();
          ctx.translate(screenX, el.y);
          ctx.rotate(t * 5e-3 + el.twinkleOffset);
          ctx.beginPath();
          ctx.ellipse(0, 0, el.size, el.size * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }
    }
  };


  var SpaceScene = class {
    constructor() {
      this.planets = [];
      this.stars = [];
      this.generatePlanets();
      this.generateStars();
    }
    generatePlanets() {
      this.planets = [
        { wx: MOON_X - 600, wy: MOON_Y - 400, radius: 55, color: "#c44444", rimColor: "#e88888", hasRing: false, ringColor: "", offset: 0 },
        { wx: MOON_X + 500, wy: MOON_Y - 300, radius: 80, color: "#e8a040", rimColor: "#f0c060", hasRing: true, ringColor: "rgba(240,180,60,0.4)", offset: 1.2 },
        { wx: MOON_X - 350, wy: MOON_Y + 400, radius: 40, color: "#4080c0", rimColor: "#60a0e0", hasRing: false, ringColor: "", offset: 2.4 },
        { wx: MOON_X + 700, wy: MOON_Y + 250, radius: 30, color: "#880088", rimColor: "#cc00aa", hasRing: false, ringColor: "", offset: 3.1 }
      ];
    }
    generateStars() {
      const spread = 3e3;
      for (let i = 0; i < 500; i++) {
        this.stars.push({
          x: MOON_X - spread / 2 + Math.random() * spread,
          y: MOON_Y - 600 + Math.random() * 1400,
          size: Math.random() * 2 + 0.3,
          twinkle: Math.random() * Math.PI * 2
        });
      }
    }
 
    draw(ctx, camX, camY, alpha, t) {
      if (alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      this.drawSpaceBg(ctx);
      this.drawStars(ctx, camX, camY, t);
      this.drawPlanets(ctx, camX, camY, t);
      this.drawMoon(ctx, camX, camY, t);
      ctx.restore();
    }
    drawSpaceBg(ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, "#000008");
      grad.addColorStop(0.5, "#04000e");
      grad.addColorStop(1, "#080018");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
    drawStars(ctx, camX, camY, t) {
      for (const s of this.stars) {
        const sx = s.x - camX * 0.15;
        const sy = s.y - camY * 0.15;
        if (sx < -5 || sx > CANVAS_W + 5) continue;
        if (sy < -5 || sy > CANVAS_H + 5) continue;
        const twinkle = Math.sin(t * 0.04 + s.twinkle) * 0.4 + 0.6;
        ctx.save();
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    drawPlanets(ctx, camX, camY, t) {
      for (const p of this.planets) {
        const sx = p.wx - camX;
        const sy = p.wy - camY;
        if (sx < -p.radius * 3 || sx > CANVAS_W + p.radius * 3) continue;
        if (sy < -p.radius * 3 || sy > CANVAS_H + p.radius * 3) continue;
        const floatY = Math.sin(t * 8e-3 + p.offset) * 8;
        ctx.save();
        ctx.translate(sx, sy + floatY);
        if (p.hasRing) {
          ctx.save();
          ctx.scale(1, 0.3);
          ctx.strokeStyle = p.ringColor;
          ctx.lineWidth = 12;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.radius * 1.8, p.radius * 1.8, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        const grad = ctx.createRadialGradient(-p.radius * 0.3, -p.radius * 0.3, 0, 0, 0, p.radius);
        grad.addColorStop(0, p.rimColor);
        grad.addColorStop(1, p.color);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = p.rimColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
    drawMoon(ctx, camX, camY, _t) {
      const sx = MOON_X - camX;
      const sy = MOON_Y - camY;
      if (sx < -MOON_RADIUS * 3 || sx > CANVAS_W + MOON_RADIUS * 3) return;
      if (sy < -MOON_RADIUS * 3 || sy > CANVAS_H + MOON_RADIUS * 3) return;
      ctx.save();
      ctx.translate(sx, sy);
      const glow = ctx.createRadialGradient(0, 0, MOON_RADIUS * 0.8, 0, 0, MOON_RADIUS * 2.5);
      glow.addColorStop(0, "rgba(255,250,220,0.15)");
      glow.addColorStop(1, "rgba(255,250,220,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, MOON_RADIUS * 2.5, 0, Math.PI * 2);
      ctx.fill();
      const moonGrad = ctx.createRadialGradient(-MOON_RADIUS * 0.3, -MOON_RADIUS * 0.3, 0, 0, 0, MOON_RADIUS);
      moonGrad.addColorStop(0, "#f8f4e0");
      moonGrad.addColorStop(0.6, "#d8d0b0");
      moonGrad.addColorStop(1, "#b0a880");
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(0, 0, MOON_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      const craters = [
        { x: -40, y: -30, r: 18 },
        { x: 30, y: 20, r: 24 },
        { x: -10, y: 40, r: 12 },
        { x: 50, y: -50, r: 14 },
        { x: -60, y: 30, r: 10 }
      ];
      for (const c of craters) {
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(c.x - c.r * 0.2, c.y - c.r * 0.2, c.r, Math.PI * 0.8, Math.PI * 1.8);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,220,0.4)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-MOON_RADIUS * 0.1, -MOON_RADIUS * 0.1, MOON_RADIUS * 0.9, Math.PI * 1.1, Math.PI * 1.7);
      ctx.stroke();
      ctx.restore();
    }
  };


  var Camera = class {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.astronautMode = false;
    }
    follow(targetX, targetY) {
      this.astronautMode = targetY !== void 0;
      const desiredX = targetX - CANVAS_W * CAMERA_LEAD;
      this.x += (desiredX - this.x) * CAMERA_LERP;
      if (!this.astronautMode) {
        this.x = Math.max(0, Math.min(WORLD_W - CANVAS_W, this.x));
      }
      if (targetY !== void 0 && targetY < 0) {
        const desiredY = targetY - CANVAS_H * 0.45;
        this.y += (desiredY - this.y) * CAMERA_LERP;
        this.y = Math.min(0, this.y);
      } else {
        this.y += (0 - this.y) * CAMERA_LERP;
        if (Math.abs(this.y) < 0.5) this.y = 0;
      }
    }
  };


  var ParticleSystem = class {
    constructor() {
      this.particles = [];
    }
    spawn(x, y, vx, vy, color, size, life) {
      this.particles.push({ x, y, vx, vy, color, size, life, maxLife: life, alpha: 1 });
    }

    burst(x, y, count, colors) {
      for (let i = 0; i < count; i++) {
        this.spawn(
          x,
          y,
          (Math.random() - 0.5) * 8,
          -Math.random() * 10 - 3,
          colors[Math.floor(Math.random() * colors.length)],
          Math.random() * 6 + 3,
          80
        );
      }
    }
    update() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.vx *= 0.98;
        p.life--;
        p.alpha = p.life / p.maxLife;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
    }
    draw(ctx, camX, camY = 0) {
      for (const p of this.particles) {
        ctx.save();
        ctx.globalAlpha = p.alpha * 0.8;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x - camX, p.y - camY, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    get count() {
      return this.particles.length;
    }
  };

  var HUD = class {
    constructor() {
      this.hudEl = document.getElementById("hud");
      this.mapEl = document.getElementById("minimap");
      this.playerEl = document.getElementById("minimap-player");
      this.heartEl = document.getElementById("minimap-heart");
    }
    show() {
      this.mapEl.style.opacity = "1";
      this.hudEl.style.opacity = "1";
    }
    hide() {
      this.mapEl.style.opacity = "0";
      this.hudEl.style.opacity = "0";
    }
    update(player, heart) {
      const playerPct = player.x / WORLD_W * 100;
      const heartPct = heart.x / WORLD_W * 100;
      this.playerEl.style.left = `${playerPct}%`;
      this.heartEl.style.left = `${heartPct}%`;
      this.hudEl.textContent = this.getFlavorText(player, heart);
    }
    getFlavorText(player, heart) {
      if (heart.phase === "orbiting" && player.isAstronaut) return "fly to the Moon and catch it \u2661";
      if (heart.phase === "orbiting") return "it's orbiting the Moon... fly up! \u2661";
      if (heart.phase === "floating") return "it's flying to space! follow it \u2661";
      if (player.isAstronaut) return "W to fly up \xB7 A/D to steer \u2661";
      if (heart.isNearFloatTrigger()) return "almost there... \u2661";
      const dist = Math.hypot(player.x - heart.x, player.y - heart.y);
      if (dist < 150) return "so close! \u2661";
      if (dist < 300) return "keep going... \u2661";
      return "chase it... \u2661";
    }
  };

  var ScreenManager = class {
    constructor(onStart) {
      this.onStart = onStart;
      this.startEl = document.getElementById("start-screen");
      this.winEl = document.getElementById("win-screen");
      this.gameOverEl = document.getElementById("game-over-screen");
      this.startBtn = document.getElementById("start-btn");
      this.startBtn.addEventListener("click", () => {
        this.hideStart();
        this.onStart();
      });
    }
    showStart() {
      this.startEl.style.display = "flex";
    }
    hideStart() {
      this.startEl.style.display = "none";
    }
    showWin(message) {
      if (message) {
        const msgEl = document.getElementById("win-message");
        if (msgEl) msgEl.innerHTML = message;
      }
      this.winEl.style.display = "flex";
    }
    hideWin() {
      this.winEl.style.display = "none";
    }
    showGameOver() {
      this.gameOverEl.style.display = "flex";
    }
    hideGameOver() {
      this.gameOverEl.style.display = "none";
    }
  };

  // src/Game.ts
  var Game = class {
    constructor(canvas2) {
      this.canvas = canvas2;
      this.state = "START" /* START */;
      this.t = 0;
      this.spaceAlpha = 0;
      this.input = new InputManager();
      this.camera = new Camera();
      this.particles = new ParticleSystem();
      this.background = new Background();
      this.spaceScene = new SpaceScene();
      this.pendingTimeouts = [];
      this.ctx = canvas2.getContext("2d");
      canvas2.width = CANVAS_W;
      canvas2.height = CANVAS_H;
      this.world = new World();
      this.player = new Player(100, GROUND_Y - 40);
      this.heart = new Heart(400, GROUND_Y - 60);
      this.dog = new Dog(100 + DOG_START_OFFSET, GROUND_Y - 26);
      this.hud = new HUD();
      this.screens = new ScreenManager(() => this.startGame());
      this.screens.showStart();
      this.hud.hide();
    }
    scheduleTimeout(fn, ms) {
      this.pendingTimeouts.push(setTimeout(fn, ms));
    }
    clearTimeouts() {
      this.pendingTimeouts.forEach((id) => clearTimeout(id));
      this.pendingTimeouts = [];
    }
    startGame() {
      this.clearTimeouts();
      this.screens.hideGameOver();
      this.screens.hideWin();
      this.player = new Player(100, GROUND_Y - 40);
      this.heart = new Heart(400, GROUND_Y - 60);
      this.dog = new Dog(100 + DOG_START_OFFSET, GROUND_Y - 26);
      this.particles = new ParticleSystem();
      this.camera = new Camera();
      this.spaceAlpha = 0;
      this.t = 0;
      this.state = "PLAYING" /* PLAYING */;
      this.hud.show();
    }
    triggerWin() {
      this.heart.catch();
      this.state = "WIN" /* WIN */;
      for (let i = 0; i < 50; i++) {
        this.scheduleTimeout(() => {
          this.particles.burst(
            this.heart.centerX,
            this.heart.centerY,
            1,
            [COLORS.heartRed, COLORS.heartPink, "#ffffff"]
          );
        }, i * 25);
      }
      this.scheduleTimeout(() => {
        this.screens.showWin();
      }, 1200);
    }
    triggerGameOver() {
      this.state = "GAME_OVER" /* GAME_OVER */;
      this.dog.alive = false;
      for (let i = 0; i < 20; i++) {
        this.particles.spawn(
          this.player.centerX,
          this.player.centerY,
          (Math.random() - 0.5) * 6,
          -Math.random() * 5 - 2,
          Math.random() < 0.5 ? "#ff3060" : "#ffb3c1",
          Math.random() * 4 + 2,
          40
        );
      }
      this.hud.hide();
      this.scheduleTimeout(() => this.screens.showGameOver(), 600);
    }
    update() {
      if (this.state === "PLAYING" /* PLAYING */) {
        this.player.update(this.input, this.world, this.particles);
        this.heart.update(this.player, this.world, this.particles, this.t);
        this.updateDog();
        this.updateSpaceTransition();
        this.checkAstronautActivation();
        const camTargetY = this.player.isAstronaut && this.player.y < 0 ? this.player.y : void 0;
        this.camera.follow(this.player.x, camTargetY);
        this.checkWinCondition();
        if (!this.player.isAstronaut) this.checkBiteCondition();
        this.hud.update(this.player, this.heart);
      } else if (this.state === "WIN" /* WIN */ || this.state === "GAME_OVER" /* GAME_OVER */) {
        const camTargetY = this.player.isAstronaut && this.player.y < 0 ? this.player.y : void 0;
        this.camera.follow(this.player.x, camTargetY);
      }
      this.particles.update();
    }
    updateDog() {
      const distFromEnd = WORLD_W - this.dog.x;
      if (distFromEnd < DOG_SLOW_ZONE) {
        const slowFactor = distFromEnd / DOG_SLOW_ZONE;
        this.dog.vx *= 0.96 + slowFactor * 0.04;
      }
      this.dog.update(this.player, this.world, this.particles);
    }
    updateSpaceTransition() {
      if (this.heart.isFloatingOrOrbiting() || this.player.isAstronaut) {
        const riseProgress = Math.max(0, -this.camera.y) / 600;
        this.spaceAlpha = Math.min(1, riseProgress);
      }
    }
    checkAstronautActivation() {
      if (this.player.isAstronaut) return;
      if (!this.heart.isFloatingOrOrbiting()) return;
      const dx = this.player.centerX - this.heart.centerX;
      const dy = this.player.centerY - this.heart.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 220) return;
      this.player.isAstronaut = true;
      this.player.vy = -3;
      this.dog.alive = false;
      for (let i = 0; i < 20; i++) {
        this.particles.spawn(
          this.player.centerX,
          this.player.centerY,
          (Math.random() - 0.5) * 8,
          -Math.random() * 6 - 2,
          Math.random() < 0.5 ? "#60c8ff" : "#ffffff",
          Math.random() * 4 + 2,
          40
        );
      }
    }
    checkWinCondition() {
      if (this.heart.phase === "orbiting" && this.player.isAstronaut) {
        const dx = this.player.centerX - this.heart.centerX;
        const dy = this.player.centerY - this.heart.centerY;
        if (Math.sqrt(dx * dx + dy * dy) < SPACE_WIN_RADIUS) {
          this.triggerWin();
        }
      }
    }
    checkBiteCondition() {
      if (this.dog.isBiting(this.player)) {
        this.triggerGameOver();
      }
    }
    render() {
      this.ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      this.spaceScene.draw(this.ctx, this.camera.x, this.camera.y, this.spaceAlpha, this.t);
      this.background.draw(this.ctx, this.camera.x, this.t, this.spaceAlpha);
      this.world.draw(this.ctx, this.camera.x, this.camera.y);
      this.particles.draw(this.ctx, this.camera.x, this.camera.y);
      this.heart.draw(this.ctx, this.camera.x, this.camera.y, this.t);
      this.dog.draw(this.ctx, this.camera.x, this.t);
      this.player.draw(this.ctx, this.camera.x, this.camera.y);
    }
    start() {
      const loop = () => {
        this.t++;
        this.update();
        this.render();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  };

  // src/main.ts
  var canvas = document.getElementById("gameCanvas");
  var game = new Game(canvas);
  game.start();
})();