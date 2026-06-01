# 📱 Mobile FormData & Edit/Delete Implementation Guide

## 📋 Files Updated/Created

### ✅ **NEW: upload.service.ts**
Location: `apps/mobile-app/src/shared/services/upload.service.ts`

**Purpose:** Unified FormData handler cho tất cả multipart requests
- `uploadRequest<T>(url, payload, files?)` - Generic upload function
- `deleteItem<T>(url)` - Generic delete function
- `editItem<T>(url, payload)` - Generic update function

---

## 🎯 **HOW TO USE**

### **1️⃣ Create Post with Files**

```typescript
import { usePostRealtime } from '@/shared/hooks/usePostRealtime';

function MyComponent() {
  const { createPost } = usePostRealtime(classId);

  const handleCreatePost = async () => {
    try {
      const post = await createPost({
        classId: 'class-123',
        content: 'Hello World!',
        type: 'DISCUSSION' // Optional, defaults to DISCUSSION
      }, [file1, file2]); // files are optional

      // Post created! State automatically updated
      console.log('Post created:', post.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
    }
  };
}
```

### **2️⃣ Create Comment with Reply (Nested)**

```typescript
import { useCommentRealtime } from '@/shared/hooks/useCommentRealtime';

function CommentSection({ postId }) {
  const { createComment } = useCommentRealtime(postId);

  // Create top-level comment
  const handleCreateComment = async () => {
    await createComment({
      postId,
      content: 'Great post!',
      replyToCommentId: null // No parent = top-level comment
    }, []);
  };

  // Create reply to existing comment
  const handleReply = async (parentCommentId: string) => {
    await createComment({
      postId,
      content: '@author Thanks!',
      replyToCommentId: parentCommentId // This makes it a reply!
    }, [file]);
  };
}
```

### **3️⃣ Delete Post (Auto from UI)**

```typescript
// In PostItem.tsx - ALREADY IMPLEMENTED
// User long-presses post → Alert menu appears → Select "Delete" → Done!
// Parent component receives onPostDeleted callback to update UI

// Or manual delete from hook:
const { deletePost } = usePostRealtime(classId);
await deletePost(postId);
```

### **4️⃣ Edit Post Content**

```typescript
// In PostItem.tsx - ALREADY IMPLEMENTED
// User long-presses post → Alert menu → Select "Edit" → Prompt to update → Done!

// Or manual edit:
const { editPost } = usePostRealtime(classId);
await editPost(postId, { content: 'Updated content' });
```

### **5️⃣ Delete/Edit Comments**

```typescript
// In CommentItem.tsx - ALREADY IMPLEMENTED
// User long-presses comment/reply → Alert menu → Select "Delete"/"Edit" → Done!

// Or manual operations:
const { deleteComment, editComment } = useCommentRealtime(postId);

// Delete
await deleteComment(commentId);

// Edit
await editComment(commentId, { content: 'Updated comment' });
```

---

## 🔧 **Component Integration**

### **PostItem.tsx - Already Updated with:**
- ✅ `onLongPress={handlePostLongPress}` on main container
- ✅ `Alert.alert()` menu showing Edit/Delete options
- ✅ Condition: Only shows menu if `user.id === post.authorId`
- ✅ Auto state update via `onPostDeleted` & `onPostEdited` callbacks

**Props Added:**
```typescript
interface PostItemProps {
  post: Post;
  onPressComment?: () => void;
  onMenuPress?: (postId: string) => void;
  onAttachmentPress?: (attachment: PostAttachment) => void;
  onPostDeleted?: (postId: string) => void;          // ← NEW
  onPostEdited?: (postId: string, newContent: string) => void; // ← NEW
}
```

**Parent Component Usage:**
```typescript
<PostItem
  post={post}
  onPostDeleted={(postId) => {
    // Remove from local state
    setPosts(prev => prev.filter(p => p.id !== postId));
  }}
  onPostEdited={(postId, newContent) => {
    // Update local state
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, content: newContent } : p)
    );
  }}
/>
```

### **CommentItem.tsx - Already Updated with:**
- ✅ `onLongPress={handleCommentLongPress}` on comment bubble
- ✅ `onLongPress={() => handleReplyLongPress(reply)}` on each reply bubble
- ✅ Alert menus for both comment & replies
- ✅ Condition checks applied to author only

**Props Added:**
```typescript
interface CommentItemProps {
  comment: Comment;
  replies?: Comment[];
  onReply: (commentId: string, authorName: string) => void;
  onLike: (commentId: string) => void;
  onCommentDeleted?: (commentId: string) => void;     // ← NEW
  onCommentEdited?: (commentId: string, newContent: string) => void;  // ← NEW
  onReplyDeleted?: (replyId: string) => void;         // ← NEW
  onReplyEdited?: (replyId: string, newContent: string) => void;      // ← NEW
}
```

