---
description: Generate a complete HMI panel component with panel, popup, and PLC structure
args:
  component:
    description: The name of the component (e.g., Motor, Sensor, Tank)
    required: true
  panelDataPoints:
    description: 2-3 basic view-only data points for the panel (comma-separated)
    required: true
  popupDataPoints:
    description: Additional specific data points for the popup (comma-separated)
    required: false
---

Use the saved panel and popup conventions from CLAUDE.md and reference existing panel user controls in the `UserControls/Panels/` folder and their associated popups in the `Popups/PanelPopups/` folder and PLC structures in the TempPanelStructs TwinCAT Project.

With these examples in mind, create a **{{component}}Panel.usercontrol** TwinCAT HMI User Control which displays:
- Component name in the header
- The following panel data points: {{panelDataPoints}}
- A popup instance with the name in the header and target file pointing to `{{component}}.usercontrol`
- Lock icon (30px column, 20×20px icon)
- Follow panel styling: 200×150px size, 4-row grid (0.25 factor), 10px horizontal padding, 5px vertical spacing

Also create **{{component}}.usercontrol** popup (in `Popups/PanelPopups/`) which displays:
- **Top section (Row 0, 1.2 factor)**: Status indicators and key data displays
  - Status indicators (Enabled, Busy, Error)
  - The following popup data points: {{panelDataPoints}}, {{popupDataPoints}}, and anything else that may be helpful
  - Error display (icon + error code)
  - Use 14px labels, 14px values
- **Middle section (Row 1, 1.0 factor)**: Command buttons
  - Primary operation buttons (Enable, Disable, Reset, etc.)
  - 110px fixed-width CoreButton controls
  - 2.5-5px horizontal spacing
- **Bottom section (Row 2, 3.0 factor)**: Tabbed interface
  - 100px left column with toggle buttons for tabs
  - **Control tab** (default active): Manual operation inputs with LabeledNumericInput
  - **Statistics tab**: Operational statistics with DataDisplayTile controls
  - Use default project font sizes (no explicit values)
- Size: 820×450px, positioned at 210px left, 10px top
- Modal: True, RestoreBounds: False

Be sure to include the `.usercontrol.json` descriptor files for both controls and register them in the `HmiProj/Properties/tchmiconfig.json` file under `userControls`.

Next, create a PLC DUT called **ST_{{component}}_HMI** in the TempPanelStructs TwinCAT project which:
- Extends `ST_HmiFunction`
- Includes all the properties used in the %pp% parameter bindings in both user controls
- Add appropriate data types (BOOL for status, LREAL for values, STRING for text, etc.)
- Create an instance of the structure in the MAIN POU with the name `{{component}}1` or similar

**IMPORTANT: Add all files to the Visual Studio solution:**

1. **Add HMI user controls to `HmiProj/HmiProj.hmiproj`:**
   - Locate the alphabetically appropriate position among existing panel user controls (search for "UserControls\Panels\")
   - Add the panel user control entry:
     ```xml
     <Content Include="UserControls\Panels\{{component}}Panel.usercontrol">
       <SubType>Content</SubType>
     </Content>
     <Content Include="UserControls\Panels\{{component}}Panel.usercontrol.json">
       <SubType>Content</SubType>
       <DependentUpon>UserControls\Panels\{{component}}Panel.usercontrol</DependentUpon>
     </Content>
     ```
   - Locate the alphabetically appropriate position among popup user controls (search for "Popups\PanelPopups\")
   - Add the popup user control entry:
     ```xml
     <Content Include="Popups\PanelPopups\{{component}}.usercontrol">
       <SubType>Content</SubType>
     </Content>
     <Content Include="Popups\PanelPopups\{{component}}.usercontrol.json">
       <SubType>Content</SubType>
       <DependentUpon>Popups\PanelPopups\{{component}}.usercontrol</DependentUpon>
     </Content>
     ```

2. **Add PLC structure to `TempPanelStructs/Panels/Panels.plcproj`:**
   - Locate the alphabetically appropriate position among existing DUT entries (search for "DUTs\ST_")
   - Add the structure entry:
     ```xml
     <Compile Include="DUTs\ST_{{component}}_HMI.TcDUT">
       <SubType>Code</SubType>
     </Compile>
     ```

When creating the panel/popup, follow the **Panel Architecture (Two-Tier System)** rules defined in the CLAUDE.md file, including all spacing standards, font size hierarchy, structural patterns, visual conventions, and popup organization.
