# Báo Cáo Kết Quả Unit Test - OTT-EDU Microservices

Tài liệu này trình bày chi tiết về các bộ kiểm thử tự động (Unit Test) đã được thiết lập, cấu hình và chạy thành công cho hai dịch vụ: **assignment-service (Java)** và **chat-service (Node.js)**.

---

## 1. Kết Quả Tổng Quan

| Dịch vụ | Công nghệ kiểm thử | Số lượng Test Case | Trạng thái |
| :--- | :--- | :---: | :--- |
| **assignment-service** (Java) | JUnit 5 + Mockito | **32** | ✅ 100% Thành công (Thừa nhận bởi Maven) |
| **chat-service** (Node.js) | Jest + Mongoose Spies | **13** | ✅ 100% Thành công (Thừa nhận bởi Jest) |

---

## 2. Chi Tiết Các Bộ Kiểm Thử

### 2.1 Java Microservice (`assignment-service`)
Vị trí thư mục test: `src/test/java/fit/iuh/modules/quiz/services/`

#### a. `CalendarServiceImplTest.java` (4 Test Cases)
Bộ kiểm thử này giả lập (`Mock`) cổng giao tiếp `CoreServiceClient` và kho lưu trữ `AssignmentRepository`.
* **getStudentEvents_Success_WithTeamsAndAssignments**: Kiểm tra luồng lấy thành công danh sách sự kiện bài tập/quiz từ các lớp học/team mà sinh viên đã tham gia trong tháng/năm xác định.
* **getStudentEvents_Success_NoTeams**: Kiểm tra luồng xử lý an toàn khi sinh viên chưa tham gia bất kỳ team nào (hàm trả về danh sách rỗng).
* **getStudentEvents_Success_NullTeams**: Kiểm tra luồng xử lý an toàn khi API Core trả về danh sách team là `null`.
* **getStudentEvents_Failure_CoreServiceThrowsException**: Kiểm tra cơ chế lan truyền lỗi (exception) khi dịch vụ core gặp sự cố.

#### b. `SubmissionServiceImplTest.java` (28 Test Cases)
Đảm bảo kiểm tra toàn bộ **14 phương thức nghiệp vụ** trong lớp `SubmissionServiceImpl`, mỗi phương thức bao gồm tối thiểu **1 luồng thành công (success path)** và **1 luồng thất bại/ngoại lệ (failure/exception path)**:
1. `getPendingGradesForAssignment` (2 tests): Luồng lấy danh sách bài nộp chờ chấm điểm của giảng viên thành công / Thất bại khi tài khoản yêu cầu không phải người tạo bài tập (`AccessDeniedException`).
2. `getSubmissionsForAssignment` (2 tests): Lấy toàn bộ danh sách bài nộp thành công / Lỗi không tìm thấy bài tập (`ResourceNotFoundException`).
3. `gradeSubmission` (2 tests): Điểm số hợp lệ và cập nhật trạng thái bài nộp thành công / Điểm số chấm vượt quá điểm tối đa cho phép (`ValidationException`).
4. `getSubmissionDetailForTeacher` (2 tests): Xem chi tiết bài nộp từ phía giảng viên tạo bài tập thành công / Từ chối truy cập khi giáo viên khác xem bài nộp.
5. `getMySubmission` (2 tests): Học sinh xem bài nộp của chính mình thành công / Từ chối xem bài nộp của học sinh khác.
6. `getMyGrade` (2 tests): Học sinh xem điểm thành công / Lỗi chưa có điểm được chấm.
7. `getMySubmissions` (2 tests): Lấy lịch sử tất cả bài nộp của học sinh thành công / Danh sách rỗng.
8. `saveDraft` (2 tests): Lưu bản nháp bài làm (khi trạng thái là DRAFT) thành công / Lỗi khi cố lưu nháp bài đã nộp (`ValidationException`).
9. `submitAssignment` (2 tests): Nộp bài chính thức thành công trước deadline / Lỗi khi nộp mà không chọn xác nhận xác thực (`confirm = false`).
10. `getAttemptHistory` (2 tests): Lấy lịch sử số lần làm bài kiểm tra thành công / Bài tập không tồn tại.
11. `canAttemptAssignment` (2 tests): Bài kiểm tra không giới hạn số lần làm bài / Số lần làm bài đã đạt giới hạn tối đa.
12. `getRemainingAttempts` (2 tests): Tính số lần làm bài còn lại thành công khi không giới hạn (-1) / Khi có giới hạn cụ thể.
13. `startAssignment` (2 tests): Khởi tạo lượt làm bài nháp mới thành công / Cơ chế Idempotent (không tạo mới khi đã có bản nháp sẵn có).
14. `getCurrentSubmission` (2 tests): Lấy bài nộp hiện tại của học sinh thành công / Trả về `null` khi chưa bắt đầu làm bài.

