"""Style Guide: Mapping Zip File Design to TomeBase Themed System

## Design Philosophy
The zip file contains a design with clean, modern aesthetics using:
- Clean card-based layouts with subtle borders
- Consistent spacing and typography
- Theme-aware colors using CSS variables
- Hover states and micro-interactions

## Theme Mapping

### Color Variables (Zip → TomeBase)
- Zip: `--bg`, `--surface`, `--text`, `--accent`
- TomeBase: `--bg-page`, `--bg-card`, `--text-main`, `--accent`

### Spacing Scale (Zip → TomeBase)
- Zip: Uses rem units directly
- TomeBase: Uses Tailwind spacing scale (4px increments)

### Border Radius
- Zip: Mixed usage (8px, 12px, 14px, 50%)
- TomeBase: Standardized with CSS variables (`--card-radius`, `--button-radius`)

## Component Mapping

### Common Components

#### Card Component
**Zip:** Simple div with background, border, border-radius
**TomeBase Update:** Create a Card component with theme-aware styles

#### Button Component  
**Zip:** Inline styled buttons with variants (primary, outline, ghost)
**TomeBase Update:** Update existing button component with theme variables

#### Stats Cards
**Zip:** Grid of cards with icons, values, labels
**TomeBase Update:** Create themed stat card components

#### Navigation Tabs
**Zip:** Tab navigation with active states
**TomeBase Update:** Integrate with existing navigation patterns

#### Form Controls
**Zip:** Inputs, textareas, select elements with theme styling
**TomeBase Update:** Update existing input component

## Typography
### Zip Font Stack
- Primary: Inter font family
- Code: JetBrains Mono monospace

### TomeBase Font Stack  
- Primary: Similar (Inter + Geist)
- Code: JetBrains Mono (already matches)

## Component Updates

### 1. Button Component (/home/bender/tomebase/tomebase/packages/ui/src/components/button.tsx)
- Add theme variants (primary, secondary, ghost)
- Add hover states with theme variables
- Standardize border-radius using CSS variables
- Add active states with scale transform

### 2. Card Component (/home/bender/tomebase/tomebase/packages/ui/src/components/card.tsx)  
- Update to use theme variables
- Add border-radius control via CSS variable
- Add hover states and transitions
- Support theming across all 5 themes

### 3. Badge Component (/home/bender/tomebase/tomebase/packages/ui/src/components/badge.tsx)
- Update for theme compatibility
- Use theme colors for status indicators
- Ensure accessibility and contrast

### 4. Input Component (/home/bender/tomebase/tomebase/packages/ui/src/components/input.tsx)
- Update for theme awareness
- Match the visual style from zip file
- Add proper spacing and typography

### 5. Navigation Component (/home/bender/tomebase/tomebase/packages/ui/src/components/navigation.tsx)
- Update for theme compatibility
- Add hover states matching zip file behavior
- Standardize spacing and transitions

### 6. Logo Component (/home/bender/tomebase/tomebase/packages/ui/src/components/logo.tsx)
- Update for theme compatibility (SVG path may need updating)
- Ensure it works with all themes
- Match the zip file logo style

## Page Component Updates

### Dashboard (/home/bender/tomebase/tomebase/apps/web/app/dashboard/page.tsx)
- Update stat cards to use new themed components
- Ensure grid layouts match zip file
- Update color schemes to use theme variables
- Maintain responsive design

### Landing (/home/bender/tomebase/tomebase/apps/web/app/page.tsx)  
- Update feature cards to use themed Card component
- Update hero section with theme-aware styling
- Ensure responsive layout
- Add scroll animations and hover effects

### Docs Editor (/home/bender/tomebase/tomebase/apps/web/app/docs/[project]/editor.tsx)
- Update markdown editor with themed components
- Ensure syntax highlighting matches theme
- Update toolbar buttons with new theme system
- Add hover states and transitions

## Implementation Priority

1. **High Priority:**
   - Button component update (affects many pages)
   - Card component update (affects many pages)
   - Dashboard page updates
   - Landing page updates

2. **Medium Priority:**
   - Badge component updates
   - Input component updates
   - Navigation component updates

3. **Low Priority:**
   - Logo component
   - Unused components

## Verification Checklist
- [ ] All components use theme variables
- [ ] Design matches zip file visually
- [ ] Theme switching works correctly
- [ ] Responsive design maintained
- [ ] Hover states and transitions work
- [ ] Accessibility maintained
- [ ] No console errors
- [ ] Tests pass

## Next Steps
1. Update Button component with theme variants
2. Update Card component with theme awareness
3. Update Dashboard page to use new components
4. Update Landing page to use themed components
5. Update remaining page components
6. Verify all changes work together
7. Test theme switching
8. Run tests to ensure no regressions
"""