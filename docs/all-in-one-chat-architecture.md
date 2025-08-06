# All-in-One Chat Package Architecture

**Document**: Comprehensive roadmap for refactoring `@curia_/curia-chat-modal` into a complete chat solution
**Status**: Planning Phase  
**Target**: Version 3.0.0  
**Created**: January 2025

## 🎯 **Vision**

Transform `@curia_/curia-chat-modal` from a single modal component into a comprehensive chat solution that provides both modal and fullpage chat experiences with optimal architecture, zero layout conflicts, and maximum code reuse.

## 🚨 **Current Problems**

### **Architectural Issues**
- **Layout Conflicts**: MainLayoutWithSidebar adds padding (`p-4 md:p-6 lg:p-8`) to all pages, causing vertical scroll in fullpage chat
- **Component Mismatch**: Single ChatModal component serves two different use cases (modal overlay vs fullpage content)
- **CSS Inheritance**: Complex styling conflicts between curia app Tailwind and chat modal CSS modules
- **Conditional Complexity**: `displayMode` prop creates complex conditional rendering and styling

### **Maintenance Issues**
- **Mixed Responsibilities**: ChatModal handles both modal behavior and chat content rendering
- **Fragile Styling**: Conditional CSS classes based on display mode are error-prone
- **Limited Extensibility**: Hard to add new chat features without affecting modal behavior

## 🏗️ **Proposed Architecture**

### **Package Structure**
```
@curia_/curia-chat-modal/
├── src/
│   ├── components/
│   │   ├── core/
│   │   │   ├── ChatCore.tsx           # Shared iframe + chat logic
│   │   │   ├── ChatIframe.tsx         # IRC client iframe wrapper
│   │   │   └── LoadingStates.tsx      # Loading/error components
│   │   ├── modal/
│   │   │   ├── ChatModal.tsx          # Modal overlay component
│   │   │   └── ChatBackdrop.tsx       # Modal backdrop component
│   │   ├── page/
│   │   │   ├── ChatPage.tsx           # Fullpage chat component
│   │   │   └── ChatPageContent.tsx    # Page content wrapper
│   │   └── layout/
│   │       └── ChatLayout.tsx         # Clean layout for chat routes
│   ├── hooks/
│   │   ├── useChat.ts                 # Shared chat logic
│   │   ├── useChatModal.ts            # Modal-specific hooks
│   │   └── useChatPage.ts             # Page-specific hooks
│   ├── contexts/
│   │   └── ChatContext.tsx            # Existing context (preserved)
│   ├── utils/
│   │   ├── api-client.ts              # URL building, utilities
│   │   └── styling.ts                 # Shared styling utilities
│   ├── styles/
│   │   ├── modal.module.css           # Modal-specific styles
│   │   ├── page.module.css            # Page-specific styles
│   │   └── core.module.css            # Shared styles
│   ├── types/
│   │   └── index.ts                   # TypeScript interfaces
│   └── index.ts                       # Package exports
├── docs/
│   ├── all-in-one-chat-architecture.md
│   ├── migration-guide.md
│   └── api-reference.md
└── package.json
```

### **Component Hierarchy**
```
ChatModal (Modal Usage)
├── ChatBackdrop (backdrop, click-to-close)
└── ChatCore (shared logic)
    └── ChatIframe (IRC client)

ChatPage (Fullpage Usage)  
└── ChatPageContent (page wrapper)
    └── ChatCore (shared logic)
        └── ChatIframe (IRC client)

ChatLayout (Route Layout)
└── Clean container (no padding, full viewport)
```

## 📦 **Component Specifications**

### **1. ChatCore (Shared Foundation)**
**Purpose**: Contains all shared chat logic, IRC client iframe, session management  
**Location**: `src/components/core/ChatCore.tsx`

```tsx
interface ChatCoreProps {
  ircCredentials: IrcCredentials;
  channel: ApiChatChannel;
  chatBaseUrl?: string;
  theme?: 'light' | 'dark';
  mode?: 'single' | 'normal';
  className?: string;           // Allow parent styling
  onClose: () => void;
  onLoad?: () => void;         // Notify parent of load state
  onError?: (error: string) => void;
}

export function ChatCore({ 
  ircCredentials, 
  channel, 
  chatBaseUrl, 
  theme, 
  mode, 
  className,
  onClose,
  onLoad,
  onError 
}: ChatCoreProps) {
  // Shared logic: URL building, loading states, error handling
  // Renders ChatIframe with consistent behavior
  // No modal-specific or page-specific styling
}
```

