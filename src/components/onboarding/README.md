# Onboarding System

A guided, first-run onboarding flow that introduces three key features while staying respectful of the user's focus.

## Features

### Progressive Disclosure
- No full-screen tour overlays
- Each step is dismissable with Esc or a close icon
- Respects reduced-motion browser preferences

### Persistence 
- Completion state persisted in `user.settings.onboardingSeen = true`
- Prevents replay for users who have already completed onboarding

### Analytics Integration
- Comprehensive event tracking:
  - `onboarding_start` - When onboarding begins
  - `onboarding_step_complete` - When user completes each step
  - `onboarding_dismiss` - When user dismisses/skips onboarding
  - `onboarding_done` - When onboarding is fully completed

## Onboarding Steps

### 1. Inspiration Page (/home)
- **Trigger**: First visit to `/home` when `hasSeen === false`
- **UI**: Popover anchored to the "Inspirations" header
- **Message**: "Browse your past wins here to beat writer's block. Click any tile to open it in the editor."
- **CTA**: "Got it" → proceeds to next step

### 2. Premium Filter (Conditional)
- **Condition**: Only shown if `user.plan === "premium"`
- **UI**: Popover anchored to Filter button
- **Message**: "Use advanced filters to surface your highest-impact ideas fast."
- **CTA**: "Next" → proceeds to final step
- **Auto-skip**: If user is not premium, this step is automatically skipped

### 3. Schedule a Note (/queue)
- **Navigation**: Auto-navigates to `/queue`
- **UI**: Modal dialog with multiple sub-steps
- **Flow**:
  1. Navigate to queue
  2. Create schedule → opens "Create schedule" modal
  3. Show activity graph component
  4. Create draft note modal
  5. Highlight "Save as draft" button
- **Message**: "Pick days you publish. We'll remind you and keep this graph green."
- **Final CTA**: "Finish" → completes onboarding

## Implementation Details

### File Structure
```
src/
├── types/onboarding.ts                    # TypeScript interfaces
├── app/providers/OnboardingProvider.tsx   # Context provider
├── lib/hooks/useOnboarding.ts            # Hook export
├── components/onboarding/
│   ├── onboarding-overlay.tsx            # Main overlay component
│   └── steps/
│       ├── inspiration-step.tsx          # Step 1: Inspiration
│       ├── premium-filter-step.tsx       # Step 2: Premium filters
│       └── schedule-note-step.tsx        # Step 3: Schedule notes
└── api/user/settings/route.ts            # API endpoint for persistence
```

### Provider Integration
The `OnboardingProvider` is mounted in the authenticated app layout:

```tsx
// src/app/(authenticated)/(has-subscription)/layout.tsx
<OnboardingProvider>
  {children}
  <OnboardingOverlay />
</OnboardingProvider>
```

### State Management
Uses React Context with the following state:
- `currentStep`: Current onboarding step (0-2)
- `isOpen`: Whether onboarding is currently active
- `hasSeen`: Whether user has completed onboarding
- `isLoading`: Loading state for API calls

### API Integration
- **GET** `/api/user/settings` - Fetch onboarding status
- **POST** `/api/user/settings` - Persist completion with `{ onboardingSeen: true }`

## Usage

### Basic Usage
The onboarding system is automatically initialized and will start when:
1. User visits `/home` for the first time
2. User hasn't completed onboarding (`onboardingSeen !== true`)

### Manual Control
```tsx
import { useOnboarding } from '@/lib/hooks/useOnboarding';

function MyComponent() {
  const { start, reset, dismiss, complete } = useOnboarding();
  
  return (
    <div>
      <button onClick={start}>Start Onboarding</button>
      <button onClick={reset}>Reset Onboarding</button>
      <button onClick={dismiss}>Dismiss</button>
      <button onClick={complete}>Complete</button>
    </div>
  );
}
```

### Restart Feature
Users can restart onboarding through the mobile sidebar:
- **Location**: Help → Restart Onboarding
- **Function**: Calls `reset()` to clear completion state and restart flow

