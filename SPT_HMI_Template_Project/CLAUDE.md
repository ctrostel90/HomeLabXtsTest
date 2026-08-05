# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Beckhoff TwinCAT HMI Template Project** for SPT (Special Projects Team) applications. It provides a standardized, visually consistent HMI framework for industrial automation projects using TwinCAT 3 HMI framework.

## Build System

### Building the Project

This project uses MSBuild and the TwinCAT HMI build system:

```bash
# Build the project (from Visual Studio)
# Build > Build Solution (or F6)

# The build process:
# 1. Compiles TypeScript to JavaScript
# 2. Processes user controls and content files
# 3. Generates output to HmiProj/bin/
# 4. Creates Default.html entry page
```

### Configuration

- **Project file**: `HmiProj/HmiProj.hmiproj` (MSBuild XML format)
- **Main config**: `HmiProj/Properties/tchmiconfig.json` - defines themes, dependencies, user controls, pages
- **Build modes**:
  - Debug: Uses ports 3002/13002/10102
  - Release: Uses ports 3001/13001/10102

### TypeScript Configuration

- TypeScript 5.3.2 and 5.9.2 are used
- Config files: `tsconfig.json` and `tsconfig.tpl.json`
- TypeScript definitions reference: `Packages/Beckhoff.TwinCAT.HMI.Framework.*/runtimes/native1.12-tchmi/TcHmi.d.ts`

## Architecture

### Project Structure

```
HmiProj/
├── Desktop.view              # Main application entry point (startup view)
├── Pages/                    # Application pages (.content files)
│   ├── Home.content
│   ├── Manual.content
│   ├── Recipes.content
│   ├── Events.content
│   ├── Stations.content
│   └── Diagnostics/          # Diagnostic sub-pages
│       ├── Trends.content
│       ├── EtherCAT.content
│       └── System.content
├── UserControls/             # Reusable UI components (.usercontrol)
│   ├── CoreButton.usercontrol
│   ├── PackMLControl.usercontrol
│   └── Panels/               # Equipment panel components
│       ├── CylinderPanel.usercontrol
│       ├── VfdPanel.usercontrol
│       ├── PumpPanel.usercontrol
│       ├── ValvePanel.usercontrol
│       ├── HeaterCoolerPanel.usercontrol
│       ├── PidControllerPanel.usercontrol
│       ├── KinematicPanel.usercontrol
│       ├── NcAxis panels (AxisPTPPanel, etc.)
│       └── XTS panels (XtsMoverPanel, XtsStationPanel, XtsZonePanel, etc.)
├── Popups/                   # Popup dialogs
│   ├── Settings.content
│   ├── PackMLSelection.usercontrol
│   └── PanelPopups/          # Detail popups for equipment
│       ├── Cylinder.usercontrol
│       ├── EStop.usercontrol
│       ├── Vfd.usercontrol
│       └── (mirrors Panels/ structure)
├── Functions/                # JavaScript custom functions
│   ├── BuildManualPage.js    # Dynamically builds manual control page from PLC data
│   ├── GetModeName.js
│   ├── DisplayPermissiveText.js
│   └── GetKinematicStatus.js
├── Server/                   # TwinCAT HMI Server extensions config
│   ├── TcHmiSrv/             # Main server config
│   ├── ADS/                  # ADS (TwinCAT PLC) communication
│   ├── TcHmiEventLogger/
│   ├── TcHmiUserManagement/
│   ├── TcHmiRecipeManagement/
│   └── (other server extensions)
├── Themes/                   # Visual themes
│   ├── Base/                 # Light theme
│   └── Base-Dark/            # Dark theme (default)
└── Images/Icons/             # SVG icons for navigation and controls
```

### Key Architectural Patterns

#### 1. Navigation Structure

The main navigation is defined in `Desktop.view` using `TcHmiAccordionNavigation`:
- Left sidebar with expandable menu
- Main region for content loading
- Header with Beckhoff logo, event line, user management, and time
- PackML control panel (collapsible on right side)

#### 2. Panel Architecture (Two-Tier System)

Each equipment type has **two components**:
- **Panel** (`UserControls/Panels/*Panel.usercontrol`): Compact card shown on main pages
- **Popup** (`Popups/PanelPopups/*.usercontrol`): Detailed control shown when panel is clicked