### **2. ChatModal (Modal Experience)**
**Purpose**: Modal overlay with backdrop, shadows, responsive sizing  
**Location**: `src/components/modal/ChatModal.tsx`

```tsx
interface ChatModalProps {
  ircCredentials: IrcCredentials;
  channel: ApiChatChannel;
  chatBaseUrl?: string;
  theme?: 'light' | 'dark';
  mode?: 'single' | 'normal';
  onClose: () => void;
}

export function ChatModal(props: ChatModalProps) {
  const isDesktop = useIsDesktop();
  
  return createPortal(
    <>
      <ChatBackdrop onClose={props.onClose} />
      <div className={cn(
        "fixed z-50 bg-background shadow-2xl border flex flex-col",
        styles.modalResponsive,
        isDesktop ? "rounded-r-2xl animate-in slide-in-from-left-5" : "animate-in slide-in-from-bottom-4"
      )}>
        <ChatCore 
          {...props}
          className="w-full h-full"
        />
      </div>
    </>,
    document.body
  );
}
```

### **3. ChatPage (Fullpage Experience)**
**Purpose**: Full viewport chat, no modal styling, optimized for page usage  
**Location**: `src/components/page/ChatPage.tsx`

```tsx
interface ChatPageProps {
  ircCredentials: IrcCredentials;
  channel: ApiChatChannel;
  chatBaseUrl?: string;
  theme?: 'light' | 'dark';
  mode?: 'single' | 'normal';
  onClose: () => void;
}

export function ChatPage(props: ChatPageProps) {
  return (
    <ChatPageContent>
      <ChatCore 
        {...props}
        className="w-full h-full border-0 shadow-none"
      />
    </ChatPageContent>
  );
}
```

### **4. ChatLayout (Route Layout)**
**Purpose**: Clean layout for chat routes, bypasses MainLayoutWithSidebar  
**Location**: `src/components/layout/ChatLayout.tsx`

```tsx
interface ChatLayoutProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

export function ChatLayout({ children, theme }: ChatLayoutProps) {
  return (
    <div className={cn(
      "h-screen w-full overflow-hidden",
      theme === 'dark' ? 'dark' : ''
    )}>
      {children}
    </div>
  );
}
```

## 🔄 **Migration Strategy**

### **Phase 1: Foundation (Week 1)**
**Goal**: Create shared components without breaking existing functionality

#### **Tasks:**
1. **Extract ChatCore** from existing ChatModal
   - Move iframe logic, URL building, loading states
   - Keep all existing functionality intact
   - Add `className` prop for parent styling

2. **Create ChatIframe** component
   - Extract iframe-specific logic from ChatCore
   - Handle loading states, error states, onLoad/onError callbacks
   - Optimize for reuse across modal/page contexts

3. **Create LoadingStates** components
   - Extract loading/error UI from existing ChatModal
   - Make reusable across modal and page contexts
   - Maintain existing visual design

#### **Validation:**
- Existing ChatModal continues to work unchanged
- All tests pass
- No visual regressions in modal usage

### **Phase 2: Modal Refactor (Week 1)**
**Goal**: Refactor ChatModal to use ChatCore foundation

#### **Tasks:**
1. **Create ChatBackdrop** component
   - Extract backdrop logic from ChatModal
   - Handle click-to-close, touch/wheel prevention
   - Maintain existing animations and styling

2. **Refactor ChatModal** to use ChatCore
   - Replace inline logic with ChatCore component
   - Maintain all existing props and behavior
   - Preserve responsive sizing and animations

3. **Update modal styles**
   - Move modal-specific styles to `modal.module.css`
   - Clean up conditional styling complexity
   - Maintain visual consistency

#### **Validation:**
- ChatModal behavior identical to before refactor
- All modal features work (ESC, backdrop click, animations)
- Responsive behavior unchanged