## Edge Cases

### User Navigation
- If user navigates away during onboarding → fires `onboarding_dismiss` and stops
- If user closes popover → fires `onboarding_dismiss` and stops

### Plan-based Logic
- Non-premium users automatically skip the premium filter step
- Premium users see all three steps

### Error Handling
- API failures are logged to console but don't break the flow
- Graceful degradation if elements aren't found in DOM
- Mutation observers watch for dynamic content loading

### Accessibility
- Respects `prefers-reduced-motion` settings
- Keyboard accessible (Esc to dismiss)
- Proper ARIA labels and roles
- High contrast support through Tailwind classes

## Analytics Schema

### Event: `onboarding_start`
```typescript
{
  userId: string;
  userPlan: 'hobbyist' | 'standard' | 'premium';
}
```

### Event: `onboarding_step_complete`
```typescript
{
  step: 'inspiration' | 'premium-filter' | 'schedule-note';
  stepIndex: number;
  userId: string;
}
```

### Event: `onboarding_dismiss`
```typescript
{
  step: string;
  stepIndex: number;
  userId: string;
  reason: 'user_skip' | 'user_dismiss';
}
```

### Event: `onboarding_done`
```typescript
{
  userId: string;
  completedSteps: number;
}
```

## Mobile Responsiveness

- Works on mobile widths down to 360px
- Popover positioning adapts to screen size
- Modal dialogs are responsive
- Touch-friendly button sizes

## Browser Support

- Modern browsers supporting:
  - React 18+
  - CSS Grid and Flexbox
  - MutationObserver API
  - Intersection Observer API (for future enhancements)

## Configuration

### Step Configuration
Steps are configured in `OnboardingProvider.tsx`:

```typescript
const ONBOARDING_STEPS = [
  {
    id: 'inspiration',
    title: 'Browse Your Inspiration',
    description: '...',
    targetPath: '/home'
  },
  // ... other steps
];
```

### Styling
Uses Tailwind CSS classes with design system tokens:
- `bg-card` - Card backgrounds
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `border` - Border colors
- `shadow-lg` - Drop shadows

## Future Enhancements

### Potential Features
- Multi-step progress indicator
- Animated transitions between steps
- Video tutorials integration
- Interactive hotspots
- Contextual help tooltips
- A/B testing different onboarding flows

### Technical Improvements
- Intersection Observer for better element detection
- Preload next step components
- Lazy loading for performance
- Advanced analytics (time spent, scroll depth)
- Internationalization support

## Troubleshooting

### Common Issues

**Onboarding doesn't start:**
- Check if user has already completed it (`onboardingSeen === true`)
- Verify user is on `/home` page
- Check browser console for errors

**Steps are skipped:**
- Verify user plan matches step requirements
- Check element selectors are finding target elements
- Review step configuration

**Persistence not working:**
- Verify API endpoint is accessible
- Check network tab for failed requests
- Ensure user is authenticated

### Debug Mode
Add debug logging by modifying the provider:

```typescript
// Add to OnboardingProvider
useEffect(() => {
  console.log('Onboarding state:', { currentStep, isOpen, hasSeen });
}, [currentStep, isOpen, hasSeen]);
```

## Testing

### Manual Testing Checklist
- [ ] First-run flow progresses through all steps
- [ ] Premium gating logic works correctly
- [ ] Dismissal persistence works
- [ ] Mobile responsive design
- [ ] Keyboard navigation (Esc key)
- [ ] Reduced motion preferences respected
- [ ] Analytics events fire correctly
- [ ] Restart functionality works

### Testing Data Reset
To test the onboarding flow repeatedly:

1. Reset user settings in database:
```sql
UPDATE settings SET onboardingSeen = false WHERE userId = 'your-user-id';
```

2. Or use the restart feature in Help menu

### Browser Testing
Test in:
- Chrome (desktop/mobile)
- Safari (desktop/mobile) 
- Firefox (desktop)
- Edge (desktop) 