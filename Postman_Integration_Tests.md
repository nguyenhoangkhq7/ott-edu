# Báo Cáo Kịch Bản Kiểm Thử Tích Hợp API (Postman Integration Testing)

Tài liệu này cung cấp các kịch bản kiểm thử tích hợp (API Testing) cho dịch vụ **assignment-service** bằng công cụ Postman. Tài liệu bao gồm cấu hình chi tiết cho từng API, các mã kiểm thử tự động JavaScript (`pm.test`) chạy sau khi nhận phản hồi, và mã nguồn cấu hình Postman Collection hoàn chỉnh ở cuối tài liệu phục vụ cho tích hợp CI/CD với Newman.

---

## 1. Danh Sách Các API Cần Kiểm Thử

### API 1: Tạo mới một bài tập (Create Assignment)
* **Phương thức**: `POST`
* **Đường dẫn (Endpoint)**: `{{baseUrl}}/api/v1/assignments/create`
* **Mô tả**: Giảng viên có quyền `TEACHER` tạo một bài tập dạng luận (`ESSAY`) hoặc trắc nghiệm (`QUIZ`) cùng với danh sách các đường dẫn tài liệu tham khảo được lưu trên S3 (`materialUrls`).

#### Body (JSON):
```json
{
  "title": "Bài tập Tích Hợp Hệ Thống - Nhóm {{randomInt}}",
  "instructions": "Vui lòng xem các file tài liệu đính kèm bên dưới và nộp bài luận dạng PDF trước thời hạn.",
  "type": "ESSAY",
  "dueDate": "2026-06-30T23:59:59",
  "maxScore": 100.0,
  "teamIds": [101],
  "materialUrls": [
    "https://s3.amazonaws.com/ott-edu-materials/ref-document-1.pdf",
    "https://s3.amazonaws.com/ott-edu-materials/ref-document-2.pdf"
  ]
}
```

#### Pre-request Script:
```javascript
// Sinh ngẫu nhiên số hiệu nhóm để tránh trùng lặp dữ liệu tiêu đề bài tập
const randomInt = Math.floor(Math.random() * 10000);
pm.variables.set("randomInt", randomInt);
```

#### Postman Test Scripts:
```javascript
pm.test("Mã trạng thái phản hồi là 201 (Created)", function () {
    pm.response.to.have.status(201);
});

pm.test("Thời gian phản hồi nhỏ hơn 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

pm.test("Dữ liệu trả về đúng định dạng Schema của AssignmentSummaryDto", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("id");
    pm.expect(jsonData).to.have.property("title");
    pm.expect(jsonData).to.have.property("type");
    pm.expect(jsonData).to.have.property("maxScore");
    pm.expect(jsonData.maxScore).to.eql(100.0);
    pm.expect(jsonData.type).to.eql("ESSAY");

    // Lưu lại ID của bài tập vừa tạo để dùng cho các bước kiểm thử tiếp theo
    pm.environment.set("assignmentId", jsonData.id);
});
```

---

### API 2: Lấy lịch sự kiện của sinh viên (Get Calendar Events)
* **Phương thức**: `GET`
* **Đường dẫn (Endpoint)**: `{{baseUrl}}/api/v1/calendar/my-events?month=5&year=2026`
* **Mô tả**: Học sinh có quyền `STUDENT` lấy danh sách các sự kiện bài tập và bài kiểm tra trắc nghiệm đến hạn trong tháng 5 năm 2026.

#### Params:
* `month`: `5`
* `year`: `2026`

#### Header yêu cầu:
* `Authorization`: `Bearer {{jwtToken}}`

#### Postman Test Scripts:
```javascript
pm.test("Mã trạng thái phản hồi là 200 (OK)", function () {
    pm.response.to.have.status(200);
});

pm.test("Thời gian phản hồi nhỏ hơn 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

pm.test("Dữ liệu trả về là một mảng danh sách sự kiện lịch", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an("array");
    
    if (jsonData.length > 0) {
        var firstEvent = jsonData[0];
        pm.expect(firstEvent).to.have.property("id");
        pm.expect(firstEvent).to.have.property("title");
        pm.expect(firstEvent).to.have.property("type");
        pm.expect(firstEvent).to.have.property("courseName");
        pm.expect(firstEvent).to.have.property("dueDate");
    }
});
```