---

## 📊 **Data Flow Comparison**

### **Before (Broken FormData):**
```
Mobile: formData.append('post', { string: JSON.stringify(...) })
         ↓
         FormData doesn't understand 'string' property
         ↓
Spring Boot receives: undefined
         ↓
500 ERROR
```

### **After (Fixed FormData):**
```
Mobile: JSON.stringify(payload) → uploadRequest()
         ↓
         uploadRequest creates FormData
         ↓
         formData.append('post', jsonString) ✅
         ↓
         Spring Boot @RequestPart("post") receives string ✅
         ↓
         Parses to PostRequest ✅
         ↓
         201 CREATED ✅
```

---

## 🎨 **UI/UX Flow**

### **Post Interactions:**
```
User long-presses post card
     ↓
Alert.alert("Post Options", "What would you like to do?")
     ↓ [Edit]
     Alert.prompt("Edit Post", "Update your post content:")
     ↓ (User types new content)
     ↓
     API: PUT /posts/{postId} with { content: newContent }
     ↓
     State updates → UI re-renders
     ↓ Success Alert
     ↓
     [Delete]
     Alert.alert("Delete Post", "Are you sure?")
     ↓ [Delete confirmed]
     ↓
     API: DELETE /posts/{postId}
     ↓
     Post removed from local state → UI updates
     ↓ Success Alert
```

### **Comment/Reply Interactions:**
```
User long-presses comment bubble OR reply bubble
     ↓
Same flow as Post (Alert menu → Edit/Delete → API → State update)
```

---

## ⚠️ **Important Notes**

### **FormData Handling (React Native Specific)**
```typescript
// ❌ WRONG - Blob API doesn't exist in React Native
const postBlob = new Blob([jsonString], { type: 'application/json' });
formData.append('post', postBlob);

// ✅ CORRECT - React Native FormData handles strings directly
formData.append('post', jsonString);
```

### **Content-Type Header (Let FormData Handle It)**
```typescript
// ❌ WRONG - Forces content-type, breaks boundary
await apiClient.post(url, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// ✅ CORRECT - FormData sets it automatically
await apiClient.post(url, formData, {
  // Leave headers empty or don't set Content-Type
});
```

### **Conditional Auth Check**
```typescript
// All edit/delete operations check:
const isAuthor = user?.id === post.authorId;

if (!isAuthor) {
  console.log('You are not the author');
  return; // Menu doesn't show
}

// This ensures users can only edit/delete their own posts & comments
```

---

## 🧪 **Testing Checklist**

- [ ] Create post without files → Success
- [ ] Create post with 1 file → Success  
- [ ] Create post with multiple files → Success
- [ ] Long-press own post → Menu shows Edit/Delete
- [ ] Long-press others' post → Menu doesn't show
- [ ] Click Edit → Prompt appears with current content → Update → State updates
- [ ] Click Delete → Confirmation → Delete → Post removed from list
- [ ] Create comment on post → Success
- [ ] Create reply to comment → Success (appears nested)
- [ ] Long-press own comment → Edit/Delete works
- [ ] Long-press own reply → Edit/Delete works
- [ ] Long-press others' comment → Menu doesn't show

---

## 📚 **File Reference**

| File | Purpose | Key Functions |
|------|---------|---|
| `upload.service.ts` | Generic FormData handler | `uploadRequest()`, `deleteItem()`, `editItem()` |
| `usePostRealtime.ts` | Post CRUD operations | `createPost()`, `editPost()`, `deletePost()` |
| `useCommentRealtime.ts` | Comment CRUD operations | `createComment()`, `editComment()`, `deleteComment()` |
| `PostItem.tsx` | Post display & interactions | `handlePostLongPress()`, `handleDeletePost()`, `handleEditPost()` |
| `CommentItem.tsx` | Comment display & interactions | `handleCommentLongPress()`, `handleReplyLongPress()`, etc. |

---

## 🎓 **Summary**

✅ **Unified FormData handler** - All multipart requests use same `uploadRequest()` function
✅ **Consistent delete/edit** - All items (posts, comments, replies) use same pattern
✅ **Authorization checks** - Users can only edit/delete their own content
✅ **Real-time state updates** - UI updates immediately without page reload
✅ **Error handling** - Alert messages on failure
✅ **React Native compatible** - No Blob API usage, proper FormData handling

**Everything is ready to use! 🚀**