Common panel types:
- Cylinders, Valves, Pumps, VFDs
- Heaters/Coolers with PID control
- NC Axes and Kinematics
- XTS (eXtended Transport System) components
- Safety devices (E-Stop, Safety Door, Light Curtain)

##### Panel and Popup Styling Conventions

**Spacing Standards**
- **Panels (200×150px)**: 10px horizontal padding, 5px vertical spacing between sections
- **Popups (820×450px)**: 10px horizontal padding, 5-10px vertical spacing
- **Lock icon area**: 30px fixed width column with 20×20px icon
- **Button spacing**: 5px vertical, 2.5px horizontal between elements

**Font Size Hierarchy**
- Applies to: **Panels** and **popup status bar (top section only)**
- Center and bottom popup sections: Use project defaults (no explicit font size values)
- **Panel titles/headers**: 14px
- **Data labels**: 12px
- **Data values**: 16px (panels) / 14px (popup status bar)
- **Status indicators**: 14px
- **Button text**: 90% relative sizing

**Structural Patterns**
- **Panel grid**: 4 rows × 1 column (0.25 factor each)
- **Header section**: Two-column grid (1 factor + 30px fixed for lock icon)
- **Popup size**: 820×450px, positioned at 210px left, 10px top
- **Button columns**: 110px fixed (commands), 100px (tabs)

**Visual Conventions**
- **Border**: 1px solid bottom border on headers
- **Status colors**: DefaultGrey (false), DefaultGreen (true), DefaultRed (errors)
- **Classes**: "grouping-container" for sections, "icon-dark" for SVG icons
- **Data tiles**: 10px horizontal, 5px vertical padding with label-to-value ratios of 1:1 or 2:1

**Popup Organization**

Popups follow a standard **3-row structure** with distinct purposes for each section:

- **Top Section (Row 0, 1.2 factor)**: Status and important data displays
  - Status indicators (Enabled, Busy, At Position, etc.)
  - Real-time process values (Current Position, Temperature, Pressure, etc.)
  - Error display (icon + error code)
  - Use DataDisplayTile and StatusIndicator controls
  - Font sizes apply here (14px labels, 14px values)

- **Middle Section (Row 1, 1.0 factor)**: Command buttons
  - Primary operation buttons (Start, Stop, Home, Reset, etc.)
  - Fixed-width columns (110px per button)
  - Use CoreButton.usercontrol for consistency
  - Horizontal layout with 2.5-5px spacing

- **Bottom Section (Row 2, 3.0 factor)**: Tabbed interface for detailed content
  - **100px left column** with toggle buttons for tab navigation
  - **Control tab** (active by default): Manual operation inputs
    - LabeledNumericInput controls for setpoints
    - Position targets, speed settings, pressure values, etc.
  - **Statistics tab**: Operational statistics and counters
    - Cycle counts, runtime hours, last operation times
    - DataDisplayTile controls for read-only values
  - **Additional tabs** as needed: Diagnostics, Settings, Advanced, etc.
  - Use visibility switching via toggle button triggers
  - No explicit font sizes (use project defaults)

- **Modal settings**: True (modal), False (restore bounds)

#### 3. Data Binding Pattern

Uses TwinCAT HMI symbol binding syntax:
- `%s%ADS.PLC1.MAIN.VariableName%/s%` - Server symbol (PLC variable via ADS)
- `%ctrl%ControlName::Property%/ctrl%` - Control property
- `%i%InternalSymbolName%/i%` - Internal symbol
- `%f%expression%/f%` - Formula/expression binding

PLC communication expects structure: `ADS.{PLCName}.{POUPath}.{Variable}`

#### 4. Dynamic Manual Page Generation

The `BuildManualPage` function (Functions/BuildManualPage.js):
- Reads JSON tree structure from PLC (`MachineHmiTree.SystemHmiTree`)
- Dynamically creates panel instances based on `ControlType` and `LinkPath`
- Arranges panels in 7-column grid layout
- Links each panel to its corresponding PLC data structure

## Server Configuration

### ADS (PLC Communication)

Configure in `Server/ADS/ADS.Config.default.json` and `ADS.Config.remote.json`:
- Default config for local development
- Remote config for deployment
- Symbols are mapped from TwinCAT PLC instances

