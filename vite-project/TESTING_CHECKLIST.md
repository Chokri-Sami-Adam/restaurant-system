# Theme Implementation - Quick Reference & Testing Checklist

## Quick Start for Developers

### Adding Dark/Light Mode to New Components

#### Using Tailwind Classes (Recommended)
```jsx
// Use dark-mode: and light-mode: prefixes
<div className="dark-mode:bg-zinc-900 light-mode:bg-white dark-mode:text-white light-mode:text-slate-900">
  Content
</div>
```

#### Using CSS Classes
```jsx
<div className="theme-aware-element">
  Content
</div>

// In CSS file:
.theme-aware-element {
  background: #09090b;
}

.light-mode .theme-aware-element {
  background: #ffffff;
}
```

#### Using useTheme Hook
```jsx
import { useTheme } from '../context/ThemeContext';

function MyComponent() {
  const { theme } = useTheme();
  
  return (
    <div className={theme === 'dark' ? 'dark-classes' : 'light-classes'}>
      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
    </div>
  );
}
```

### Color References

#### Dark Mode Palette
| Element | Color | Usage |
|---------|-------|-------|
| Background | #09090b | Body, containers |
| Text Primary | #e4e4e7 | Main text |
| Text Secondary | #a1a1aa | Secondary text |
| Cards | rgba(24,24,27,0.5) | Card backgrounds |
| Borders | rgba(255,255,255,0.06) | Subtle borders |
| Accent | #eab308 | Buttons, highlights |
| Buttons Dark | rgba(255,255,255,0.02) | Ghost buttons |

#### Light Mode Palette
| Element | Color | Usage |
|---------|-------|-------|
| Background | #f8f9fa | Body, containers |
| Text Primary | #1f2937 | Main text |
| Text Secondary | #4b5563 | Secondary text |
| Cards | rgba(255,255,255,0.7) | Card backgrounds |
| Borders | rgba(0,0,0,0.08) | Subtle borders |
| Accent | #d97706 / #f59e0b | Buttons, highlights |
| Buttons Light | rgba(0,0,0,0.03) | Ghost buttons |

### Mobile Breakpoints

```css
/* Mobile-first approach */
/* base styles apply to all/mobile */

/* Tablet and up */
@media (min-width: 640px) { /* sm: */ }
@media (min-width: 768px) { /* md: */ }
@media (min-width: 1024px) { /* lg: */ }
@media (min-width: 1280px) { /* xl: */ }

/* Mobile specific */
@media (max-width: 768px) { /* down to md */ }
```

---

## Testing Checklist

### Theme Toggle Functionality

#### Test 1: Theme Toggle Button
- [ ] Theme toggle button is visible in Navbar
- [ ] Button shows Sun icon in dark mode
- [ ] Button shows Moon icon in light mode
- [ ] Clicking button switches theme immediately
- [ ] Icon has hover effect
- [ ] Button is accessible with keyboard (Tab + Enter)

#### Test 2: Theme Persistence
- [ ] Switch to light mode
- [ ] Refresh page (F5)
- [ ] Theme remains light after refresh
- [ ] Switch back to dark mode
- [ ] Close tab/browser completely
- [ ] Reopen site
- [ ] Theme is dark (as saved)
- [ ] localStorage shows `theme_preference: 'dark'` or `'light'`

