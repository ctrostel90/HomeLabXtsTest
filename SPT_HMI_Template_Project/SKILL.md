# HMI Component Generator Skill

This skill generates a complete HMI Panel component following the SPT HMI Template Project conventions.

## Parameters

- `component`: The name of the component to create (e.g., "Motor", "Sensor", "Tank")
- `panelDataPoints`: 2-3 basic view-only data points to display in the panel (e.g., "Current Speed, Running Status, Fault Status")
- `popupDataPoints`: Additional specific data points to display in the popup (e.g., "Target Speed, Acceleration, Deceleration, Total Run Time, Cycle Count")

## What this skill creates

1. **Panel User Control** (`UserControls/Panels/<Component>Panel.usercontrol`)
   - 200×150px compact card for main pages
   - Shows component name and the specified panel data points (2-3 basic read-only values)
   - Includes popup instance for detailed view
   - Follows panel styling conventions (10px horizontal padding, 5px vertical spacing)

2. **Popup User Control** (`Popups/PanelPopups/<Component>.usercontrol`)
   - 820×450px detailed control dialog
   - Three-row structure:
     - **Top**: Status indicators and the specified popup data points (14px labels, 14px values)
     - **Middle**: Command buttons (110px fixed width)
     - **Bottom**: Tabbed interface (Control/Statistics tabs, 100px button column)
   - Modal popup with visibility binding to panel

3. **Descriptor Files**
   - `<Component>Panel.usercontrol.json`
   - `<Component>.usercontrol.json`

4. **PLC Structure** (`ST_<Component>_HMI`)
   - Extends `ST_HmiFunction`
   - Includes all %pp% parameters used in the user controls
   - Added to TwinCAT project and instantiated in MAIN POU

5. **Visual Studio Solution Integration**
   - Panel and popup user controls added to `HmiProj/HmiProj.hmiproj`
   - PLC structure added to `TempPanelStructs/Panels/Panels.plcproj`
   - All entries placed alphabetically among existing items

## Usage

```
/generate-panel component:"Motor" panelDataPoints:"Current Speed, Running Status, Fault Status" popupDataPoints:"Target Speed, Acceleration, Deceleration, Total Run Time, Cycle Count, Last Start Time"
```

This will create MotorPanel.usercontrol (with the specified panel data points), Motor.usercontrol popup (with the specified popup data points), and ST_Motor_HMI structure.

## Conventions Applied

- **Panel Architecture**: Two-tier system (compact panel + detailed popup)
- **Spacing**: 10px horizontal padding, 5px vertical spacing (panels), 5-10px (popups)
- **Font Sizes**: 14px titles, 12px labels, 16px values (panel), 14px values (popup status)
- **Grid Layout**: 4-row panel (0.25 factor each), 3-row popup (1.2/1.0/3.0 factors)
- **Button Dimensions**: 110px command buttons, 100px tab buttons
- **Lock Icon**: 30px fixed column with 20×20px icon
- **Status Colors**: DefaultGrey (false), DefaultGreen (true), DefaultRed (errors)
- **PLC Binding**: `%s%ADS.PLC1.MAIN.<Instance>.<Property>%/s%` pattern

## Example Components

- Cylinders, Valves, Pumps, VFDs
- Motors, Sensors, Tanks
- Conveyors, Actuators, Dispensers

---

## Prompt Template

Use the saved panel and popup conventions from CLAUDE.md and reference existing panel user controls in the `UserControls/Panels/` folder and their associated popups in the `Popups/PanelPopups/` folder and PLC structures in the TempPanelStructs TwinCAT Project.

With these examples in mind, create a **<Component>Panel.usercontrol** TwinCAT HMI User Control which displays:
- Component name in the header
- The following panel data points: <PanelDataPoints>
- A popup instance with the name in the header and target file pointing to `<Component>.usercontrol`
- Lock icon (30px column, 20×20px icon)
- Follow panel styling: 200×150px size, 4-row grid (0.25 factor), 10px horizontal padding, 5px vertical spacing

Also create **<Component>.usercontrol** popup (in `Popups/PanelPopups/`) which displays:
- **Top section (Row 0, 1.2 factor)**: Status indicators and key data displays
  - Status indicators (Enabled, Busy, Error)
  - The following popup data points: <PanelDataPoints>, <PopupDataPoints>, and anything else that may be helpful
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

Next, create a PLC DUT called **ST_<Component>_HMI** in the TempPanelStructs TwinCAT project which:
- Extends `ST_HmiFunction`
- Includes all the properties used in the %pp% parameter bindings in both user controls
- Add appropriate data types (BOOL for status, LREAL for values, STRING for text, etc.)
- Create an instance of the structure in the MAIN POU with the name `<Component>1` or similar

**IMPORTANT: Add all files to the Visual Studio solution:**

1. **Add HMI user controls to `HmiProj/HmiProj.hmiproj`:**
   - Locate the alphabetically appropriate position among existing panel user controls (search for "UserControls\Panels\")
   - Add the panel user control entry:
     ```xml
     <Content Include="UserControls\Panels\<Component>Panel.usercontrol">
       <SubType>Content</SubType>
     </Content>
     <Content Include="UserControls\Panels\<Component>Panel.usercontrol.json">
       <SubType>Content</SubType>
       <DependentUpon>UserControls\Panels\<Component>Panel.usercontrol</DependentUpon>
     </Content>
     ```
   - Locate the alphabetically appropriate position among popup user controls (search for "Popups\PanelPopups\")
   - Add the popup user control entry:
     ```xml
     <Content Include="Popups\PanelPopups\<Component>.usercontrol">
       <SubType>Content</SubType>
     </Content>
     <Content Include="Popups\PanelPopups\<Component>.usercontrol.json">
       <SubType>Content</SubType>
       <DependentUpon>Popups\PanelPopups\<Component>.usercontrol</DependentUpon>
     </Content>
     ```

2. **Add PLC structure to `TempPanelStructs/Panels/Panels.plcproj`:**
   - Locate the alphabetically appropriate position among existing DUT entries (search for "DUTs\ST_")
   - Add the structure entry:
     ```xml
     <Compile Include="DUTs\ST_<Component>_HMI.TcDUT">
       <SubType>Code</SubType>
     </Compile>
     ```

When creating the panel/popup, follow the **Panel Architecture (Two-Tier System)** rules defined in the CLAUDE.md file, including all spacing standards, font size hierarchy, structural patterns, visual conventions, and popup organization.
