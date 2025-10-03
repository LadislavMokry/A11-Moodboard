# Moodeight - Development TODO

High-level tracking checklist for building the Moodeight moodboard application. Reference [PROMPT_PLAN.md](PROMPT_PLAN.md) for detailed implementation prompts.

---

## Phase 1: Foundation & Authentication ✅

- [x] **1.1** Supabase Client Setup & Environment Configuration
- [x] **1.2** Authentication Context & Provider
- [x] **1.3** Google OAuth Sign-In Flow
- [x] **1.4** Profile Creation & Management Schema

---

## Phase 2: Core Data Layer - Boards ✅

- [x] **2.1** Board Schemas & Types
- [x] **2.2** Image Schemas & Types
- [x] **2.3** Board Service Layer
- [x] **2.4** Board Query Hooks with TanStack Query

---

## Phase 3: UI Foundation & Theme System ✅

- [x] **3.1** Theme Context & System
- [x] **3.2** Layout Components & Header
- [x] **3.3** Routing Structure & Protected Routes

---

## Phase 4: Board Dashboard & Management ✅

- [x] **4.1** Empty States & Dashboard Shell
- [x] **4.2** Create Board Flow
- [x] **4.3** Board Card Component with Static Thumbnails
- [x] **4.4** Board Management Actions (Rename, Delete)

---

## Phase 5: Board Page & Image Grid ✅

- [x] **5.1** Board Page Layout & Image Grid (Static)
- [x] **5.2** Inline Board Rename & Description Edit
- [x] **5.3** Image Upload Flow (File & Drag-Drop)
- [x] **5.4** Paste-from-Clipboard Upload

---

## Phase 6: Drag-and-Drop Reordering ✅

- [x] **6.1** Install @dnd-kit & Basic Sortable Grid
- [x] **6.2** Custom Drag Overlay & Visual Polish

---

## Phase 7: Lightbox & Image Viewing

- [x] **7.1** Basic Lightbox with Navigation
- [x] **7.2** Lightbox with Zoom & Pan (@use-gesture/react)
- [x] **7.3** Desktop Thumbnail Strip & Mobile Gestures
- [ ] **7.4** Lightbox Caption Panel & Actions

---

## Phase 8: Image Management & Captions

- [ ] **8.1** Edit Caption Flow
- [ ] **8.2** Delete Image Flow
- [ ] **8.3** Bulk Selection & Bulk Delete

---

## Phase 9: Public Board Sharing

- [ ] **9.1** Public Board View (Read-Only)
- [ ] **9.2** Share Button & Copy Link
- [ ] **9.3** Regenerate Share Link

---

## Phase 10: Advanced Features

- [ ] **10.1** Animated Board Covers (2×2 Rotating)
- [ ] **10.2** Staging Area for Anonymous Users
- [ ] **10.3** Homepage Showcase Board Animation
- [ ] **10.4** Bulk Move/Copy Between Boards

---

## Phase 11: Supabase Edge Functions (Backend)

- [ ] **11.1** import_from_url Edge Function
- [ ] **11.2** delete_images Edge Function
- [ ] **11.3** delete_board Edge Function
- [ ] **11.4** transfer_images Edge Function

---

## Phase 12: Deployment & SSR (Cloudflare Pages Functions)

- [ ] **12.1** OG Meta Tags SSR
- [ ] **12.2** Dynamic OG Image Generation
- [ ] **12.3** Environment & Deployment Config

---

## Phase 13: Polish & Optimization

- [ ] **13.1** Loading States & Skeleton Screens
- [ ] **13.2** Error Handling & Retry Logic
- [ ] **13.3** Performance Optimization
- [ ] **13.4** Accessibility Audit & Fixes

---

## Phase 14: Final Testing & QA

- [ ] **14.1** Integration Testing
- [ ] **14.2** E2E Testing with Playwright
- [ ] **14.3** Manual QA Checklist

---

## Progress Summary

**Total Steps**: 52
**Completed**: 23
**In Progress**: 0
**Remaining**: 29

### By Phase:

- **Phase 1** (Foundation & Auth): 4/4 ✅ COMPLETE
- **Phase 2** (Data Layer): 4/4 ✅ COMPLETE
- **Phase 3** (UI Foundation): 3/3 ✅ COMPLETE
- **Phase 4** (Dashboard): 4/4 ✅ COMPLETE
- **Phase 5** (Board Page): 4/4 ✅ COMPLETE
- **Phase 6** (Drag-Drop): 2/2 ✅ COMPLETE
- **Phase 7** (Lightbox): 3/4
- **Phase 8** (Image Management): 0/3
- **Phase 9** (Sharing): 0/3
- **Phase 10** (Advanced): 0/4
- **Phase 11** (Edge Functions): 0/4
- **Phase 12** (Deployment): 0/3
- **Phase 13** (Polish): 0/4
- **Phase 14** (Testing): 0/3

---

## Notes

- Each step should include comprehensive tests before moving to the next
- Follow test-driven development (TDD) principles
- Ensure all code is properly typed with TypeScript strict mode
- Reference [PROMPT_PLAN.md](PROMPT_PLAN.md) for detailed implementation instructions
- Reference [Spec.md](Spec.md) for full feature specifications
- Reference [CLAUDE.md](CLAUDE.md) for project architecture and patterns
- Reference [bootstrap.sql](bootstrap.sql) for database schema

---

## Current Sprint

**Active Phase**: Phase 7 - Lightbox & Image Viewing
**Current Step**: 7.4 - Lightbox Caption Panel & Actions

**Phases 1-6 Complete! 🎉**

**Next Up**:

1. Lightbox Caption Panel & Actions
2. Image Management (Edit Caption, Delete)
3. Bulk Selection & Bulk Delete
4. Public Board Sharing

**Deployment Reminder**:

- [ ] When deploying to Cloudflare Pages, update Google OAuth authorized JavaScript origins to include production domain

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (unit, integration, E2E)
- [ ] Lighthouse score >90 in all categories
- [ ] Accessibility audit completed (zero violations)
- [ ] Performance optimization completed
- [ ] Manual QA completed across all browsers/devices
- [ ] Environment variables documented

### Supabase Setup

- [x] Database schema deployed (bootstrap.sql)
- [x] RLS policies enabled and tested
- [x] Storage buckets created (board-images, avatars)
- [x] Storage policies configured
- [ ] Edge Functions deployed and tested
- [x] Auth providers configured (Google OAuth)

### Cloudflare Pages Setup

- [ ] Repository connected
- [ ] Build settings configured
- [ ] Environment variables set (secrets)
- [ ] Pages Functions deployed
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active

### Post-Deployment

- [ ] Smoke tests on production
- [ ] OG meta tags verified (link previews)
- [ ] Dynamic OG images working
- [ ] Performance monitoring set up
- [ ] Error tracking configured (optional)
- [ ] Analytics configured (optional)

---

## Known Issues / Blockers

_Track any blockers or issues here as development progresses_

---

## Future Enhancements (Post-MVP)

- Keyboard-accessible image reordering
- Image editing/cropping in-app
- Collections/folders for organizing boards
- Collaboration features (shared boards)
- Activity feed/history
- Advanced search/filters
- Board templates
- Export to PDF/ZIP
- API for third-party integrations
- Mobile apps (iOS/Android)
