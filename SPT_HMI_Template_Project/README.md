# Introduction 
A template HMI project for use with SPT applications. The intention is to have a visually consistent output across HMI projects when customer specific design has not been specified.

# Getting Started
Packages from SPTPackages should be placed in C:\ProgramData\Beckhoff\NuGetPackages 

The HMI Project has been named as generically as possible. If a more application specific name is desired, steps to rename are outline here. 

Option 1 - Basic Rename
Right-click on the HMI Project and rename. 
In Properties>tchmimanifest.json, change name and short_name.
Right-click on the HMI Project and select Properties. Go to General, change Configuration to All Configurations and change Build>Namespace to your new name.
In TcHmiSrv.Config.default.json, change the file paths under VIRTUALDIRECTORIES from HmiProj to your new name.
Unload the HMI project, select the unloaded project and in the Properties Window, change the part of the file path from the old name to the new name.
With the project closed, in the Project Directory, change the name of the folder containing the .hmiproj file.

Option 2 - Create a local Visual Studio Template
Open the cloned project.
Click on Project in the Menu bar and select Export Template. Follow the prompts and give the template a name like SptHmiTemplate.
Once it is done, you can create a new project like you normally would, and can select the template. Giving it a specific name will then take care of all of the other places where the name is important.
With both the cloned project and the new derived project open, you will need to port some extension configs so that mapped symbols in the template come over.
Go to the Config page of the cloned project via the server icon in the system tray, and export the TcHmiSrv (with a filter of SYMBOLS) config by navigating to the TcHmiSrv tab, clicking on the hamburger menu, and selecting Export.
Finally, go to the config page of the new project and select Import in the hamburger menu on the TcHmiSrv tab.
Note - make sure to still update your local repo whenever starting a new project to ensure you have the latest changes and additions.

# Build and Test
Prior to running the HMI, you may need to enable the Server Extensions manually.

# Contribute
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

If you want to learn more about creating good readme files then refer the following [guidelines](https://docs.microsoft.com/en-us/azure/devops/repos/git/create-a-readme?view=azure-devops). You can also seek inspiration from the below readme files:
- [ASP.NET Core](https://github.com/aspnet/Home)
- [Visual Studio Code](https://github.com/Microsoft/vscode)
- [Chakra Core](https://github.com/Microsoft/ChakraCore)