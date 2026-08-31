# Horizon of Capital — Mandatory File Update Rule

## CRITICAL: Always Update AGENTS.md and DESIGN.md

After **every change** to the Horizon of Capital project, you **MUST** update both files:

### 1. `AGENTS.md` (Project Root)
- Update **File Structure** section if files are added/removed/moved
- Update **Routes** table if new routes are added
- Update **Sidebar Navigation Order** if nav items change
- Update **Component Patterns** if new patterns are introduced
- Update **Mock Data Structure** table if mock data changes
- Update **Change Log** with date, change description, and affected files
- Update **Dependencies** if new packages are installed

### 2. `DESIGN.md` (Project Root)
- Update **Color Palette** if new colors are introduced
- Update **Component Specifications** if component styles change
- Update **Typography** if font sizes/weights change
- Update **Spacing** if layout spacing changes
- Update **Animations** if new animations are added
- Update **Icon Mapping** tables if new icon patterns are used
- Update **Change Log** with date, design change, and affected components

### When to Read These Files
- **Before making ANY change** — Read both files first to understand current state
- **Before adding new pages** — Check the "When Adding New Features" section in AGENTS.md
- **Before touching styles** — Check DESIGN.md for existing patterns and tokens

### How to Update
- Add entries to the Change Log tables at the bottom
- Update the `Last Updated` date
- Keep entries concise but specific
