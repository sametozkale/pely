# Pely AI - Development Backlog

## 🎯 Current Status

### ✅ Completed Features
- [x] Bookmark CRUD operations (Create, Read, Update, Delete)
- [x] Bookmark types: LINK, IMAGE, NOTE
- [x] Archive/Unarchive bookmarks
- [x] Bulk selection and bulk delete
- [x] Tag creation and management
- [x] Tag filtering
- [x] Folder filtering (hierarchical)
- [x] Folder CRUD operations (Create, Read, Update, Delete, Move)
- [x] Folder hierarchy management with level calculation
- [x] Folder context menu (right-click)
- [x] Folder item counts display
- [x] Folder colors and visual indicators
- [x] Search functionality
- [x] Grid and List view modes
- [x] AI-powered URL analysis (Gemini integration)
- [x] Auto-tagging with AI suggestions
- [x] Firebase backend integration (Firestore)
- [x] Firebase Authentication (anonymous)
- [x] Responsive sidebar with animations
- [x] Bookmark card hover actions
- [x] Modal for bookmark creation/editing
- [x] Modal for folder creation/editing
- [x] Tag CRUD operations (Edit, Delete, Merge)
- [x] Tag editing modal with name and color picker
- [x] Tag context menu (right-click)
- [x] Tag merge functionality
- [x] Tag usage counts display
- [x] Bookmark tag cleanup on tag delete/merge
- [x] Sidebar collapse icon moved to sidebar header
- [x] Profile menu in sidebar with logout option
- [x] User menu in header with profile and logout
- [x] Improved sidebar button styling consistency

---

## 🚀 High Priority Tasks

### Backend & Infrastructure
- [ ] **Firebase Configuration Setup**
  - [x] Create Firebase project and configure environment variables
  - [ ] Set up Firebase Authentication (enable anonymous sign-in)
  - [ ] Deploy Firestore security rules
  - [ ] Deploy Cloud Functions (Gemini proxy)
  - [ ] Configure Firebase environment variables (GEMINI_API_KEY)
  - [ ] Set up Firebase emulators for local development

- [ ] **Real-time Data Sync**
  - [ ] Implement Firestore real-time listeners for bookmarks
  - [ ] Implement Firestore real-time listeners for folders
  - [ ] Implement Firestore real-time listeners for tags
  - [ ] Handle offline/online state
  - [ ] Add conflict resolution for concurrent edits

- [ ] **Error Handling & Loading States**
  - [ ] Add loading indicators for async operations
  - [ ] Implement error toast notifications
  - [ ] Add retry logic for failed operations
  - [ ] Handle network errors gracefully
  - [ ] Add error boundaries for React components

### Folder Management
- [x] **Folder CRUD Operations**
  - [x] Create new folders
  - [x] Edit folder names
  - [x] Delete folders (with confirmation)
  - [x] Move folders (change parent)
  - [ ] Reorder folders (drag & drop)

- [x] **Folder UI Improvements**
  - [x] Add folder creation button/modal
  - [x] Add folder context menu (right-click)
  - [x] Show folder item counts
  - [x] Add folder icons/colors

### Tag Management
- [x] **Tag CRUD Operations**
  - [x] Edit tag names and colors
  - [x] Delete tags (with confirmation and bookmark cleanup)
  - [x] Merge tags functionality

### User Authentication
- [x] **Authentication UI**
  - [x] Sign up/Sign in page
  - [x] Email/password authentication
  - [x] OAuth providers (Google, GitHub)
  - [x] User profile page
  - [x] Sign out functionality
  - [x] Account deletion
  - [x] Profile menu in sidebar
  - [x] User menu in header

- [ ] **User Management**
  - [ ] User settings/preferences

---

## 📋 Medium Priority Tasks

### UI/UX Improvements
- [x] **Sidebar Improvements**
  - [x] Collapse icon moved to sidebar header (aligned with logo)
  - [x] Profile menu below Archive button
  - [x] Consistent button styling (create folder matches collapse icon)
  - [x] Improved button alignment and padding (16px right padding)
  - [x] User menu in header with profile and logout options

- [ ] **Keyboard Shortcuts**
  - [ ] `Cmd/Ctrl + N` - New bookmark
  - [ ] `Cmd/Ctrl + F` - Focus search
  - [ ] `Cmd/Ctrl + K` - Quick actions
  - [ ] `Delete` - Delete selected
  - [ ] `Escape` - Close modals
  - [ ] Arrow keys for navigation

- [ ] **Drag & Drop**
  - [ ] Drag bookmarks to folders
  - [ ] Drag bookmarks to reorder
  - [ ] Drag folders to reorganize
  - [ ] Visual feedback during drag

- [ ] **Mobile Responsiveness**
  - [ ] Optimize sidebar for mobile (drawer)
  - [ ] Touch-friendly card interactions
  - [ ] Mobile-optimized modal
  - [ ] Swipe gestures for actions