### **Phase 3: Page Components (Week 2)**
**Goal**: Create fullpage chat components

#### **Tasks:**
1. **Create ChatPageContent** wrapper
   - Simple container optimized for fullpage usage
   - Handle fullpage-specific styling and layout
   - No shadows, borders, or modal-specific styling

2. **Create ChatPage** component
   - Use ChatCore for chat functionality
   - Optimize for fullpage viewport usage
   - Handle fullpage-specific behaviors (navigation, etc.)

3. **Create page styles**
   - New `page.module.css` for fullpage-specific styling
   - Ensure no conflicts with modal styles
   - Optimize for performance and clean rendering

#### **Validation:**
- ChatPage renders cleanly in fullpage context
- No layout conflicts or overflow issues
- Performance optimized for fullpage usage

### **Phase 4: Layout Component (Week 2)**
**Goal**: Create ChatLayout for clean route layouts

#### **Tasks:**
1. **Create ChatLayout** component
   - Clean, padding-free layout for chat routes
   - Handle viewport sizing and overflow
   - Theme support for consistent styling

2. **Add layout utilities**
   - Helper functions for layout detection
   - Theme integration utilities
   - Responsive behavior helpers

#### **Validation:**
- ChatLayout provides clean fullpage container
- No padding or layout conflicts
- Theme integration works correctly

### **Phase 5: Curia Integration (Week 3)**
**Goal**: Integrate new components into Curia app

#### **Tasks:**
1. **Create `/chat/layout.tsx`** in Curia app
   ```tsx
   import { ChatLayout } from '@curia_/curia-chat-modal';
   
   export default function Layout({ children }) {
     return <ChatLayout>{children}</ChatLayout>;
   }
   ```

2. **Update `/chat/[chatId]/page.tsx`** in Curia app
   ```tsx
   import { ChatPage } from '@curia_/curia-chat-modal';
   
   export default function Page({ params }) {
     return <ChatPage chatId={params.chatId} />;
   }
   ```

3. **Preserve existing modal usage**
   - ChatModalWrapper continues using ChatModal
   - No changes to existing modal functionality
   - Maintain backward compatibility

#### **Validation:**
- Fullpage chat works without layout conflicts
- Modal chat continues working unchanged
- No regressions in existing functionality

### **Phase 6: Optimization (Week 3)**
**Goal**: Optimize bundle size, performance, and developer experience

#### **Tasks:**
1. **Optimize shared code**
   - Extract common hooks and utilities
   - Minimize code duplication
   - Optimize bundle size with tree shaking

2. **Improve TypeScript**
   - Add comprehensive type definitions
   - Improve IntelliSense experience
   - Add JSDoc documentation

3. **Update package exports**
   - Clean package.json exports
   - Optimize for tree shaking
   - Add proper entry points

#### **Validation:**
- Bundle size optimized
- TypeScript experience improved
- All exports work correctly

### **Phase 7: Documentation & Testing (Week 4)**
**Goal**: Complete documentation and comprehensive testing

#### **Tasks:**
1. **Create migration guide**
   - Document breaking changes (if any)
   - Provide upgrade instructions
   - Include code examples

2. **Update API documentation**
   - Document all new components
   - Provide usage examples
   - Include best practices

3. **Add comprehensive tests**
   - Unit tests for all components
   - Integration tests for modal/page usage
   - Visual regression tests

#### **Validation:**
- All components fully documented
- Test coverage meets standards
- Migration guide is comprehensive

## 📋 **API Design**

### **Package Exports**
```tsx
// Main components
export { ChatModal } from './components/modal/ChatModal';
export { ChatPage } from './components/page/ChatPage';  
export { ChatLayout } from './components/layout/ChatLayout';

// Core components (for advanced usage)
export { ChatCore } from './components/core/ChatCore';
export { ChatIframe } from './components/core/ChatIframe';

// Hooks
export { useChatModal } from './hooks/useChatModal';
export { useChatPage } from './hooks/useChatPage';

// Context (existing)
export { ChatProvider, useChatModal as useChatContext } from './contexts/ChatContext';

// Types
export type { ChatModalProps, ChatPageProps, ChatLayoutProps } from './types';
```

### **Usage Examples**

