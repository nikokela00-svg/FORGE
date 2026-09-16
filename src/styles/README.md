# styles

Global styles and design-system tokens.

- `src/app/globals.css` is the Tailwind entry point and holds the CSS
  variable design tokens (background, surface, border, foreground, accent).
- Tokens are consumed through Tailwind theme utilities (`bg-background`,
  `text-foreground`, ...) — components never hard-code colors.
- The full design system (spacing scale, radii, focus rings, typography
  ramp, light theme) lands in the next phase.
