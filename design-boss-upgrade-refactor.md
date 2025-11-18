# Design Document: Boss Special Upgrade System Refactor

> **Context:** This design doc addresses critical issues identified in PR #48
> **Status:** Proposal - Seeking Feedback
> **Author:** Claude
> **Date:** 2025-01-18

---

## 📋 Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Problem Statement](#problem-statement)
3. [High-Level Design Approaches](#high-level-design-approaches)
4. [Recommended Solution](#recommended-solution)
5. [Implementation Plan](#implementation-plan)
6. [Success Metrics](#success-metrics)
7. [Open Questions](#open-questions)

---

## 1. Current State Analysis

### 1.1 What Exists ✅
- **Boss defeat detection** in 3 locations:
  - `updateProjectiles()` - Line 447 (regular projectile kills)
  - `applyGhastFireballExplosion()` - Line 537 (fireball explosion kills)
  - `updateExpandingRings()` - Line 511 (ring ability kills)
- **Ability initialization** assumes `ghastFireball` always exists (game.js:82-91)
- **UI update logic** checks for specific ability properties (ui.js:186-189)
- **No test infrastructure** for game logic

### 1.2 What Works 💚
- ✅ Config-driven ability definitions (config.js:76-136)
- ✅ Upgrade modal UI/UX with responsive design
- ✅ Visual effects for all abilities
- ✅ Separation of concerns (game/ui/renderer/config)

### 1.3 Critical Issues 🔴

#### Issue #1: Race Condition on Boss Defeat
**Problem:** Multiple code paths can trigger `handleBossDefeat()` simultaneously

```javascript
// Scenario: Boss hit by expanding ring AND fireball explosion in same frame
updateExpandingRings() -> boss dies -> handleBossDefeat() -> game pauses
applyGhastFireballExplosion() -> same boss already dead -> handleBossDefeat() again
// Result: Multiple upgrade modals, game state corruption
```

**Impact:** Players may see multiple upgrade modals or experience game freezing

#### Issue #2: Ability State Management
**Problem:** Switching abilities breaks assumptions throughout codebase

```javascript
// Before switch: abilities = { ghastFireball: {...} }
switchToNewAbility('heal')
// After switch: abilities = { heal: {...} }
// But code still checks: if (abilities.ghastFireball) { ... } ❌
```

**Impact:** Null reference errors, UI not updating correctly after ability switch

#### Issue #3: No Test Coverage
**Problem:** 779 lines of untested code violates TDD principles
- No unit tests for ability upgrades
- No integration tests for boss defeat flow
- No tests for edge cases (max level, ability switching)

**Impact:** High risk of regressions, difficult to maintain

---

## 2. Problem Statement

### Goal
Implement a robust boss upgrade system that:
1. ✅ Prevents race conditions during boss defeat
2. ✅ Maintains consistent ability state across game lifecycle
3. ✅ Provides comprehensive test coverage
4. ✅ Follows TDD best practices
5. ✅ Enables easy addition of new abilities

### Non-Goals
- ❌ Changing the visual design/UX (already good)
- ❌ Modifying config structure (well-designed)
- ❌ Rewriting rendering system

---

## 3. High-Level Design Approaches

### Approach A: Single Active Ability Pattern ⭐ (Recommended)

**Design:**
```javascript
// Centralized ability state
this.activeAbility = {
  key: 'ghastFireball',        // Ability identifier
  level: 1,
  stats: { ... },              // Runtime stats (cooldown, charges, etc.)
  config: CONFIG.ghastFireball // Reference to config
}
```

**Pros:**
- ✅ Single source of truth for ability state
- ✅ Eliminates need to check multiple ability properties
- ✅ Simplifies UI updates (always reference `activeAbility`)
- ✅ Clear contract for ability switching

**Cons:**
- ⚠️ Requires refactoring all existing ability checks
- ⚠️ Migration path needed for existing save games (if implemented)

---

### Approach B: Boss Defeat State Machine ⭐ (Recommended)

**Design:**
```javascript
this.bossDefeatState = {
  isProcessing: false,  // Guard flag
  defeatedBossId: null  // Track which boss triggered upgrade
}

handleBossDefeat(bossId) {
  if (this.bossDefeatState.isProcessing) return; // Prevent re-entry
  this.bossDefeatState.isProcessing = true;
  // ... show upgrade UI
}
```

**Pros:**
- ✅ Simple guard pattern prevents race conditions
- ✅ Minimal changes to existing code
- ✅ Easy to test with simple flag checks

**Cons:**
- ⚠️ Doesn't solve broader architectural issues
- ⚠️ Band-aid solution rather than structural fix

---

### Approach C: Event-Driven Architecture

**Design:**
```javascript
// Event bus pattern
this.eventBus = new EventBus();
this.eventBus.on('boss:defeated', (boss) => {
  this.queueBossDefeatReward(boss);
});
```

**Pros:**
- ✅ Decouples boss defeat from upgrade logic
- ✅ Natural deduplication mechanism
- ✅ Extensible for future events

**Cons:**
- ❌ Significant architectural change
- ❌ Adds complexity for single feature
- ❌ May be over-engineering for current needs

---

## 4. Recommended Solution

### 🎯 Hybrid Approach: A (Single Active Ability) + B (State Guard)

```
┌─────────────────────────────────────────────────────┐
│ Game State                                          │
├─────────────────────────────────────────────────────┤
│ activeAbility: {                                    │
│   key: 'ghastFireball',                            │
│   level: 1,                                        │
│   charges: { current: 1, max: 1 },                │
│   cooldown: { lastUsed: 0, duration: 10000 },     │
│   stats: { size: 24, damage: 4.0, ... }           │
│ }                                                   │
│                                                     │
│ bossDefeatLock: false                              │
└─────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌──────────────┐      ┌─────────────┐
│ Ability      │      │ Boss Defeat │
│ Manager      │      │ Handler     │
└──────────────┘      └─────────────┘
```

### Key Design Decisions
1. **Ability State:** Single `activeAbility` object replaces `abilities` map
2. **Race Prevention:** `bossDefeatLock` flag with atomic operations
3. **Ability Switching:** Clear contract with state validation
4. **Testing:** Test-first approach for all new code

---

## 5. Implementation Plan

### PR #1: Test Infrastructure & Ability Manager 🏗️
**Goal:** Establish testing foundation and refactor ability state management

**Changes:**
- Create `tests/` directory structure
- Add testing utilities (mock game state, assertion helpers)
- Implement `AbilityManager` class with single active ability pattern
- Write comprehensive unit tests for `AbilityManager`

**Files:**
- `tests/setup.js` - Test environment configuration
- `tests/ability-manager.test.js` - Full test suite
- `ability-manager.js` - New centralized ability management
- `game.js` - Minimal changes to integrate AbilityManager

**Success Criteria:**
- ✅ 100% test coverage for `AbilityManager`
- ✅ All existing abilities work through new manager
- ✅ No regression in gameplay

**Estimated:** ~400 lines (200 implementation + 200 tests) | **2-3 days**

---

### PR #2: Boss Defeat State Machine 🔒
**Goal:** Eliminate race conditions in boss defeat handling

**Changes:**
- Add boss defeat state tracking with unique boss IDs
- Implement guard locks to prevent re-entry
- Consolidate boss defeat handling into single method
- Add integration tests for multi-path boss death scenarios

**Files:**
- `game.js` - Add `bossDefeatState`, refactor defeat handling
- `tests/boss-defeat.test.js` - Test all race condition scenarios

**Test Cases:**
```javascript
test('boss killed by ring then explosion in same frame')
test('boss killed by projectile while ring is expanding')
test('multiple bosses defeated simultaneously (future)')
test('boss defeat interrupted by game over')
```

**Success Criteria:**
- ✅ Boss defeat called exactly once per boss
- ✅ No duplicate upgrade modals
- ✅ State properly cleaned up on modal close

**Estimated:** ~200 lines (100 implementation + 100 tests) | **1-2 days**

---

### PR #3: Ability Upgrade System Tests 🧪
**Goal:** Add comprehensive tests for upgrade logic

**Changes:**
- Test all 15 upgrade paths (3 abilities × 5 levels)
- Test edge cases (max level, invalid upgrades, missing config)
- Test ability stat calculations
- Test persistence of upgrade effects

**Files:**
- `tests/ability-upgrades.test.js` - Upgrade logic tests
- `tests/ability-switching.test.js` - Ability swap tests
- `game.js` - Add error handling for missing configs

**Test Cases:**
```javascript
describe('Ghast Fireball Upgrades', () => {
  test('level 2: reduces cooldown by 10%')
  test('level 3: increases size by 25%')
  test('level 5: grants 2 charges and 250% damage')
  test('max level: upgrade option not shown')
})

describe('Ability Switching', () => {
  test('switching clears previous ability state')
  test('switching initializes new ability at level 1')
})
```

**Success Criteria:**
- ✅ All upgrade paths tested
- ✅ Error handling for edge cases
- ✅ No hard-coded values (use config)

**Estimated:** ~300 lines (50 implementation + 250 tests) | **2-3 days**

---

### PR #4: UI State Management & Testing ✨
**Goal:** Test and improve UI layer reliability

**Changes:**
- Add tests for upgrade modal rendering
- Test keyboard navigation (accessibility)
- Test mobile touch interactions
- Improve error messaging for failed upgrades

**Files:**
- `tests/ui-upgrade-modal.test.js` - UI interaction tests
- `ui.js` - Add error handling, accessibility improvements
- `styles.css` - Add focus states for keyboard navigation

**Success Criteria:**
- ✅ All UI states tested
- ✅ Accessibility improvements (keyboard nav, focus states)
- ✅ Error states handled gracefully

**Estimated:** ~250 lines (50 implementation + 200 tests) | **1-2 days**

---

### PR #5: Integration Tests & Documentation 📚
**Goal:** End-to-end testing and documentation

**Changes:**
- Full gameplay integration tests
- Performance testing (ensure no frame drops)
- Update README with ability system documentation
- Add JSDoc comments to all public APIs

**Files:**
- `tests/integration/boss-upgrade-flow.test.js` - E2E tests
- `tests/performance/ability-performance.test.js` - Performance benchmarks
- `README.md` - Document ability system
- `ARCHITECTURE.md` - Document design decisions

**Test Scenarios:**
```javascript
test('full game flow: spawn boss -> defeat -> upgrade -> continue')
test('multiple boss cycles with different ability choices')
test('performance: 100 enemies + 10 rings < 16ms frame time')
```

**Success Criteria:**
- ✅ Complete test coverage (unit + integration)
- ✅ Documentation up to date
- ✅ Performance benchmarks passing

**Estimated:** ~400 lines (100 implementation + 300 tests/docs) | **1-2 days**

---

## 6. Success Metrics

### Code Quality
- ✅ Test coverage ≥ 90% for new code
- ✅ No race conditions (verified by tests)
- ✅ No hard-coded magic numbers
- ✅ JSDoc coverage ≥ 80%

### Performance
- ✅ Boss defeat handling < 1ms
- ✅ Upgrade modal render < 16ms (60 FPS)
- ✅ No memory leaks during ability switching

### Maintainability
- ✅ New abilities can be added with ≤ 50 lines of code
- ✅ Upgrade paths fully config-driven
- ✅ Clear separation of concerns

---

## 7. Open Questions

### Q1: Should abilities persist across game restarts?
- **Option A:** Yes - Need save/load system (separate PR)
- **Option B:** No - Current implementation sufficient

### Q2: Maximum number of abilities?
- **Current:** 3 abilities, player can switch freely
- **Alternative:** Unlock abilities permanently (metaprogression)

### Q3: Upgrade persistence after ability switch?
- **Current:** Switching resets to level 1
- **Alternative:** Remember upgrade levels per ability

### Q4: Testing framework choice?
- **Options:** Jest, Vitest, or browser-native tests
- **Recommendation:** Vitest (fast, ESM-native, compatible with existing code)

---

## 📊 Timeline Estimate

| PR | Scope | Effort | Dependencies |
|----|-------|--------|--------------|
| #1 | Test Infrastructure + Ability Manager | 2-3 days | None |
| #2 | Boss Defeat State Machine | 1-2 days | PR #1 |
| #3 | Ability Upgrade Tests | 2-3 days | PR #1 |
| #4 | UI Testing & Polish | 1-2 days | PR #3 |
| #5 | Integration & Docs | 1-2 days | PR #2, #3, #4 |

**Total:** 7-12 days (sequential) or 4-6 days (parallel where possible)

---

## 🎯 Next Steps

1. **Get feedback on this design doc**
2. **Answer open questions** (community input welcome!)
3. **Start PR #1** (Test Infrastructure + Ability Manager)
4. **Iterate based on review feedback**

---

## 📝 Related Issues/PRs

- PR #48 - Original boss special upgrade implementation
- (This design addresses feedback from PR #48 review)

---

**💬 Feedback Welcome!** Please comment with:
- Thoughts on the recommended approach
- Answers to open questions
- Concerns or alternative ideas
- Preference on timeline (incremental vs. all-at-once)