#### **Modal Usage (Existing)**
```tsx
import { ChatModal } from '@curia_/curia-chat-modal';

<ChatModal
  ircCredentials={sessionData.ircCredentials}
  channel={targetChannel}
  theme={theme}
  onClose={closeChat}
/>
```

#### **Fullpage Usage (New)**
```tsx
import { ChatPage, ChatLayout } from '@curia_/curia-chat-modal';

// In layout.tsx
export default function Layout({ children }) {
  return <ChatLayout>{children}</ChatLayout>;
}

// In page.tsx  
export default function Page() {
  return (
    <ChatPage
      ircCredentials={sessionData.ircCredentials}
      channel={targetChannel}
      theme={theme}
      onClose={() => router.back()}
    />
  );
}
```

## 🎯 **Success Metrics**

### **Technical Metrics**
- **Zero Layout Conflicts**: Fullpage chat has no vertical scroll or overflow
- **Bundle Size**: Overall package size increase <20% despite new components
- **Performance**: No performance regression in modal or fullpage usage
- **Type Safety**: 100% TypeScript coverage with proper exports

### **Developer Experience**
- **API Simplicity**: Clear, intuitive component APIs
- **Documentation**: Comprehensive docs with examples
- **Migration**: Smooth upgrade path with minimal breaking changes
- **Maintainability**: Clean separation of concerns, easy to extend

### **User Experience**
- **Modal**: Identical behavior to current implementation
- **Fullpage**: Clean, full-viewport chat without layout issues
- **Consistency**: Consistent chat experience across modal/fullpage
- **Performance**: Fast loading and smooth interactions

## 🚀 **Version Planning**

### **Version 3.0.0** (Target Release)
- **Breaking Changes**: Minimal, mostly internal refactoring
- **New Features**: ChatPage, ChatLayout components
- **Migration**: Automated where possible, clear guide provided
- **Support**: Maintain 2.x for transition period

### **Post-3.0 Roadmap**
- **3.1.0**: Advanced chat features (notifications, presence)
- **3.2.0**: Customization APIs (themes, layouts)
- **3.3.0**: Performance optimizations (lazy loading, caching)

## 📚 **Documentation Plan**

### **User Documentation**
- **README.md**: Updated with new component usage
- **Migration Guide**: Step-by-step upgrade instructions
- **API Reference**: Comprehensive component/hook documentation
- **Examples**: Real-world usage patterns

### **Developer Documentation**
- **Architecture Guide**: Component relationships and data flow
- **Contributing Guide**: Development setup and guidelines
- **Testing Guide**: How to test components and integrations
- **Release Process**: Versioning and deployment procedures

## 🔍 **Risk Assessment**

### **High Risk**
- **Layout Integration**: Ensuring ChatLayout works across different Curia app contexts
- **Bundle Size**: Managing size increase with new components
- **Breaking Changes**: Minimizing impact on existing implementations

### **Medium Risk**
- **CSS Conflicts**: Managing styles across modal/page contexts
- **TypeScript**: Maintaining type safety across refactored components
- **Performance**: Ensuring no regressions in chat loading/interaction

### **Low Risk**
- **Component Extraction**: ChatCore extraction is straightforward
- **Documentation**: Standard documentation practices
- **Testing**: Existing test patterns can be extended

## 🎯 **Next Steps Recommendation**

### **Immediate Actions (This Week)**
1. **Validate Architecture**: Review this document and confirm approach
2. **Set Up Development**: Create feature branch and development environment
3. **Start Phase 1**: Begin ChatCore extraction

### **Short Term (Next 2 Weeks)**
1. **Complete Foundation**: Finish Phases 1-2 (ChatCore, ChatModal refactor)
2. **Build Page Components**: Complete Phases 3-4 (ChatPage, ChatLayout)
3. **Integration Testing**: Verify components work in isolation

### **Medium Term (Next Month)**
1. **Curia Integration**: Complete Phase 5 (integrate into Curia app)
2. **Optimization**: Complete Phase 6 (performance, bundle size)
3. **Documentation**: Complete Phase 7 (docs, tests, migration guide)

This architecture provides a clean, maintainable solution that solves the current layout conflicts while setting up the chat package for future extensibility and growth.