---

### API 3: Sinh viên nộp bài luận (Submit Assignment)
* **Phương thức**: `POST`
* **Đường dẫn (Endpoint)**: `{{baseUrl}}/api/v1/submissions/assignment/{{assignmentId}}/submit`
* **Mô tả**: Học sinh thực hiện nộp bài luận hoàn chỉnh kèm theo đường dẫn file lưu trữ trên AWS S3 (`fileUrl`).

#### Body (JSON):
```json
{
  "essayContent": "Nội dung bài nộp giải pháp tích hợp hệ thống dịch vụ OTT-EDU.",
  "fileUrl": "https://s3.amazonaws.com/ott-edu-submissions/student-essay-file.pdf",
  "confirm": true
}
```

#### Postman Test Scripts:
```javascript
pm.test("Mã trạng thái phản hồi là 200 (OK)", function () {
    pm.response.to.have.status(200);
});

pm.test("Thời gian phản hồi nhỏ hơn 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

pm.test("Thông báo nộp bài thành công và ghi nhận thời gian nộp", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.message).to.eql("Assignment submitted successfully");
    pm.expect(jsonData).to.have.property("submittedAt");
});
```

---

### API 4: Giảng viên chấm điểm bài nộp (Grade Submission)
* **Phương thức**: `POST`
* **Đường dẫn (Endpoint)**: `{{baseUrl}}/api/v1/submissions/{{submissionId}}/grade`
* **Mô tả**: Giảng viên thực hiện cho điểm số (`score`) và lời phê (`feedback`) cho bài nộp của sinh viên.

#### Body (JSON):
```json
{
  "score": 90.0,
  "feedback": "Cấu trúc lời giải tốt, phân tích kiến trúc hệ thống chính xác. Phát huy!"
}
```

#### Postman Test Scripts:
```javascript
pm.test("Mã trạng thái phản hồi là 200 (OK)", function () {
    pm.response.to.have.status(200);
});

pm.test("Thời gian phản hồi nhỏ hơn 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

pm.test("Thông tin điểm và lời phê khớp với dữ liệu đã lưu", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("id");
    pm.expect(jsonData.score).to.eql(90.0);
    pm.expect(jsonData.feedback).to.eql("Cấu trúc lời giải tốt, phân tích kiến trúc hệ thống chính xác. Phát huy!");
    pm.expect(jsonData).to.have.property("gradedAt");
    pm.expect(jsonData).to.have.property("revision");
});
```

---

## 2. Mã Cấu Hình Raw Postman Collection v2.1.0 JSON

Bạn có thể copy toàn bộ đoạn mã JSON dưới đây và chọn tính năng **Import** trong ứng dụng Postman (hoặc chạy qua Newman dưới dạng CLI) để nạp nhanh kịch bản kiểm thử:

