# Error Handling System

## Overview
Complete Arabic error reporting system similar to ChatGPT with beautiful UI and comprehensive coverage.

## Error Types

### 1. **Not Found (404)**
```
المحادثة غير موجودة
عذراً، لم نتمكن من العثور على هذه المحادثة. ربما تم حذفها أو أن الرابط غير صحيح.
```
**When:** Chat ID doesn't exist or was deleted

### 2. **Network Error**
```
لا يوجد اتصال بالإنترنت
تحقق من اتصالك بالإنترنت وحاول مرة أخرى.
```
**When:** Failed to fetch, network issues, offline

### 3. **Server Error (500/502/503)**
```
حدث خطأ في الخادم
نعتذر، حدثت مشكلة في الخادم. يرجى المحاولة مرة أخرى بعد قليل.
```
**When:** Backend server errors

### 4. **Authentication Error (401)**
```
خطأ في المصادقة
انتهت جلستك أو لا تملك صلاحية الوصول. يرجى تسجيل الدخول مرة أخرى.
```
**When:** Invalid/expired token, unauthorized access

### 5. **Generic Error**
```
حدث خطأ ما
عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
```
**When:** Unknown or unhandled errors

## Features

### ✨ Full-Screen Error States
- **Professional design** - Clean, centered layout with icons
- **Animated** - Smooth entrance animations using Framer Motion
- **Actionable** - "Retry" and "Go Home" buttons
- **Accessible** - Touch-friendly 44px minimum tap targets
- **RTL Support** - Fully supports Arabic right-to-left text

### 🔔 Toast Notifications
Non-critical errors show as toast notifications:
- Chat loading errors
- Settings errors
- Create chat failures
- Network warnings

### 🛡️ Error Boundary
Catches React errors and shows fallback UI:
- Prevents white screen of death
- Logs errors to console
- Provides recovery options

## Files Structure

### Frontend
```
src/
├── components/
│   ├── ui/
│   │   └── error-state.tsx      # Error UI component
│   └── ErrorBoundary.tsx        # React error boundary
└── pages/
    └── Chat.tsx                 # Error handling implementation
```

### Backend
```
backend/
├── error_messages.py            # Centralized Arabic error messages
└── main.py                      # Updated with error messages
```

## Usage Examples

### In Components
```tsx
import ErrorState from "@/components/ui/error-state";

// Show error state
{error && (
  <ErrorState 
    type="not-found"
    onRetry={() => refetch()}
    onGoHome={() => navigate('/chat')}
  />
)}
```

### Custom Messages
```tsx
<ErrorState 
  type="generic"
  title="خطأ مخصص"
  message="رسالة خطأ مخصصة هنا"
  onRetry={handleRetry}
/>
```

### Toast Notifications
```tsx
import { toast } from "sonner";

// Error toast
toast.error("فشل تحميل البيانات");

// Success toast
toast.success("تم الحفظ بنجاح");
```

## Error Handling Pattern

```tsx
try {
  const data = await fetchData();
  setData(data);
} catch (e: any) {
  // Categorize error
  if (e.message?.includes('404')) {
    setError({ type: "not-found" });
    toast.error("البيانات غير موجودة");
  } else if (e.message?.includes('network')) {
    setError({ type: "network" });
  } else if (e.message?.includes('401')) {
    setError({ type: "auth" });
  } else {
    setError({ type: "generic" });
  }
}
```

## Backend Error Messages

Centralized in `error_messages.py`:

```python
from error_messages import get_error_message

# Use consistent Arabic messages
raise HTTPException(
    status_code=404,
    detail=get_error_message("CHAT_NOT_FOUND")
)
```

Available keys:
- `AUTH_INVALID_TOKEN`
- `CHAT_NOT_FOUND`
- `MESSAGE_SEND_FAILED`
- `SERVER_ERROR`
- `NETWORK_ERROR`
- And many more...

## Testing Error States

### Simulate Errors
```tsx
// Test 404
setError({ type: "not-found" });

// Test network error
setError({ type: "network" });

// Test auth error
setError({ type: "auth" });
```

### Backend Testing
```bash
# Stop backend to test network errors
# Invalid token for auth errors
# Non-existent chat ID for 404 errors
```

## Best Practices

1. **Always show user-friendly messages** - Never show raw error text
2. **Categorize errors properly** - Use correct error type
3. **Provide recovery options** - Retry button when possible
4. **Log errors** - Keep console.error for debugging
5. **Use toast for non-critical** - Reserve full-screen for blocking errors
6. **Test all error paths** - Ensure every API call has error handling

## Screenshots

Error states appear as:
- 📱 Mobile-friendly
- 🎨 Theme-aware (dark/light mode)
- 🌍 Fully Arabic
- ✨ Smooth animations
- 🎯 Clear call-to-action buttons
