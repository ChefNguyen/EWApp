DANH SÁCH CÔNG VIỆC SPRINT (SPRINT BACKLOG) - SPRINT 1 


1. MỤC TIÊU SPRINT 1 (SPRINT GOAL)
Mục tiêu Chính: "Xây dựng thành công luồng rút lương cơ bản với độ chính xác dòng tiền tuyệt đối và tích hợp giả lập cổng thanh toán."
Ý nghĩa: Kết thúc Sprint này, chúng ta phải có một ứng dụng chạy được trên điện thoại, cho phép user đăng nhập, nhìn thấy tiền lương của mình và thực hiện rút tiền thành công về tài khoản ngân hàng (môi trường Sandbox/Mock).
2. CÁC CÔNG VIỆC CẦN LÀM (SPRINT BACKLOG)


Dưới đây là các Product Backlog Items (PBI) được chọn ưu tiên:

A. Nhóm Thiết lập & Kỹ thuật (Technical Foundation)
Task 1: Setup Mock Server & Environment
Mô tả: Dựng cấu trúc dự án và file dữ liệu giả lập (MOCK_DATA).
Yêu cầu: Phải có sẵn data của user mẫu (vd: Lương 20tr, 15 công) để test.
B. Nhóm Tính năng Xác thực (Authentication)
PBI 1: Đăng nhập bằng Mã Nhân Viên
Mô tả: User nhập mã nhân viên để truy cập.
Tiêu chí chấp nhận (AC):
Nhập đúng NV001 -> Chuyển sang màn nhập OTP.
Nhập sai -> Báo lỗi "Mã nhân viên không tồn tại".
PBI 2: Xác thực OTP
Mô tả: Xác thực lớp bảo mật thứ 2.
AC: OTP mặc định (Hardcode) cho môi trường Dev là 123456. Đăng nhập thành công phải lưu session.
C. Nhóm Nghiệp vụ Cốt lõi (Core Logic)
PBI 3: Tính toán Hạn mức khả dụng (Quan trọng nhất)
Mô tả: Hệ thống tự tính số tiền user được phép rút.
Công thức (AC): (Lương Gross / 22 ngày chuẩn) * Số ngày công thực tế * 50%.
Logic: Phải trừ đi số tiền user_amount (đã ứng trước đó trong kỳ). Làm tròn xuống đơn vị nghìn đồng.
D. Nhóm Thanh toán (Payout System)
PBI 4: Liên kết Tài khoản Ngân hàng (KYC)
Mô tả: User nhập thông tin nhận tiền.
AC: Khi nhập STK, hệ thống gọi Mock API trả về tên chủ thẻ. Tên này bắt buộc phải trùng với tên nhân viên trong hệ thống mới cho phép liên kết.
PBI 5: Thực hiện Rút lương (Withdraw)
Mô tả: User tạo lệnh rút tiền.
AC:
Chặn: Không cho rút nếu Số tiền rút + Phí > Hạn mức còn lại.
Tính phí: < 1 triệu thu 10k, > 1 triệu thu 20k.
Xử lý: Gọi Mock API Payment -> Trả về thành công -> Trừ hạn mức hiển thị ngay lập tức (Real-time).


DANH SÁCH CÔNG VIỆC SPRINT (SPRINT BACKLOG) - SPRINT 2


1. MỤC TIÊU SPRINT 2 (SPRINT GOAL)
Mục tiêu Chính: "Mở rộng hệ sinh thái EWA: Cho phép người dùng sử dụng trực tiếp hạn mức lương để Nạp tiền điện thoại và Thanh toán hóa đơn sinh hoạt mà không cần rút tiền về ngân hàng."
Giá trị mang lại (Business Value):
Với User: Tiện lợi, giải quyết ngay nhu cầu thiết yếu khi hết tiền giữa tháng. Các dịch vụ này sẽ Miễn phí giao dịch (0đ fee) để khuyến khích sử dụng.
Với Hệ thống: Bổ sung loại giao dịch mới (Service Payment) vào Core Logic.
2. CÁC CÔNG VIỆC CẦN LÀM (SPRINT BACKLOG)


