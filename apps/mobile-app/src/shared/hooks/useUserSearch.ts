import { useState, useEffect } from 'react';
// Import đúng đường dẫn API của ông
import { searchUsers } from '../../modules/friends/friends.api'; 

export const useUserSearch = (identity: any, isVisible: boolean = true, searchTrigger: number = 0) => {
  const [keyword, setKeyword] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isVisible || !identity) return;

    // Kỹ thuật Debounce 500ms
    const delayDebounceFn = setTimeout(() => {
      setIsLoading(true);
      // Gọi API với keyword (rỗng thì lấy gợi ý, có chữ thì tìm kiếm)
      searchUsers(identity, keyword.trim())
        .then((res: any) => setUsers(res || []))
        .catch(err => console.error("❌ Lỗi search hook:", err.message))
        .finally(() => setIsLoading(false));
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [keyword, isVisible, identity, searchTrigger]);

  const resetSearch = () => {
    setKeyword('');
    setUsers([]);
  };

  return { keyword, setKeyword, users, isLoading, resetSearch };
};