---

### 2.2 Node.js Microservice (`chat-service`)
Vị trí file test: `src/services/chat.service.test.ts`

Bộ kiểm thử được viết bằng **Jest** và giả lập các Mongoose model (`Conversation`, `Message`) cùng với `socketManager` để kiểm tra logic **`onlyAdminCanMessage`** (Chỉ quản trị viên mới được nhắn tin trong nhóm lớp) mới được cập nhật.

#### a. Logic gửi tin nhắn nhóm (`sendGroupMessage` - 6 Test Cases)
* **Luồng thành công 1**: Cho phép bất kỳ thành viên nào nhắn tin nếu chế độ `onlyAdminCanMessage` đang tắt (`false`).
* **Luồng thành công 2**: Cho phép Trưởng nhóm (`owner`) gửi tin nhắn khi chế độ chỉ admin nhắn tin đang bật (`true`).
* **Luồng thành công 3**: Cho phép Phó nhóm (`deputy`) gửi tin nhắn khi chế độ chỉ admin nhắn tin đang bật (`true`).
* **Luồng chặn thành công (Failure Path 1)**: Ngăn chặn và ném ra lỗi mã `403` khi một thành viên thông thường gửi tin nhắn vào nhóm đang bật `onlyAdminCanMessage`.
* **Luồng thất bại 2**: Kiểm tra lỗi khi gửi tin nhắn vào một cuộc hội thoại đã được lưu trữ/khóa (`archived`).
* **Luồng thất bại 3**: Kiểm tra chặn người dùng không thuộc cuộc hội thoại gửi tin nhắn.

#### b. Logic cập nhật thiết lập nhóm (`updateConversationSettings` - 7 Test Cases)
* **Luồng thành công 1**: Cho phép Trưởng nhóm bật chế độ `onlyAdminCanMessage`, tự động lưu hệ thống tin nhắn thông báo ("*Trưởng nhóm đã bật...*") và phát WebSocket tới tất cả thành viên.
* **Luồng thành công 2**: Cho phép Phó nhóm tắt chế độ `onlyAdminCanMessage` thành công.
* **Luồng thành công 3**: Trả về sớm và không lưu/không tạo tin nhắn hệ thống nếu giá trị cấu hình gửi lên trùng khớp với cấu hình hiện tại.
* **Luồng thành công 4**: Trả về sớm nếu định dạng tham số cấu hình gửi lên không phải kiểu `boolean`.
* **Luồng thất bại 1**: Chặn thành viên thường cập nhật cấu hình phòng chat (trả về lỗi `403` do không có quyền quản trị).
* **Luồng thất bại 2**: Lỗi `404` khi không tìm thấy cuộc hội thoại.
* **Luồng thất bại 3**: Lỗi `400` khi cấu hình phòng chat không phải thuộc loại nhóm lớp (`type != class`).

---

## 3. Ma Trận Quyết Định Kiểm Thử (Test Case Matrix - Excel Style)

Dưới đây là bảng ma trận kiểm thử (Decision Table) cho 3 hàm quan trọng, biểu diễn bằng ký tự `O` để đánh dấu các điều kiện đầu vào và kết quả đầu ra tương ứng:

### 3.1 Hàm `getPendingGradesForAssignment` (SubmissionServiceImpl - Java)

| Category | Condition/Value | UTC_GP_01 (Success) | UTC_GP_02 (Failure) |
| :--- | :--- | :---: | :---: |
| **Precondition** | Giảng viên đã đăng nhập (Có Bearer token) | O | O |
| **Input** | `assignmentId` hợp lệ | O | O |
| | `creatorId` trùng khớp với người tạo bài tập | O | |
| | `creatorId` không trùng khớp với người tạo bài tập | | O |
| **Confirm/Return** | Trả về đối tượng Page chứa DTO bài nộp | O | |
| | Ném ra ngoại lệ `AccessDeniedException` | | O |
| **Exception / Log** | `"Teacher with id ... is not the creator..."` | | O |
| **Result** | Type (N/A/B) | N | A |
| | Passed/Failed (P/F) | P | P |
| | Executed Date | 2026-05-29 | 2026-05-29 |

### 3.2 Hàm `submitAssignment` (SubmissionServiceImpl - Java)

| Category | Condition/Value | UTC_SA_01 (Success) | UTC_SA_02 (Failure) |
| :--- | :--- | :---: | :---: |
| **Precondition** | Học sinh đã đăng nhập | O | O |
| | Học sinh có bài nộp đang ở trạng thái DRAFT | O | O |
| **Input** | Tham số xác nhận nộp bài `confirm = true` | O | |
| | Tham số xác nhận nộp bài `confirm = false` | | O |
| **Confirm/Return** | Trạng thái bài nộp được đổi sang SUBMITTED | O | |
| | Ném ra ngoại lệ `ValidationException` | | O |
| **Exception / Log** | `"Submission must be confirmed before submitting..."` | | O |
| **Result** | Type (N/A/B) | N | A |
| | Passed/Failed (P/F) | P | P |
| | Executed Date | 2026-05-29 | 2026-05-29 |