Dưới đây là chi tiết các Product Backlog Items (PBI) được sắp xếp theo nhóm tính năng:


A. Nhóm Tính năng Nạp tiền (Mobile Top-up)
PBI 1.1: Giao diện & Chọn mệnh giá Nạp tiền
Mô tả: User có thể nhập số điện thoại và chọn mệnh giá để nạp.
Tiêu chí chấp nhận (AC):
Mặc định lấy Số điện thoại của User đăng nhập, nhưng cho phép sửa để nạp cho người khác.
Tự động nhận diện nhà mạng (Viettel, Vinaphone, Mobifone) dựa trên đầu số.
Các mệnh giá cho phép: 10k, 20k, 50k, 100k, 200k, 500k.
Chặn thao tác nếu mệnh giá chọn > Hạn mức khả dụng.
PBI 1.2: Xử lý giao dịch Nạp tiền (Core & Mock API)
Mô tả: Trừ tiền và ghi nhận giao dịch nạp thẻ thành công.
AC:
User không phải chịu phí dịch vụ cho giao dịch này (Phí = 0đ).
Tổng trừ lương = Đúng Mệnh giá nạp.
Gọi Mock API Top-up (Giả lập kết nối Payoo/VNPAY) -> Trả về Success.
Trừ thẳng vào hạn mức khả dụng ở màn hình Home.
B. Nhóm Tính năng Thanh toán Hóa đơn (Bill Payments)
PBI 2.1: Tra cứu Hóa đơn (Điện/Nước)
Mô tả: User chọn loại dịch vụ và nhập Mã Khách Hàng (MKH) để tra cứu nợ.
Tiêu chí chấp nhận (AC):
Hỗ trợ 2 loại cơ bản cho MVP: Điện (EVN) và Nước.
Nhập MKH -> Gọi Mock API tra cứu -> Trả về Tên khách hàng, Địa chỉ, và Số tiền cần thanh toán.
Báo lỗi nếu MKH không tồn tại hoặc đã thanh toán.
PBI 2.2: Xử lý giao dịch Thanh toán Hóa đơn
Mô tả: Thực hiện thanh toán và trừ lương.
AC:
Kiểm tra: Số tiền hóa đơn <= Hạn mức khả dụng.
Phí thanh toán hóa đơn: Giả định 0đ (Miễn phí) trong giai đoạn này.
Bấm Thanh toán -> Gọi Mock API Bill Payment -> Trả về biên lai.
Trừ hạn mức và lưu lịch sử giao dịch.
C. Nhóm Nâng cấp Hệ thống Cốt lõi (Core Updates)
PBI 3.1: Cập nhật Màn hình Lịch sử Giao dịch (Transaction History)
Mô tả: Phân biệt được các loại giao dịch khác nhau.
Tiêu chí chấp nhận (AC):
Giao diện lịch sử cần thêm Icon hoặc Nhãn (Label) để phân biệt: Rút Bank (Màu xanh), Nạp ĐT (Màu cam), Hóa đơn (Màu tím).
Sửa file MOCK_DATA.js để có trường transaction_type.

3. YÊU CẦU CHO BA & QA TRONG SPRINT NÀY
BA (Business Analyst):
Thiết kế luồng (Screen Flow) cho tính năng Nạp tiền và Thanh toán.
Bổ sung định dạng JSON cho API Tra cứu hóa đơn (Trả về tên KH, kỳ hóa đơn, số tiền).
QA (Quality Control):
Viết Test Case đặc thù: Tra cứu sai mã, Hóa đơn nợ 0đ, Hóa đơn nợ lớn hơn Hạn mức lương, Nạp tiền điện thoại khi sóng yếu (Timeout).
Tech Lead / Dev:
Tái cấu trúc (Refactor) lại hàm tính Hạn mức khả dụng để nó tự động trừ tổng của tất cả các loại giao dịch (Tổng Rút Bank + Tổng Nạp ĐT + Tổng Hóa đơn).