### Virtual Directories

Defined in `Server/TcHmiSrv/TcHmiSrv.Config.default.json`:
- Maps local paths to web-accessible URLs
- Update namespace references when renaming project

## Theming

Two themes available:
- **Base**: Light theme
- **Base-Dark**: Dark theme (default, set in `activeTheme`)

Theme resources:
- Stylesheets: `BaseStyle.css` / `Base-DarkStyle.css`
- Themed values: `Base.theme` / `Base-Dark.theme` (JSON color definitions)
- Custom themed symbols defined in `tchmiconfig.json` under `symbols.themedResources`

Theme colors:
- DefaultGreen, DefaultRed, DefaultOrange, DefaultBlue, DefaultGrey
- HighlightColor (purple accent)

## Packages and Dependencies

### External Packages

Must be placed in `C:\ProgramData\Beckhoff\NuGetPackages`:
- SPT-specific packages (TcHmiExtendedControls, etc.)
- Beckhoff framework packages are in `Packages/` directory

### NuGet Packages

Managed via `packages.config`:
- Beckhoff.TwinCAT.HMI.Framework (v14.3.x)
- Beckhoff.TwinCAT.HMI.Controls
- Beckhoff.TwinCAT.HMI.BaseTemplate
- Microsoft.TypeScript.MSBuild (v5.3.2, v5.9.2)
- Server extensions (EventLogger, RecipeManagement, etc.)

## Renaming the Project

If renaming from "HmiProj" to a custom name:

1. Right-click project in Solution Explorer > Rename
2. Update `Properties/tchmimanifest.json`: Change `name` and `short_name`
3. Project Properties > All Configurations > Build > Namespace
4. Update `Server/TcHmiSrv/TcHmiSrv.Config.default.json`: Change `VIRTUALDIRECTORIES` paths
5. Unload project, rename in Properties window file path
6. Rename project folder on disk (with project closed)

Alternatively, create a Visual Studio template for reuse (see README.md Option 2).

## PackML Integration

This template is designed for PackML (Packaging Machine Language) state machines:
- `PackMLControl.usercontrol` provides state visualization and commands
- `PackMLStatemachinePanel.usercontrol` for detailed state machine view
- `PackMLSelection.usercontrol` for selecting between multiple state machines
- Expects PLC data structure with `Statemachine_HMI` interface

## File Naming Conventions

- Views: `*.view` (e.g., `Desktop.view`)
- Content/Pages: `*.content` (e.g., `Home.content`)
- User Controls: `*.usercontrol` (e.g., `CylinderPanel.usercontrol`)
- User Control Metadata: `*.usercontrol.json`
- Functions: `*.js` with matching `*.function.json` descriptor
- Themes: `*.theme` (JSON), `*Style.css`
- Keyboard Layouts: `*.keyboard.json`
- Localizations: `*.localization`

## Custom Functions

JavaScript functions registered with TcHmi framework:
- Define in `Functions/` directory
- Include descriptor file (`.function.json`)
- Register in `tchmiconfig.json` under `userFunctions`
- Use namespace pattern: `TcHmi.Functions.HmiProj.FunctionName`

Example registration:
```javascript
TcHmi.Functions.registerFunctionEx('FunctionName', 'TcHmi.Functions.HmiProj', TcHmi.Functions.HmiProj.FunctionName);
```

## Localization

Two languages supported (German, English):
- Language files: `Localization/de.localization`, `Localization/en.localization`
- Keyboard layouts per language in `KeyboardLayouts/`
- System keyboard auto-opens for text inputs

## Git Workflow

Main branch: `Development`
Current working branch: `Panels`

Project uses Git for version control. The `bin/` directory contains build output and should typically be in `.gitignore`.

## Important Notes

### Before Running

1. Enable Server Extensions manually in TwinCAT HMI Configuration
2. Ensure packages are in `C:\ProgramData\Beckhoff\NuGetPackages`
3. Check ADS routes if connecting to remote PLC

### Server Ports

Debug vs Release use different ports to allow running both configurations simultaneously.

### Data Directory

Default data root: `C:\Data\` (configured in internal symbol `DataRoot`)

## Documentation

Additional documentation in `Documentation/` folder:
- SPT HMI Style Guide.pdf
- SPT HMI Technical Guide.pdf
