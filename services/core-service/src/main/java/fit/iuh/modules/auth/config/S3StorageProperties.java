package fit.iuh.modules.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage.s3")
public record S3StorageProperties(
        String region,
        String bucket,
        String accessKey,
        String secretKey,
        String publicBaseUrl,
        String avatarFolder,
        long maxFileSizeBytes
) {
}
