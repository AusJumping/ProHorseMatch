# ProHorseMatch Installation Guide - Design Guidelines

## Design Approach

**Selected Approach:** Hybrid System (Apple HIG clarity + Premium Editorial)
Drawing inspiration from Apple's instructional design for trust and clarity, combined with premium editorial layouts like Notion's documentation style. The design prioritizes scannable, step-by-step content with visual hierarchy that guides users through technical processes while maintaining the brand's premium equestrian positioning.

**Core Principles:**
- Progressive disclosure: Information revealed in digestible, sequential chunks
- Visual wayfinding: Clear visual cues for navigation through multi-step processes
- Trust through clarity: Professional layout that reduces friction in technical setup
- Premium accessibility: Sophisticated yet highly functional

---

## Typography Hierarchy

**Font Selection:** Google Fonts CDN
- Primary: 'Playfair Display' (serif) - Premium editorial headlines
- Secondary: 'Inter' (sans-serif) - Technical instructions and body content

**Type Scale:**
- Hero Headline: Playfair Display, 56px/60px, weight 600, letter-spacing -0.02em
- Section Titles: Playfair Display, 36px/42px, weight 600
- Step Headers: Inter, 24px/32px, weight 600
- Body Instructions: Inter, 16px/26px, weight 400
- Small Print/Notes: Inter, 14px/22px, weight 400
- Button Text: Inter, 16px, weight 600, letter-spacing 0.02em

---

## Layout System

**Spacing Units:** Tailwind primitives - 4, 6, 8, 12, 16, 24
- Component gaps: space-y-4, space-y-6
- Section padding: py-16, py-24 (desktop), py-12 (mobile)
- Card padding: p-6, p-8
- Grid gaps: gap-6, gap-8

**Container Strategy:**
- Overall max-width: max-w-5xl (reading-optimized for instructions)
- Two-column sections: max-w-6xl for side-by-side layouts
- Full-width sections: w-full with inner max-w-5xl

---

## Component Library

### Hero Section (40vh - 50vh height)
- Sophisticated equestrian imagery showing rider with device/technology integration
- Centered content overlay with subtle backdrop blur
- Headline + supporting subheadline
- Quick navigation pills to jump to iOS/Android/Desktop sections
- Breadcrumb navigation: Home > Help Center > Installation Guide

### Platform Selection Cards (3-column grid on desktop, stack mobile)
- iOS, Android, Desktop/Web cards
- Large platform icons (64px) centered at top
- Platform name
- Brief description (1-2 lines)
- "View Instructions" button
- Hover state: subtle lift effect (translate-y-1)
- Equal height cards with border treatment

### Step-by-Step Instruction Blocks
**Layout Pattern:**
- Two-column layout on desktop (instruction text left, visual reference right)
- Stack on mobile (text first, visual below)

**Per Step Component:**
- Large step number indicator (circular badge, 48px diameter)
- Step title (Inter 24px weight 600)
- Detailed instruction paragraph
- Supporting visual (screenshot mockup or icon illustration - 400px x auto)
- Optional "Pro Tip" callout box
- Optional troubleshooting dropdown accordion

### Visual Reference Mockups
**Device Frame Strategy:**
- iOS: iPhone frame mockup (320px width) with rounded corners, realistic bezel
- Android: Generic device frame (320px width) 
- Desktop: Browser window chrome (600px width) with address bar
- All frames show actual interface screenshots with clear annotations

### Callout Boxes (3 variants)
**Info Box:** 
- Icon: Information circle (Heroicons)
- Padding: p-6
- Rounded corners: rounded-lg
- Usage: Additional context

**Warning Box:**
- Icon: Exclamation triangle
- Styling: Slightly bolder border
- Usage: Important prerequisites

**Success Box:**
- Icon: Check circle
- Usage: Confirmation steps, completion messages

### Navigation Elements

**Sticky Progress Sidebar (Desktop only, right-aligned):**
- Fixed position during scroll
- Shows 4-6 major section anchors
- Active section indicator
- Smooth scroll to anchor on click

**Mobile: Floating Quick Menu Button:**
- Fixed bottom-right position
- Expands to show section jumps
- Hamburger icon transforming to X

### FAQ Accordion Section
- Question headers: Inter 18px weight 600
- Expandable panels with smooth height transition
- Plus/minus icon toggle
- 5-8 common questions
- Linked references to specific steps when relevant

### Footer Support Resources
**Multi-column layout (3 columns desktop, stack mobile):**
- Column 1: Video tutorial links
- Column 2: Contact support options (email, chat)
- Column 3: Related help articles

---

## Animations

**Minimal, Purposeful Only:**
- Smooth scroll to anchor sections (ease-in-out, 800ms)
- Step completion checkmarks (scale + fade in)
- Accordion expand/collapse (height transition, 300ms)
- NO scroll-triggered animations
- NO parallax effects
- NO hover animations beyond subtle transforms

---

## Accessibility Implementation

- All step numbers have semantic HTML (ordered lists with custom styling)
- Device mockup images include descriptive alt text
- Color-independent visual cues (icons + text, not just color)
- Keyboard navigation for all interactive elements
- Skip-to-content link
- ARIA labels for accordion states
- Focus visible indicators matching brand treatment
- Minimum 4.5:1 contrast ratios (enforced in development)

---

## Images Section

**Hero Image:**
- Full-width background image (1920x800px suggested)
- Subject: Professional equestrian rider in elegant attire, holding smartphone or tablet in stable/arena setting
- Composition: Subject positioned left or right third for text overlay space
- Style: Premium photography, natural lighting, shallow depth of field
- Treatment: Subtle gradient overlay for text legibility

**Device Screenshots (12-15 total needed):**
- iOS installation: App Store page, Add to Home Screen steps (4 images)
- Android installation: Chrome menu, Install prompt, Home screen result (4 images)
- Desktop PWA: Browser install prompt, taskbar icon (2 images)
- Push notification: Permission prompt, sample notification (3 images)
- All screenshots: Actual ProHorseMatch interface, clear UI elements, realistic device context

**Icon Illustrations (if screenshots unavailable):**
- Simplified device outline illustrations with key UI elements highlighted
- Clean line art style matching premium aesthetic
- Annotations with arrows pointing to specific interface elements

**Supporting Imagery:**
- Small decorative element between sections: Minimalist horseshoe or equestrian emblem (80px, subtle)
- Success state illustration: Checkmark with horse silhouette (120px)

---

## Icon Library

**Heroicons via CDN** (outline style, 24px default)
- Smartphone (device-mobile-icon)
- Desktop computer (computer-desktop-icon)
- Bell (bell-icon) - notifications
- Check circle (check-circle-icon) - success
- Information circle (information-circle-icon) - tips
- Exclamation triangle (exclamation-triangle-icon) - warnings
- Arrow down (arrow-down-tray-icon) - download
- Question mark circle (question-mark-circle-icon) - FAQ