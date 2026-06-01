package fit.iuh.modules.auth.services.support.storage;

import org.springframework.web.multipart.MultipartFile;

public interface AvatarStorageService {
    String uploadAvatar(Long accountId, MultipartFile file, String oldAvatarUrl);

    void deleteAvatarByUrl(String avatarUrl);
}
