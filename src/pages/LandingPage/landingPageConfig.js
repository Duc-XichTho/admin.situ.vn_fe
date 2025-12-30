const imgAttrs = ([src, alt]) => ({ src, alt });
const videoAttrs = ([src, poster]) => ({ src, poster });


export const createLandingPageConfig = (handlers) => {
    const {
        onRegistrationRequest,
        onLoginRequest,
        onRegistrationFormSubmit
    } = handlers;

    return {
        onRegistrationRequest,
        onLoginRequest,
        onRegistrationFormSubmit,
        contents: {
            banner: {
              coverImage: {
                alt: "AiMBA",
                src: "/aimba/img/banner-illustration.jpg",
              },
              backgroundImage: {
                portrait: {
                  src: "/aimba/img/background-07-portrait.jpg",
                },
                landscape: {
                  src: "/aimba/img/background-07-landscape.jpg",
                },
              },
            },
        
            footer: {
              qrCode: {
                data: "https://tacasoft.vn",
                image: {
                  src: "/aimba/img/qrcode-tacasoft.png",
                },
                title: "Tacasoft",
              },
            },
        
            modules: {
              slideVideos: [
                {
                  src: "https://bucket-xichtho.hn.ss.bfcplatform.vn/hongky.info/Video review AIMBA fix voice .mp4",
                  muted: true,
                  poster: "/aimba/uploaded/video_AiMBA.jpg",
                },
                {
                  src: "https://www.youtube.com/embed/LB0fgX9wFXE?si=FMZD6gqycLZRGL15&autoplay=1&mute=1",
                },
              ],
              backgroundImage: {
                src: "/aimba/img/background-02.jpg",
              },
            },
        
            ecoSystem: {
              slideImages: [
                { alt: "Screenshot 03", src: "/aimba/img/shared-screenshot-03.jpg" },
                { alt: "Screenshot 02", src: "/aimba/img/shared-screenshot-02.jpg" },
                { alt: "Screenshot 01", src: "/aimba/img/shared-screenshot-01.jpg" },
              ],
              highlightsBackgroundImage: {
                src: "/aimba/img/background-01.jpg",
              },
            },
        
            resources: {
              bookInsights: {
                slideImages: [
                  { alt: "Screenshot 04", src: "/aimba/img/shared-screenshot-04.jpg" },
                  { alt: "Screenshot 05", src: "/aimba/img/shared-screenshot-05.jpg" },
                  { alt: "Screenshot 06", src: "/aimba/img/shared-screenshot-06.jpg" },
                ],
              },
              brandStories: {
                slideImages: [
                  { alt: "Screenshot 02", src: "/aimba/img/shared-screenshot-02.jpg" },
                  { alt: "Screenshot 03", src: "/aimba/img/shared-screenshot-03.jpg" },
                  { alt: "Screenshot 04", src: "/aimba/img/shared-screenshot-04.jpg" },
                ],
              },
              miscellaneous: {
                slideImages: [
                  { alt: "Screenshot 05", src: "/aimba/img/shared-screenshot-05.jpg" },
                  { alt: "Screenshot 06", src: "/aimba/img/shared-screenshot-06.jpg" },
                  { alt: "Screenshot 01", src: "/aimba/img/shared-screenshot-01.jpg" },
                ],
              },
              businessModels: {
                slideImages: [
                  { alt: "Screenshot 03", src: "/aimba/img/shared-screenshot-03.jpg" },
                  { alt: "Screenshot 04", src: "/aimba/img/shared-screenshot-04.jpg" },
                  { alt: "Screenshot 05", src: "/aimba/img/shared-screenshot-05.jpg" },
                ],
              },
            },
        
            coreValues: {
              backgroundImage: {
                src: "/aimba/img/background-03.jpg",
              },
            },
        
            ourSolution: {
              coverImage: {
                alt: "Tại sao nên chọn AiMBA?",
                src: "/aimba/img/our-solution-why-us.jpg",
              },
              slideImages: [
                { alt: "Screenshot 01", src: "/aimba/img/shared-screenshot-01.jpg" },
                { alt: "Screenshot 02", src: "/aimba/img/shared-screenshot-02.jpg" },
                { alt: "Screenshot 03", src: "/aimba/img/shared-screenshot-03.jpg" },
                { alt: "Screenshot 04", src: "/aimba/img/shared-screenshot-04.jpg" },
                { alt: "Screenshot 05", src: "/aimba/img/shared-screenshot-05.jpg" },
                { alt: "Screenshot 06", src: "/aimba/img/shared-screenshot-06.jpg" },
              ],
            },
        
            beingTrusted: {
              testimonials: [
                {
                  name: "Phạm Than Hoài",
                  title: "Trưởng phòng Marketing tại Digital Agency",
                  avatar: "https://bucket-xichtho.hn.ss.bfcplatform.vn/hongky.info/2.jpg",
                  message:
                    "Tôi từng cân nhắc học MBA nhưng chi phí, công sức và thời gian nghỉ việc hiện tại là rào cản quá lớn. Với AiMBA, chỉ sau vài giờ học tôi đã có thể áp dụng ngay kiến thức vào công việc và thấy kết quả rõ rệt trong hiệu suất đội nhóm, giúp 1 dự án marketing tối ưu 15% chi phí nhờ cách phân tích tình huống. Sếp tôi đã rất hài lòng.",
                },
                {
                  name: "Lưu Hương Giang",
                  title: "Manager doanh nghiệp SME F&B",
                  avatar: "https://bucket-xichtho.hn.ss.bfcplatform.vn/hongky.info/4.jpg",
                  message:
                    "Điều tôi ấn tượng nhất ở AiMBA là mọi kiến thức MBA không còn nằm trong sách vở, mà được đặt thẳng vào những tình huống doanh nghiệp Việt Nam. Thay vì học SWOT hay BSC theo lý thuyết, tôi được thực hành trên case thực tế và thấy ngay cách áp dụng vào công việc. Đây là điểm khác biệt mà tôi rất thích.",
                },
                {
                  name: "Phạm Thành Công",
                  title: "CEO Công ty SaaS",
                  avatar: "https://bucket-xichtho.hn.ss.bfcplatform.vn/hongky.info/3.jpg",
                  message:
                    "AIMBA trang bị cho tôi 'ngôn ngữ lãnh đạo' sắc bén để đặt đề bài đúng, phản biện chiến lược và kiểm soát rủi ro thay vì chỉ nghe báo cáo một chiều từ chuyên viên. Những bài học thực chiến, đậm chất tình huống Việt Nam tại đây giúp tôi giải quyết các điểm nghẽn vận hành.Giờ đây, đội ngũ phục tôi vì năng lực dẫn dắt thực thụ chứ không chỉ vì được trả lương cuối tháng.",
                },
                {
                  name: "Trần Linh An",
                  title: "Sinh Viên QTKD FTU",
                  avatar: "https://bucket-xichtho.hn.ss.bfcplatform.vn/hongky.info/1.jpg",
                  message:
                    "Từng trượt Management Trainee vì thiếu tư duy tổng thể dù GPA cao, AIMBA là bước ngoặt của mình. Thay vì tốn hàng trăm triệu cho MBA, mình chọn đầu tư nghiêm túc vào lộ trình này để rèn sự sắc bén trong giải quyết vấn đề, tư duy chiến lược, kỹ năng teamwork và thấu hiểu cách doanh nghiệp vận hành qua 1.000 Case Study. Kết quả là mình đã cầm chắc offer Big 4 trong tay!",
                },
              ],
            },
        
            registration: {
              backgroundImage: {
                src: "/aimba/img/background-06.jpg",
              },
            },
        
            targetAudience: {
              backgroundImage: {
                src: "/aimba/img/background-05.jpg",
              },
              certificateImage: {
                alt: "Chứng nhận hoàn thành khóa học",
                src: "/aimba/img/target-audience-certificate.png",
              },
            },
        
            learningStrategy: {
              coverImage: {
                alt: "Cách thức học tập tại AiMBA",
                src: "/aimba/img/learning-strategy-cover.jpg",
              },
              backgroundImage: {
                src: "/aimba/img/background-04.jpg",
              },
            },
        
            frequentlyAskedQuestions: {
              questionsAndAnswers: [
                {
                  question: "AiMBA khác gì với MBA truyền thống?",
                  answer:
                    "AiMBA tập trung vào tính ứng dụng thực tế với phương pháp thiết kế ngược, bắt đầu từ 1053+ case study thực tế rồi đi ngược lại 250+ khối lý thuyết . Phù hợp với bối cảnh kinh doanh Việt Nam và linh hoạt theo thời gian học tập.",
                },
                {
                  question: "Tôi có thể học riêng lẻ từng module không?",
                  answer:
                    "AiMBA được thiết kế như một hệ sinh thái học tập toàn diện. Bạn sẽ nhận được trọn bộ 15 module để phát triển năng lực một cách hệ thống từ cơ bản đến nâng cao, đảm bảo tính liên kết và hiệu quả tối ưu.",
                },
                {
                  question: "1053+ case study được phân bổ như thế nào trong các module?",
                  answer:
                    "Mỗi module có số lượng case study khác nhau tùy theo độ phức tạp: Module 1 (85+), Module 2 (112+), Module 3 (132+), Module 4 (144+), Module 5 (200+), Module 6 (68+), Module 7 (56+), Module 8 (80+), Module 9 (73+), Module 10 (100+), Module 11 (38+), Module 12 (39+), Module 13 (80+), Module 14 (28+), Module 15 (12+). Tất cả đều dựa trên tình huống thực tế tại Việt Nam.",
                },
                {
                  question: "Có chứng chỉ sau khi hoàn thành không?",
                  answer:
                    "Có, bạn sẽ nhận được chứng nhận hoàn thành từ AiMBA sau khi hoàn thành các bài tập và đánh giá trong chương trình.",
                },
              ],
            },
          },
    };
};

