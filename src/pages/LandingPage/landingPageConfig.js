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
                backgroundImage: {
                    landscape: {
                        src: '/aimba/img/background-07-landscape.jpg'
                    },
                    portrait: {
                        src: '/aimba/img/background-07-portrait.jpg'
                    },
                },
                coverImage: {
                    src: '/aimba/img/banner-illustration.jpg',
                    alt: 'AiMBA'
                }
            },
            ecoSystem: {
                slideImages: [
                    ['/aimba/img/shared-screenshot-03.jpg', 'Screenshot 03'],
                    ['/aimba/img/shared-screenshot-02.jpg', 'Screenshot 02'],
                    ['/aimba/img/shared-screenshot-01.jpg', 'Screenshot 01'],
                ].map(imgAttrs),
                highlightsBackgroundImage: {
                    src: '/aimba/img/background-01.jpg'
                }
            },
            resources: {
                brandStories: {
                    slideImages: [
                        ['/aimba/img/shared-screenshot-02.jpg', 'Screenshot 02'],
                        ['/aimba/img/shared-screenshot-03.jpg', 'Screenshot 03'],
                        ['/aimba/img/shared-screenshot-04.jpg', 'Screenshot 04'],
                    ].map(imgAttrs)
                },
                businessModels: {
                    slideImages: [
                        ['/aimba/img/shared-screenshot-03.jpg', 'Screenshot 03'],
                        ['/aimba/img/shared-screenshot-04.jpg', 'Screenshot 04'],
                        ['/aimba/img/shared-screenshot-05.jpg', 'Screenshot 05'],
                    ].map(imgAttrs)
                },
                bookInsights: {
                    slideImages: [
                        ['/aimba/img/shared-screenshot-04.jpg', 'Screenshot 04'],
                        ['/aimba/img/shared-screenshot-05.jpg', 'Screenshot 05'],
                        ['/aimba/img/shared-screenshot-06.jpg', 'Screenshot 06'],
                    ].map(imgAttrs)
                },
                miscellaneous: {
                    slideImages: [
                        ['/aimba/img/shared-screenshot-05.jpg', 'Screenshot 05'],
                        ['/aimba/img/shared-screenshot-06.jpg', 'Screenshot 06'],
                        ['/aimba/img/shared-screenshot-01.jpg', 'Screenshot 01'],
                    ].map(imgAttrs)
                }
            },
            modules: {
                backgroundImage: {
                    src: '/aimba/img/background-02.jpg'
                },
                slideVideos: [
                    {
                        src: 'https://bucket-xichtho.hn.ss.bfcplatform.vn/hongky.info/Video review AIMBA fix voice .mp4',
                        poster: '/aimba/uploaded/video_AiMBA.jpg',
                        muted : true
                    },
                    {
                        src: 'https://www.youtube.com/embed/LB0fgX9wFXE?si=FMZD6gqycLZRGL15&autoplay=1&mute=1',
                    }
                 
                ]
            },
            coreValues: {
                backgroundImage: {
                    src: '/aimba/img/background-03.jpg'
                }
            },
            ourSolution: {
                coverImage: {
                    src: '/aimba/img/our-solution-why-us.jpg',
                    alt: 'Tại sao nên chọn AiMBA?'
                },
                slideImages: [
                    ['/aimba/img/shared-screenshot-01.jpg', 'Screenshot 01'],
                    ['/aimba/img/shared-screenshot-02.jpg', 'Screenshot 02'],
                    ['/aimba/img/shared-screenshot-03.jpg', 'Screenshot 03'],
                    ['/aimba/img/shared-screenshot-04.jpg', 'Screenshot 04'],
                    ['/aimba/img/shared-screenshot-05.jpg', 'Screenshot 05'],
                    ['/aimba/img/shared-screenshot-06.jpg', 'Screenshot 06'],
                ].map(imgAttrs)
            },
            learningStrategy: {
                backgroundImage: {
                    src: '/aimba/img/background-04.jpg'
                },
                coverImage: {
                    src: '/aimba/img/learning-strategy-cover.jpg',
                    alt: 'Cách thức học tập tại AiMBA'
                }
            },
            targetAudience: {
                backgroundImage: {
                    src: '/aimba/img/background-05.jpg'
                },
                certificateImage: {
                    src: '/aimba/img/target-audience-certificate.png',
                    alt: 'Chứng nhận hoàn thành khóa học'
                }
            },
            beingTrusted: {
                testimonials: [
                    {
                        avatar: '/aimba/img/being-trusted-person-01.jpg',
                        name: 'Phạm Than Hoài',
                        title: 'Trưởng phòng Marketing tại Digital Agency',
                        message: 'Tôi từng cân nhắc học MBA nhưng chi phí, công sức và thời gian nghỉ việc hiện tại là rào cản quá lớn. Với AiMBA, chỉ sau vài giờ học tôi đã có thể áp dụng ngay kiến thức vào công việc và thấy kết quả rõ rệt trong hiệu suất đội nhóm, giúp 1 dự án marketing tối ưu 15% chi phí nhờ cách phân tích tình huống. Sếp tôi đã rất hài lòng.'
                    },
                    {
                        avatar: '/aimba/img/being-trusted-person-02.jpg',
                        name: 'Lưu Hương Giang',
                        title: 'Manager doanh nghiệp SME F&B',  
                        message: 'Điều tôi ấn tượng nhất ở AiMBA là mọi kiến thức MBA không còn nằm trong sách vở, mà được đặt thẳng vào những tình huống doanh nghiệp Việt Nam. Thay vì học SWOT hay BSC theo lý thuyết, tôi được thực hành trên case thực tế và thấy ngay cách áp dụng vào công việc. Đây là điểm khác biệt mà tôi rất thích.'
                    },
                    {
                        avatar: '/aimba/img/being-trusted-person-03.jpg',
                        name: 'Phạm Thành Công',
                        title: 'CEO Công ty SaaS',
                        message: `AIMBA trang bị cho tôi 'ngôn ngữ lãnh đạo' sắc bén để đặt đề bài đúng, phản biện chiến lược và kiểm soát rủi ro thay vì chỉ nghe báo cáo một chiều từ chuyên viên. Những bài học thực chiến, đậm chất tình huống Việt Nam tại đây giúp tôi giải quyết các điểm nghẽn vận hành.Giờ đây, đội ngũ phục tôi vì năng lực dẫn dắt thực thụ chứ không chỉ vì được trả lương cuối tháng.`
                    },
                    {
                        avatar: '/aimba/img/being-trusted-person-04.jpg',
                        name: 'Trần Linh An ',
                        title: ' Sinh Viên QTKD FTU',
                        message: 'Từng trượt Management Trainee vì thiếu tư duy tổng thể dù GPA cao, AIMBA là bước ngoặt của mình. Thay vì tốn hàng trăm triệu cho MBA, mình chọn đầu tư nghiêm túc vào lộ trình này để rèn sự sắc bén trong giải quyết vấn đề, tư duy chiến lược, kỹ năng teamwork và thấu hiểu cách doanh nghiệp vận hành qua 1.000 Case Study. Kết quả là mình đã cầm chắc offer Big 4 trong tay!'
                    },
                ]
            },
            registration: {
                backgroundImage: {
                    src: '/aimba/img/background-06.jpg'
                },
            },
            frequentlyAskedQuestions: {
                questionsAndAnswers: [
                    ['AiMBA khác gì với MBA truyền thống?', 'AiMBA tập trung vào tính ứng dụng thực tế với phương pháp thiết kế ngược, bắt đầu từ 640+ case study thực tế rồi đi ngược lại 170+ khối lý thuyết. Phù hợp với bối cảnh kinh doanh Việt Nam và linh hoạt theo thời gian học tập.'],
                    ['Tôi có thể học riêng lẻ từng module không?', 'AiMBA được thiết kế như một hệ sinh thái học tập toàn diện. Bạn sẽ nhận được trọn bộ 8 module để phát triển năng lực một cách hệ thống từ cơ bản đến nâng cao, đảm bảo tính liên kết và hiệu quả tối ưu.'],
                    ['640+ case study được phân bổ như thế nào trong các module?', 'Mỗi module có số lượng case study khác nhau tùy theo độ phức tạp: Module 1 (80+),Module 2 (100+), Module 3 (90+), Module 4 (70+), Module 5 (80+), Module 6 (85+), Module 7 (75+), Module 8 (60+). Tất cả đều dựa trên tình huống thực tế tại Việt Nam.'],
                    ['Có chứng chỉ sau khi hoàn thành không?', 'Có, bạn sẽ nhận được chứng nhận hoàn thành từ AiMBA sau khi hoàn thành các bài tập và đánh giá trong chương trình.']
                ].map(([question, answer]) => ({question, answer}))
            },
            footer: {
                qrCode: {
                    title: 'Tacasoft',
                    data: 'https://tacasoft.vn',
                    image: {
                        src: '/aimba/img/qrcode-tacasoft.png'
                    }
                }
            }
        }
    };
};

