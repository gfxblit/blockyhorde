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