- [ ] **Accessibility**
  - [ ] ARIA labels and roles
  - [ ] Keyboard navigation support
  - [ ] Screen reader optimization
  - [ ] Focus management
  - [ ] Color contrast improvements

### Features
- [ ] **Bookmark Enhancements**
  - [ ] Bookmark notes/annotations
  - [ ] Bookmark favorites/starred
  - [ ] Bookmark sharing (public links)
  - [ ] Bookmark collections
  - [ ] Duplicate detection
  - [ ] Bookmark expiration dates

- [ ] **Search Improvements**
  - [ ] Advanced search filters
  - [ ] Search history
  - [ ] Saved searches
  - [ ] Full-text search in descriptions
  - [ ] Search by date range

- [ ] **Bulk Operations**
  - [ ] Bulk archive/unarchive
  - [ ] Bulk tag assignment
  - [ ] Bulk folder assignment
  - [ ] Bulk export

- [ ] **Import/Export**
  - [ ] Export to JSON
  - [ ] Export to CSV
  - [ ] Export to HTML (bookmark file)
  - [ ] Import from browser bookmarks
  - [ ] Import from Pocket/Instapaper
  - [ ] Import from CSV/JSON

### AI Features
- [ ] **Enhanced AI Analysis**
  - [ ] Image analysis for IMAGE bookmarks
  - [ ] Note summarization
  - [ ] Content categorization
  - [ ] Related bookmark suggestions
  - [ ] Smart folder suggestions

- [ ] **AI Tagging Improvements**
  - [ ] Batch tag suggestions
  - [ ] Tag refinement based on usage
  - [ ] Auto-tag existing bookmarks

---

## 🔮 Low Priority / Future Enhancements

### Collaboration
- [ ] **Sharing & Collaboration**
  - [ ] Share folders with other users
  - [ ] Collaborative bookmarking
  - [ ] Comments on bookmarks
  - [ ] Team workspaces

### Analytics & Insights
- [ ] **Usage Analytics**
  - [ ] Most visited bookmarks
  - [ ] Tag usage statistics
  - [ ] Folder usage statistics
  - [ ] Time-based insights
  - [ ] Export analytics data

### Integrations
- [ ] **Third-party Integrations**
  - [ ] Browser extensions (Chrome, Firefox, Safari)
  - [ ] Mobile apps (iOS, Android)
  - [ ] API for developers
  - [ ] Webhooks
  - [ ] Zapier integration
  - [ ] Slack integration

### Advanced Features
- [ ] **Content Features**
  - [ ] Web page snapshots/archives
  - [ ] PDF upload and indexing
  - [ ] Video bookmark support
  - [ ] Audio bookmark support
  - [ ] Rich text notes editor

- [ ] **Organization**
  - [ ] Smart collections (auto-organized)
  - [ ] Bookmark templates
  - [ ] Custom fields for bookmarks
  - [ ] Bookmark relationships/links

- [ ] **Performance**
  - [ ] Virtual scrolling for large lists
  - [ ] Image lazy loading
  - [ ] Pagination for bookmarks
  - [ ] Caching strategies
  - [ ] Service worker for offline support

### Developer Experience
- [ ] **Testing**
  - [ ] Unit tests for services
  - [ ] Component tests
  - [ ] E2E tests
  - [ ] Integration tests

- [ ] **Documentation**
  - [ ] API documentation
  - [ ] Component documentation
  - [ ] Deployment guide
  - [ ] Contributing guide

- [ ] **CI/CD**
  - [ ] GitHub Actions workflow
  - [ ] Automated testing
  - [ ] Automated deployment
  - [ ] Code quality checks

---

## 🐛 Known Issues & Bugs

- [ ] Fix any console errors/warnings
- [ ] Handle edge cases in bookmark operations
- [x] Fix tag padding overflow issues
- [ ] Improve error messages for users
- [ ] Handle Firebase connection errors gracefully

---

## 📝 Notes

### Technical Debt
- Consider migrating from anonymous auth to proper user accounts
- Optimize Firestore queries (add indexes)
- Refactor state management (consider Zustand/Redux for complex state)
- Add TypeScript strict mode
- Improve code organization and modularity

### Design Considerations
- Consider dark mode support
- Improve color system consistency
- Add animation polish
- Improve loading states
- Better empty states

---

## 🎨 Design & Polish

- [ ] **Visual Improvements**
  - [ ] Improved empty states
  - [ ] Better loading skeletons
  - [ ] Smooth page transitions
  - [ ] Micro-interactions

- [ ] **Content**
  - [ ] Onboarding tutorial
  - [ ] Help documentation
  - [ ] Tooltips for features
  - [ ] Feature announcements

---

*Last updated: January 2025*
*This backlog is a living document and should be updated as features are completed or new requirements emerge.*