```json
{
  "info": {
    "_postman_id": "74888204-6292-4217-ba5d-e0872ff7e411",
    "name": "Assignment Service Integration Tests",
    "description": "Bộ kiểm thử tích hợp tự động cho microservice quản lý bài tập (assignment-service)",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Create Assignment",
      "event": [
        {
          "listen": "prerequest",
          "script": {
            "exec": [
              "const randomInt = Math.floor(Math.random() * 10000);",
              "pm.variables.set(\"randomInt\", randomInt);"
            ],
            "type": "text/javascript"
          }
        },
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test(\"Status code is 201\", function () {",
              "    pm.response.to.have.status(201);",
              "});",
              "",
              "pm.test(\"Response time is less than 500ms\", function () {",
              "    pm.expect(pm.response.responseTime).to.be.below(500);",
              "});",
              "",
              "pm.test(\"Response contains valid assignment data\", function () {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData).to.have.property(\"id\");",
              "    pm.expect(jsonData.title).to.include(\"Bài tập Tích Hợp Hệ Thống\");",
              "    pm.expect(jsonData.maxScore).to.eql(100.0);",
              "    pm.environment.set(\"assignmentId\", jsonData.id);",
              "});"
            ],
            "type": "text/javascript"
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{jwtToken}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"title\": \"Bài tập Tích Hợp Hệ Thống - Nhóm {{randomInt}}\",\n  \"instructions\": \"Vui lòng xem các file tài liệu đính kèm bên dưới và nộp bài luận dạng PDF trước thời hạn.\",\n  \"type\": \"ESSAY\",\n  \"dueDate\": \"2026-06-30T23:59:59\",\n  \"maxScore\": 100.0,\n  \"teamIds\": [101],\n  \"materialUrls\": [\n    \"https://s3.amazonaws.com/ott-edu-materials/ref-document-1.pdf\",\n    \"https://s3.amazonaws.com/ott-edu-materials/ref-document-2.pdf\"\n  ]\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/assignments/create",
          "host": [
            "{{baseUrl}}"
          ],
          "path": [
            "api",
            "v1",
            "assignments",
            "create"
          ]
        }
      },
      "response": []
    },
    {
      "name": "2. Get Calendar Events",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test(\"Status code is 200\", function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "",
              "pm.test(\"Response time is less than 500ms\", function () {",
              "    pm.expect(pm.response.responseTime).to.be.below(500);",
              "});",
              "",
              "pm.test(\"Response is an array of events\", function () {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData).to.be.an(\"array\");",
              "    if (jsonData.length > 0) {",
              "        var firstEvent = jsonData[0];",
              "        pm.expect(firstEvent).to.have.property(\"id\");",
              "        pm.expect(firstEvent).to.have.property(\"title\");",
              "        pm.expect(firstEvent).to.have.property(\"type\");",
              "    }",
              "});"
            ],
            "type": "text/javascript"
          }
        }
      ],
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwtToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/v1/calendar/my-events?month=5&year=2026",
          "host": [
            "{{baseUrl}}"
          ],
          "path": [
            "api",
            "v1",
            "calendar",
            "my-events"
          ],
          "query": [
            {
              "key": "month",
              "value": "5"
            },
            {
              "key": "year",
              "value": "2026"
            }
          ]
        }
      },
      "response": []
    },
    {
      "name": "3. Submit Assignment",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test(\"Status code is 200\", function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "",
              "pm.test(\"Response time is less than 500ms\", function () {",
              "    pm.expect(pm.response.responseTime).to.be.below(500);",
              "});",
              "",
              "pm.test(\"Response message is correct\", function () {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData.message).to.eql(\"Assignment submitted successfully\");",
              "    pm.expect(jsonData).to.have.property(\"submittedAt\");",
              "});"
            ],
            "type": "text/javascript"
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{jwtToken}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"essayContent\": \"Nội dung bài nộp giải pháp tích hợp hệ thống dịch vụ OTT-EDU.\",\n  \"fileUrl\": \"https://s3.amazonaws.com/ott-edu-submissions/student-essay-file.pdf\",\n  \"confirm\": true\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/submissions/assignment/{{assignmentId}}/submit",
          "host": [
            "{{baseUrl}}"
          ],
          "path": [
            "api",
            "v1",
            "submissions",
            "assignment",
            "{{assignmentId}}",
            "submit"
          ]
        }
      },
      "response": []
    },
    {
      "name": "4. Grade Submission",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test(\"Status code is 200\", function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "",
              "pm.test(\"Response time is less than 500ms\", function () {",
              "    pm.expect(pm.response.responseTime).to.be.below(500);",
              "});",
              "",
              "pm.test(\"Grade response contains correct properties\", function () {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData).to.have.property(\"id\");",
              "    pm.expect(jsonData.score).to.eql(90.0);",
              "    pm.expect(jsonData.feedback).to.eql(\"Cấu trúc lời giải tốt, phân tích kiến trúc hệ thống chính xác. Phát huy!\");",
              "});"
            ],
            "type": "text/javascript"
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{jwtToken}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"score\": 90.0,\n  \"feedback\": \"Cấu trúc lời giải tốt, phân tích kiến trúc hệ thống chính xác. Phát huy!\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/submissions/{{submissionId}}/grade",
          "host": [
            "{{baseUrl}}"
          ],
          "path": [
            "api",
            "v1",
            "submissions",
            "{{submissionId}}",
            "grade"
          ]
        }
      },
      "response": []
    }
  ]
}
```