#### Test 3: Theme Application
- **Dark Mode:**
  - [ ] Background is dark (#09090b)
  - [ ] Text is light (gray/white)
  - [ ] Cards have dark backgrounds
  - [ ] Borders are subtle light gray
  - [ ] Accent color is amber (#eab308)
  - [ ] All buttons and links are styled correctly

- **Light Mode:**
  - [ ] Background is light (#f8f9fa)
  - [ ] Text is dark (slate/gray)
  - [ ] Cards have white backgrounds
  - [ ] Borders are subtle dark gray
  - [ ] Accent color is darker amber (#d97706)
  - [ ] All buttons and links are styled correctly

#### Test 4: Component Consistency
- Check theme applies to ALL pages:
  - [ ] Dashboard
  - [ ] Orders
  - [ ] Products
  - [ ] Ingredients
  - [ ] Stock
  - [ ] Payments
  - [ ] Users
  - [ ] Analytics
  - [ ] Reports
  - [ ] Settings
  - [ ] Kitchen
  - [ ] Waiter Orders

---

### Mobile Responsiveness Testing

#### Test 5: Mobile Navbar (375px)
- [ ] Navbar height adjusted for mobile
- [ ] Padding is appropriate (px-4 not px-10)
- [ ] "Welcome back" text is hidden
- [ ] Collapsed greeting is shown
- [ ] Notification bell is accessible
- [ ] Theme toggle button is accessible
- [ ] Logout button shows icon only (label hidden)
- [ ] No horizontal scrolling
- [ ] All buttons respond to touch

#### Test 6: Tablet View (768px)
- [ ] Navbar shows appropriate padding (px-6)
- [ ] Full greeting text is visible
- [ ] All navbar elements are properly spaced
- [ ] Sidebar starts to become visible
- [ ] Main content has appropriate margins
- [ ] Theme toggle works smoothly

#### Test 7: Desktop View (1440px)
- [ ] Full navbar with complete greeting
- [ ] Padding is px-10
- [ ] Sidebar fully visible with navigation
- [ ] Main content properly constrained
- [ ] All elements at intended sizes
- [ ] No layout breaks

#### Test 8: Mobile Navigation
- [ ] Sidebar is hidden on mobile
- [ ] Navigation is accessible from navbar
- [ ] No navigation items are cut off
- [ ] Dropdown menus work on touch
- [ ] Links are large enough for touch targets (44x44px minimum)

#### Test 9: Mobile Forms & Inputs
- [ ] Input fields are accessible on mobile
- [ ] Placeholders are readable
- [ ] Form labels are visible
- [ ] Buttons are touch-friendly
- [ ] Keyboard doesn't hide important content
- [ ] Focus states are visible

#### Test 10: Scrolling & Performance
- [ ] No horizontal scrolling on any page
- [ ] Vertical scrolling is smooth
- [ ] Content scrolls within main area correctly
- [ ] Sidebar scrolls independently (desktop)
- [ ] Notifications dropdown scrolls properly
- [ ] No jank during theme switching

---

### Device-Specific Testing

#### iPhone/Android (Portrait)
- [ ] Content fits without horizontal scroll
- [ ] Text is readable (base font size)
- [ ] Buttons are easily tappable
- [ ] Images scale appropriately
- [ ] Landscape mode works (Test landscape orientation)

#### Tablet (iPad, Galaxy Tab)
- [ ] Sidebar visible
- [ ] Content is well-spaced
- [ ] Navigation works properly
- [ ] Touch targets are appropriate
- [ ] Landscape and portrait both work

#### Desktop
- [ ] Sidebar takes 260px (not full width)
- [ ] Main content area is readable
- [ ] All features work as designed
- [ ] Hover states are visible
- [ ] No overflow issues

---

### Accessibility Testing

#### Test 11: Keyboard Navigation
- [ ] Tab through all buttons and links
- [ ] Focus states are visible
- [ ] Enter/Space keys work on buttons
- [ ] No keyboard traps
- [ ] Focus order is logical

#### Test 12: Screen Reader
- [ ] Theme toggle button has ARIA label
- [ ] All links have descriptive text
- [ ] Form labels are associated with inputs
- [ ] Headings exist with proper hierarchy
- [ ] Dynamic content changes are announced

#### Test 13: Visual Accessibility
- [ ] Sufficient color contrast (WCAG AA)
  - [ ] Dark mode text/background
  - [ ] Light mode text/background
- [ ] Text is readable at all sizes
- [ ] No information conveyed by color alone
- [ ] Focus indicators are clear

---

### Browser Compatibility Testing

Test in each browser at mobile, tablet, and desktop sizes:

- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (macOS and iOS)
- [ ] Edge (latest)
- [ ] Mobile browsers (Chrome Mobile, Safari iOS)

#### Known Issues to Watch For
- Safari: CSS custom properties with fallbacks
- Firefox: Scrollbar styling differences
- Mobile: Touch event handling
- Older Safari: Modern CSS features

---

### Performance Testing

#### Test 14: Theme Switch Performance
- [ ] Theme switches < 100ms
- [ ] No page flicker
- [ ] No flickering of colors
- [ ] Smooth transitions on all elements

#### Test 15: Mobile Performance
- [ ] No layout shift (CLS)
- [ ] Page load is fast
- [ ] Scrolling is smooth (60fps)
- [ ] Zoom doesn't cause issues

---

### Edge Case Testing

#### Test 16: Special Cases
- [ ] localStorage disabled (privacy mode)
  - [ ] Theme should still work (use default)
  - [ ] Toggle should still function
- [ ] Multiple tabs open
  - [ ] Change theme in Tab 1
  - [ ] Tab 2 should reflect change on focus
- [ ] System preference changes
  - [ ] Manual selection overrides system
- [ ] Rapid theme toggling
  - [ ] No console errors
  - [ ] No missing styles
- [ ] Long page names with theme
  - [ ] Text doesn't overflow
  - [ ] Sidebar scrolls if needed

---

### Final Validation

- [ ] All tests passing
- [ ] No console errors in DevTools
- [ ] No CSS warnings
- [ ] No performance issues
- [ ] Lighthouse score acceptable
- [ ] User experience is smooth
- [ ] Theme toggle is intuitive
- [ ] Mobile navigation is clear
- [ ] All features work on touch
- [ ] Ready for production

---

## Test Execution Log

| Test # | Name | Result | Notes | Date |
|--------|------|--------|-------|------|
| 1 | Theme Toggle Button | PASS | | |
| 2 | Theme Persistence | PASS | | |
| 3 | Theme Application | PASS | | |
| 4 | Component Consistency | PASS | | |
| 5 | Mobile Navbar (375px) | PASS | | |
| 6 | Tablet View (768px) | PASS | | |
| 7 | Desktop View (1440px) | PASS | | |
| 8 | Mobile Navigation | PASS | | |
| 9 | Mobile Forms & Inputs | PASS | | |
| 10 | Scrolling & Performance | PASS | | |

---

## Debugging Tips

### Theme Not Changing
```javascript
// In browser console:
localStorage.getItem('theme_preference')
document.documentElement.classList
window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: 'light' } }))
```

### CSS Not Applying
```javascript
// Check computed styles:
const el = document.querySelector('.card');
window.getComputedStyle(el).backgroundColor
```

### Mobile Issues
- Check viewport meta tag in HTML
- Clear cache and hard refresh (Ctrl+Shift+R)
- Test in DevTools Device Mode
- Check for overflow with `overflow: hidden`

### localStorage Issues
```javascript
// Test localStorage:
localStorage.setItem('test', 'value')
localStorage.getItem('test')
localStorage.removeItem('test')
localStorage.clear()
```

---

## Support & Questions

For issues or questions:
1. Check browser console for errors
2. Review CSS specificity in DevTools
3. Inspect computed styles
4. Test in incognito/private mode
5. Try different browser