### 3.3 Hàm `sendGroupMessage` (chat.service.ts - Node.js)

| Category | Condition/Value | UTC_SGM_01 | UTC_SGM_02 | UTC_SGM_03 | UTC_SGM_04 | UTC_SGM_05 | UTC_SGM_06 |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Precondition** | Người dùng đã đăng nhập | O | O | O | O | O | O |
| | Cuộc hội thoại nhóm tồn tại | O | O | O | O | O | O |
| **Input** | Chế độ chỉ Admin gửi tin nhắn tắt (`onlyAdminCanMessage = false`) | O | | | | | |
| | Chế độ chỉ Admin gửi tin nhắn bật (`onlyAdminCanMessage = true`) | | O | O | O | | |
| | Người gửi là Trưởng nhóm (`owner`) | | O | | | O | |
| | Người gửi là Phó nhóm (`deputy`) | | | O | | | |
| | Người gửi là Thành viên thường (`member`) | O | | | O | | |
| | Người gửi không thuộc cuộc hội thoại | | | | | | O |
| | Cuộc hội thoại nhóm đã bị lưu trữ (`isArchived = true`) | | | | | O | |
| **Confirm/Return** | Tin nhắn được tạo và gửi thành công | O | O | O | | | |
| | Ném ra lỗi bị từ chối (`statusCode = 403`) | | | | O | | O |
| | Ném ra lỗi cuộc hội thoại đã lưu trữ | | | | | O | |
| **Exception / Log** | `"Chỉ Trưởng nhóm và Phó nhóm mới có quyền..."` | | | | O | | |
| | `"Conversation is archived"` | | | | | O | |
| | `"You are not a member of this conversation"` | | | | | | O |
| **Result** | Type (N/A/B) | N | N | N | A | A | A |
| | Passed/Failed (P/F) | P | P | P | P | P | P |
| | Executed Date | 2026-05-29 | 2026-05-29 | 2026-05-29 | 2026-05-29 | 2026-05-29 | 2026-05-29 |

---

## 4. Log Chi Tiết Quá Trình Chạy Test

### 4.1 Chạy Test assignment-service (Java)
Lệnh thực thi:
```powershell
.\mvnw.cmd test "-Dtest=CalendarServiceImplTest,SubmissionServiceImplTest"
```

Kết quả đầu ra:
```text
[INFO] Scanning for projects...
[INFO] Building assignment-service 0.0.1-SNAPSHOT
...
[INFO] --- surefire:3.5.3:test (default-test) @ assignment-service ---
[INFO] Running fit.iuh.modules.quiz.services.CalendarServiceImplTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.841 s -- in fit.iuh.modules.quiz.services.CalendarServiceImplTest
[INFO] Running fit.iuh.modules.quiz.services.SubmissionServiceImplTest
[INFO] Tests run: 28, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.370 s -- in fit.iuh.modules.quiz.services.SubmissionServiceImplTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 32, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] --- jacoco:0.8.12:report (report) @ assignment-service ---
[INFO] Loading execution data file I:\school\cnm\project\ott-edu\services\assignment-service\target\jacoco.exec
[INFO] Analyzed bundle 'assignment-service' with 37 classes
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

### 4.2 Chạy Test chat-service (Node.js)
Lệnh thực thi:
```bash
npm run test src/services/chat.service.test.ts
```

Kết quả đầu ra:
```text
> chat-service@1.0.0 test
> node --experimental-vm-modules node_modules/jest/bin/jest.js src/services/chat.service.test.ts

PASS src/services/chat.service.test.ts
  ChatService - onlyAdminCanMessage logic
    sendGroupMessage
      √ should allow any member to send a message when onlyAdminCanMessage is false (3 ms)
      √ should allow group owner to send a message when onlyAdminCanMessage is true (1 ms)
      √ should allow group deputy to send a message when onlyAdminCanMessage is true (1 ms)
      √ should block ordinary member from sending a message when onlyAdminCanMessage is true (24 ms)
      √ should throw an error if the conversation is archived (1 ms)
      √ should throw an error if the sender is not a member of the conversation
    updateConversationSettings
      √ should allow owner to turn onlyAdminCanMessage on (1 ms)
      √ should allow deputy to turn onlyAdminCanMessage off
      √ should not update and return early if setting value is the same (1 ms)
      √ should not update and return early if setting value is not a boolean
      √ should throw a 403 error if requester is not a manager (1 ms)
      √ should throw a 404 error if conversation is not found
      √ should throw a 400 error if conversation type is not class

Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
Snapshots:   0 total
Time:        1.291 s
```
