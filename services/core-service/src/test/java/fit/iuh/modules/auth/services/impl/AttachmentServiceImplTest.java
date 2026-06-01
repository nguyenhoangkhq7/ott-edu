package fit.iuh.modules.auth.services.impl;

import fit.iuh.models.Attachment;
import fit.iuh.models.AttachmentTargetType;
import fit.iuh.models.Profile;
import fit.iuh.models.Account;
import fit.iuh.modules.auth.repositories.AttachmentRepository;
import fit.iuh.modules.auth.repositories.ProfileRepository;
import fit.iuh.modules.auth.services.SocketEventService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttachmentServiceImplTest {

    @Mock
    private AttachmentRepository attachmentRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private SocketEventService socketEventService;

    @Mock
    private S3Client s3Client;

    @InjectMocks
    private AttachmentServiceImpl attachmentService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(attachmentService, "bucketName", "test-bucket");
        ReflectionTestUtils.setField(attachmentService, "region", "us-east-1");
    }

    @Test
    void uploadToClass_Success() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("test-file.pdf");
        when(file.getContentType()).thenReturn("application/pdf");
        when(file.getSize()).thenReturn(100L);
        InputStream inputStream = new java.io.ByteArrayInputStream("test content".getBytes());
        when(file.getInputStream()).thenReturn(inputStream);

        Attachment savedAttachment = Attachment.builder()
                .id("att-123")
                .fileName("test-file.pdf")
                .fileType("application/pdf")
                .size(100L)
                .fileUrl("https://test-bucket.s3.us-east-1.amazonaws.com/classes/class-123/random-uuid_test-file.pdf")
                .classId("class-123")
                .userId("user@example.com")
                .targetType(AttachmentTargetType.CLASS_FOLDER)
                .build();

        Account account = Account.builder().id(1L).email("user@example.com").build();
        Profile profile = Profile.builder()
                .accountId(1L)
                .firstName("Hau")
                .lastName("Tran")
                .account(account)
                .build();

        when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());
        when(attachmentRepository.save(any(Attachment.class))).thenReturn(savedAttachment);
        when(profileRepository.findByAccount_Email("user@example.com")).thenReturn(Optional.of(profile));

        Attachment result = attachmentService.uploadToClass(file, "class-123", "user@example.com");

        System.out.println("✅ [uploadToClass_Success] - Expected result: not null | Actual result: " + result);
        assertNotNull(result);
        System.out.println("✅ [uploadToClass_Success] - Expected ID: att-123 | Actual ID: " + result.getId());
        assertEquals("att-123", result.getId());
        verify(s3Client).putObject(any(PutObjectRequest.class), any(RequestBody.class));
        verify(attachmentRepository).save(any(Attachment.class));
        verify(socketEventService).emitFileUploaded(eq("class-123"), anyMap());
    }

    @Test
    void uploadToClass_ThrowsRuntimeException_WhenIOExceptionOccurs() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("test-file.pdf");
        when(file.getInputStream()).thenThrow(new IOException("Read error"));

        System.out.println("❌ [uploadToClass_ThrowsRuntimeException_WhenIOExceptionOccurs] - Expected Exception: " + RuntimeException.class.getName());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            attachmentService.uploadToClass(file, "class-123", "user@example.com");
        });

        System.out.println("❌ [uploadToClass_ThrowsRuntimeException_WhenIOExceptionOccurs] - Expected Exception Message to contain: Lỗi upload file tài liệu lên S3: Read error | Actual Message: " + ex.getMessage());
        assertTrue(ex.getMessage().contains("Lỗi upload file tài liệu lên S3: Read error"));
        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
        verify(attachmentRepository, never()).save(any());
    }

    @Test
    void getFilesByClass_Success() {
        Attachment att = Attachment.builder()
                .id("att-1")
                .userId("user@example.com")
                .classId("class-123")
                .targetType(AttachmentTargetType.CLASS_FOLDER)
                .build();
        List<Attachment> list = new ArrayList<>();
        list.add(att);

        Account account = Account.builder().id(1L).email("user@example.com").build();
        Profile profile = Profile.builder()
                .accountId(1L)
                .firstName("Hau")
                .lastName("Tran")
                .account(account)
                .build();

        when(attachmentRepository.findByClassIdAndTargetType("class-123", AttachmentTargetType.CLASS_FOLDER))
                .thenReturn(list);
        when(profileRepository.findByAccount_EmailIn(anyList()))
                .thenReturn(List.of(profile));

        List<Attachment> result = attachmentService.getFilesByClass("class-123");

        System.out.println("✅ [getFilesByClass_Success] - Expected result size: 1 | Actual size: " + result.size());
        assertEquals(1, result.size());
        System.out.println("✅ [getFilesByClass_Success] - Expected author: Tran Hau | Actual author: " + result.get(0).getAuthorName());
        assertEquals("Tran Hau", result.get(0).getAuthorName());
    }

    @Test
    void getFilesByClass_Empty() {
        when(attachmentRepository.findByClassIdAndTargetType("class-123", AttachmentTargetType.CLASS_FOLDER))
                .thenReturn(Collections.emptyList());

        List<Attachment> result = attachmentService.getFilesByClass("class-123");

        System.out.println("✅ [getFilesByClass_Empty] - Expected result to be empty | Actual size: " + result.size());
        assertTrue(result.isEmpty());
        verify(profileRepository, never()).findByAccount_EmailIn(any());
    }

    @Test
    void deleteAttachment_Success() {
        Attachment attachment = Attachment.builder()
                .id("att-1")
                .classId("class-123")
                .fileUrl("https://test-bucket.s3.us-east-1.amazonaws.com/classes/class-123/file.pdf")
                .build();

        when(attachmentRepository.findById("att-1")).thenReturn(Optional.of(attachment));
        when(s3Client.deleteObject(any(DeleteObjectRequest.class)))
                .thenReturn(DeleteObjectResponse.builder().build());

        attachmentService.deleteAttachment("att-1", "user@example.com");

        System.out.println("✅ [deleteAttachment_Success] - Expected calls: s3Client.deleteObject, attachmentRepository.deleteById, and socketEventService.emitFileDeleted");
        verify(s3Client).deleteObject(any(DeleteObjectRequest.class));
        verify(attachmentRepository).deleteById("att-1");
        verify(socketEventService).emitFileDeleted("class-123", "att-1");
    }

    @Test
    void deleteAttachment_Success_EvenIfS3Fails() {
        Attachment attachment = Attachment.builder()
                .id("att-1")
                .classId("class-123")
                .fileUrl("https://test-bucket.s3.us-east-1.amazonaws.com/classes/class-123/file.pdf")
                .build();

        when(attachmentRepository.findById("att-1")).thenReturn(Optional.of(attachment));
        when(s3Client.deleteObject(any(DeleteObjectRequest.class)))
                .thenThrow(new RuntimeException("S3 Error"));

        attachmentService.deleteAttachment("att-1", "user@example.com");

        System.out.println("✅ [deleteAttachment_Success_EvenIfS3Fails] - Expected calls: attachmentRepository.deleteById and socketEventService.emitFileDeleted");
        verify(attachmentRepository).deleteById("att-1");
        verify(socketEventService).emitFileDeleted("class-123", "att-1");
    }

    @Test
    void deleteAttachment_ThrowsRuntimeException_WhenNotFound() {
        when(attachmentRepository.findById("att-invalid")).thenReturn(Optional.empty());

        System.out.println("❌ [deleteAttachment_ThrowsRuntimeException_WhenNotFound] - Expected Exception: " + RuntimeException.class.getName());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            attachmentService.deleteAttachment("att-invalid", "user@example.com");
        });

        System.out.println("❌ [deleteAttachment_ThrowsRuntimeException_WhenNotFound] - Expected Exception Message: Không tìm thấy tài liệu để xóa | Actual Message: " + ex.getMessage());
        assertEquals("Không tìm thấy tài liệu để xóa", ex.getMessage());
        verify(s3Client, never()).deleteObject(any(DeleteObjectRequest.class));
        verify(attachmentRepository, never()).deleteById(any());
        verify(socketEventService, never()).emitFileDeleted(any(), any());
    }
}
