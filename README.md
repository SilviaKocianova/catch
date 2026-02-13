# Catch My Heart 💕

A Valentine's Day 2D platformer. Chase a fleeing heart across a scrolling world and catch it at the end.

## Architecture

```
catch-my-heart/
├── index.html                  # HTML shell + all CSS
├── tsconfig.json               # TypeScript config (bundler resolution)
├── package.json
└── src/
    ├── main.ts                 # Entry point — creates Game and calls .start()
    ├── Game.ts                 # Root orchestrator — owns all systems, runs the loop
    │
    ├── core/                   # Pure data & shared infrastructure
    │   ├── constants.ts        # ALL magic numbers and colors in one place
    │   ├── types.ts            # Shared interfaces, enums, type aliases
    │   └── InputManager.ts     # Keyboard state tracker (WASD / arrow keys)
    │
    ├── entities/               # Game objects with state + behavior + rendering
    │   ├── Player.ts           # WASD movement, jump, physics, sprite drawing
    │   ├── Heart.ts            # AI flee/wait behavior, heart shape rendering
    │   └── World.ts            # Platform layout, collision resolution, ground/portal drawing
    │
    ├── systems/                # Stateful services that entities rely on
    │   ├── ParticleSystem.ts   # Spawn, update, draw all particles
    │   ├── Camera.ts           # Smooth follow camera with lerp + clamping
    │   └── Background.ts       # Parallax star/petal layer + sky gradient
    │
    └── ui/                     # DOM-facing UI components
        ├── HUD.ts              # Minimap dots + flavor text updates
        └── ScreenManager.ts    # Start / win screen show/hide logic
```

### Design principles

- **`core/`** has zero dependencies on other game code — safe to import anywhere
- **Entities** own their own `update()` and `draw()` — they take what they need as arguments
- **Systems** are injected into entities (e.g. `ParticleSystem` passed to `Player.update()`)
- **`Game.ts`** is the only file that imports everything — it wires up the dependency graph
- **Constants** are the single source of truth for all tuning values

### Data flow

```
main.ts
  └── new Game(canvas)
        ├── update loop
        │     ├── InputManager  →  Player.update(input, world, particles)
        │     ├── Player state  →  Heart.update(player, world, particles, t)
        │     ├── Player.x      →  Camera.follow(player.x)
        │     ├── checkWin()    →  triggerWin()
        │     └── HUD.update(player, heart)
        │
        └── render loop
              ├── Background.draw(ctx, camX, t)
              ├── World.draw(ctx, camX)
              ├── ParticleSystem.draw(ctx, camX)
              ├── Heart.draw(ctx, camX, t)
              └── Player.draw(ctx, camX)
```

## Setup

```bash
npm install
npm run build
```

Then open `index.html` in a browser (`npx serve .`).

## Customise

| What                  | Where                                              |
|-----------------------|----------------------------------------------------|
| Win message           | `index.html` → `#win-message` inner HTML           |
| Player / heart speed  | `src/core/constants.ts` → `PLAYER_SPEED`, `HEART_MAX_SPEED` |
| Map length            | `src/core/constants.ts` → `WORLD_W`                |
| Colors                | `src/core/constants.ts` → `COLORS` object          |
| Platform layout       | `src/entities/World.ts` → `generatePlatforms()`    |
| Heart AI behavior     | `src/entities/Heart.ts` → `behaviorFleeing()`      |
