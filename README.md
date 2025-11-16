# Blocky Horde - Voxel Survival Game

A refactored, modular voxel-style survival game built with vanilla JavaScript.

## Project Structure

```
blockyhorde/
├── index.html          # Clean HTML structure (no embedded CSS/JS)
├── styles.css          # All styling and responsive design
├── main.js            # Application entry point
├── config.js          # Game configuration and constants
├── game.js            # Core game logic and state management
├── renderer.js        # All rendering and drawing functions
├── input.js           # Keyboard and touch input handling
└── ui.js              # UI updates and DOM manipulation
```

## Architecture Overview

### Separation of Concerns

The codebase has been refactored from a single 878-line HTML file into well-organized, maintainable modules:

#### **index.html** (~60 lines)
- Clean HTML structure
- No inline JavaScript or CSS
- Semantic markup for game UI elements

#### **styles.css**
- All styling in one place
- Responsive design for mobile/desktop
- CSS animations and transitions

#### **config.js**
- Centralized configuration
- Easy to modify game parameters
- Export/import pattern for constants

#### **main.js**
- Application entry point
- Initializes all managers
- Starts the game loop

#### **game.js** - Core Game Logic
- `Game` class manages game state
- Handles game loop and timing
- Manages entities (player, enemies, projectiles)
- Collision detection
- Difficulty scaling
- Clean, readable methods

#### **renderer.js** - Rendering Engine
- All drawing functions isolated
- Voxel texture generation
- Background rendering
- Entity rendering (player, enemies, projectiles)
- Pure functions for easy testing

#### **input.js** - Input Management
- `InputManager` class
- Keyboard input handling
- Touch/joystick controls
- Device detection
- Normalized input API

#### **ui.js** - UI Management
- `UIManager` class
- DOM manipulation centralized
- Health bar updates
- Timer and stats display
- Game over screen
- Event listener management

## Key Improvements

### 1. **Modularity**
- Each file has a single, clear responsibility
- Easy to find and modify specific functionality
- Reduced coupling between components

### 2. **Maintainability**
- Code is organized logically
- Comments and JSDoc documentation
- Clear function and variable names
- No inline event handlers

### 3. **Readability**
- Consistent code style
- Proper indentation
- Logical grouping of related code
- Self-documenting code structure

### 4. **Testability**
- Pure functions in renderer
- Isolated business logic
- Easy to mock dependencies
- Clear interfaces between modules

### 5. **Scalability**
- Easy to add new features
- Simple to extend existing functionality
- Module pattern supports growth

## How to Run

1. Serve the files with any HTTP server (required for ES6 modules)
2. Open `index.html` in a modern browser

Example using Python:
```bash
python3 -m http.server 8000
```

Then visit: `http://localhost:8000`

## Game Controls

- **Desktop**: WASD or Arrow Keys to move
- **Mobile**: Virtual joystick
- **Auto-Attack**: Automatically shoots at nearest enemy

## Technical Details

- **Vanilla JavaScript** (ES6 modules)
- **HTML5 Canvas** for rendering
- **No framework dependencies**
- **Responsive design** (mobile/desktop)
- **Touch API** for mobile controls

## Testing

This project uses **Jest** for comprehensive unit and integration testing. All new features and bug fixes should include tests to ensure code quality and prevent regressions.

### Test Infrastructure

#### Setup
- **Framework**: Jest 30.2.0
- **Environment**: jsdom (simulates browser environment)
- **ES Modules**: Full ES6 module support with `NODE_OPTIONS=--experimental-vm-modules`
- **Test Location**: `__tests__/` directory
- **Setup File**: `__tests__/setup.js` (mocks browser APIs and canvas context)

#### Running Tests

```bash
# Install dependencies first
npm install

# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- __tests__/game.test.js

# Watch mode for development
npm test -- --watch
```

#### Test Coverage

The test suite includes **144 tests** covering all core gameplay systems:

- **Player Systems** (`game.test.js`)
  - Movement mechanics
  - Speed buffs
  - Health and damage

- **Enemy Systems** (`enemies.test.js`)
  - Spawning mechanics
  - Movement and pathfinding
  - Boss behavior and scaling

- **Projectile Systems** (`projectiles.test.js`)
  - Player projectiles
  - Boss projectiles
  - Ghast fireball mechanics

- **Collision Detection** (multiple test files)
  - AABB collision algorithm
  - Player-enemy collisions
  - Projectile-enemy collisions

- **Difficulty Scaling** (`difficulty.test.js`)
  - Enemy speed multipliers
  - Enemy damage scaling
  - Enemy HP scaling
  - Spawn rate quadratic scaling

- **Item Systems** (`items.test.js`)
  - Item drops
  - Buff system (attack speed, damage, speed)
  - Buff stacking mechanics
  - Buff expiration

- **Special Abilities** (`abilities.test.js`)
  - Ghast fireball ability
  - Cooldown system
  - Splash damage mechanics

- **Game State** (`game.test.js`)
  - Game over conditions
  - Boss spawning triggers
  - Boss defeat mechanics

### TDD Expectations

**All new features and bug fixes must include tests before merging.**

#### Test-Driven Development Workflow

1. **Write Tests First**
   - Before implementing a feature, write tests that describe the expected behavior
   - Tests should fail initially (red phase)

2. **Implement the Feature**
   - Write the minimum code needed to make tests pass (green phase)
   - Focus on getting tests to pass, not perfection

3. **Refactor**
   - Clean up the implementation while keeping tests passing
   - Improve code quality, readability, and performance

4. **Update Documentation**
   - Update comments and README if behavior changes
   - Ensure test descriptions are clear and accurate

#### Writing Good Tests

- **Descriptive Names**: Test descriptions should clearly state what is being tested
  ```javascript
  test('player takes damage when colliding with enemy', () => { ... });
  ```

- **Arrange-Act-Assert Pattern**:
  ```javascript
  test('example test', () => {
    // Arrange: Set up test conditions
    const game = new Game(canvas, config);

    // Act: Execute the behavior being tested
    game.update(16);

    // Assert: Verify the expected outcome
    expect(game.player.health).toBe(90);
  });
  ```

- **Test One Thing**: Each test should verify a single behavior
- **Isolated Tests**: Tests should not depend on each other
- **Mock External Dependencies**: Use the setup file for browser API mocks

#### Test Requirements

- **New Features**: Must include tests for all new functionality
- **Bug Fixes**: Must include a test that would have caught the bug
- **Refactoring**: Existing tests must continue to pass
- **Coverage**: Aim for high coverage, especially for critical game logic

#### Test File Organization

Match test files to source files:
```
game.js → __tests__/game.test.js
renderer.js → __tests__/renderer.test.js
```

Group related tests using `describe` blocks:
```javascript
describe('Player Movement', () => {
  test('moves right when right key pressed', () => { ... });
  test('moves left when left key pressed', () => { ... });
});
```

## Development Notes

The refactoring maintains 100% feature parity with the original single-file version while providing a much cleaner, more maintainable codebase.

### Before
- 1 file, 878 lines
- Mixed HTML, CSS, and JavaScript
- Inline event handlers
- Hard to navigate and maintain

### After
- 8 organized files
- Clear separation of concerns
- Modern ES6 module system
- Easy to understand and extend
- Comprehensive test coverage with Jest
