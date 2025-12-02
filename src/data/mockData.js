// Mock data cho lịch sử câu hỏi
export const mockHistoryData = [
  {
    question: 'Tại sao trời có màu xanh?',
    score: 'excellent',
    scoreText: 'Tuyệt vời!',
    status: 'completed'
  },
  {
    question: 'Vì sao chim bay được?',
    score: 'good',
    scoreText: 'Tốt',
    status: 'completed'
  },
  {
    question: 'Tại sao mưa rơi từ trên xuống?',
    status: 'completed'
  },
  {
    question: 'Vì sao có ngày và đêm?',
    score: 'needsWork',
    scoreText: 'Cần cải thiện',
    status: 'completed'
  },
  {
    question: 'Tại sao lá cây có màu xanh?',
    status: 'processing'
  }
];

// Mock data cho câu hỏi mẫu
export const mockPremadeData = [
  { question: 'Tại sao lá cây có màu xanh?' },
  { question: 'Vì sao cầu vồng có 7 màu?' },
  { question: 'Tại sao biển có màu xanh?' },
  { question: 'Vì sao mặt trời nóng?' },
  { question: 'Tại sao có gió?' },
  { question: 'Vì sao có ngày và đêm?' },
  { question: 'Tại sao chim bay được?' },
  { question: 'Vì sao mưa rơi từ trên xuống?' }
];

// Suggestions cho prompt input
export const suggestions = [
  'tại sao trời có màu xanh',
  'vì sao chim bay được',
  'tại sao lá cây có màu xanh',
  'vì sao cầu vồng có 7 màu',
  'tại sao biển có màu xanh',
  'vì sao mặt trời nóng',
  'tại sao có ngày và đêm',
  'vì sao mưa rơi từ trên xuống'
];

// Mock answers cho các câu hỏi
export const mockAnswers = {
  'Tại sao lá cây có màu xanh?': {
    title: '🌿 Tại sao lá cây có màu xanh?',
    content: `<p>Chào bạn! Visao sẽ giải thích tại sao lá cây lại có màu xanh nhé! 🌱</p>
    
    <h3>🧪 Chất diệp lục - "Máy sản xuất thức ăn"</h3>
    <p>Lá cây có màu xanh vì chứa một chất đặc biệt gọi là diệp lục (chlorophyll). Diệp lục có nhiệm vụ hấp thủ ánh sáng mặt trời để làm thức ăn cho cây.</p>

    <h3>☀️ Tại sao diệp lục lại màu xanh?</h3>
    <p>Diệp lục hấp thụ các màu đỏ và xanh dương từ ánh sáng mặt trời rất tốt, nhưng lại phản xạ màu xanh lá cây. Vì vậy mắt chúng ta nhìn thấy lá cây có màu xanh!</p>

    <h3>🍂 Vậy tại sao mùa thu lá lại vàng?</h3>
    <p>Khi mùa thu đến, cây ngừng sản xuất diệp lục. Lúc này các màu khác như vàng, cam, đỏ (do các chất khác) sẽ hiện ra!</p>

    <p><strong>Thí nghiệm thú vị:</strong> Bạn có thể nghiền lá cây với cồn để tách chiết diệp lục và thấy màu xanh đậm đặc! 🔬</p>`,
    reflection: 'Hãy giải thích tại sao khi thu đông, lá cây chuyển màu vàng, đỏ thay vì xanh? Quá trình gì đã xảy ra bên trong lá cây?'
  },
  'Vì sao cầu vồng có 7 màu?': {
    title: '🌈 Tại sao cầu vồng có 7 màu?',
    content: `<p>Chào bạn! Visao sẽ giải thích tại sao cầu vồng lại có 7 màu nhé! 🌈</p>
    
    <h3>🔍 Ánh sáng trắng thật ra có nhiều màu!</h3>
    <p>Ánh sáng mặt trời trông có màu trắng, nhưng thực ra nó được tạo thành từ rất nhiều màu khác nhau trộn lại với nhau. Giống như khi ta trộn nhiều màu sơn lại sẽ thành màu trắng vậy!</p>

    <h3>💧 Giọt nước như lăng kính nhỏ</h3>
    <p>Khi trời mưa, có rất nhiều giọt nước nhỏ li ti trong không khí. Những giọt nước này hoạt động như những chiếc lăng kính siêu nhỏ!</p>

    <h3>✨ Phép màu xảy ra như thế nào?</h3>
    <p>Khi ánh sáng mặt trời chiếu qua những giọt nước này, ánh sáng trắng sẽ bị "tách" thành 7 màu riêng biệt: Đỏ, Cam, Vàng, Xanh lá cây, Xanh dương, Chàm, và Tím!</p>

    <p><strong>Thí nghiệm thú vị:</strong> Bạn có thể thử với đĩa CD cũ! Chiếu đèn pin vào đĩa CD, bạn sẽ thấy cầu vồng nhỏ xuất hiện đấy! 🔬</p>`,
    reflection: 'Hãy giải thích ngắn gọn: "Tại sao khi ta nhìn thấy cầu vồng, ta luôn thấy màu đỏ ở phía ngoài và màu tím ở phía trong? Điều gì quyết định thứ tự này của các màu sắc?"'
  },
  'Tại sao biển có màu xanh?': {
    title: '🌊 Tại sao biển có màu xanh?',
    content: `<p>Chào bạn! Visao sẽ giải thích tại sao biển lại có màu xanh đẹp như vậy! 🌊</p>
    
    <h3>☀️ Ánh sáng mặt trời và nước biển</h3>
    <p>Khi ánh sáng mặt trời chiếu xuống nước biển, điều thú vị xảy ra! Nước có tính chất hấp thụ các màu khác nhau với mức độ khác nhau.</p>

    <h3>🔴 Màu đỏ "mất tích" trước</h3>
    <p>Nước hấp thụ màu đỏ, cam, vàng rất nhanh. Chỉ cần xuống sâu vài mét, những màu này đã bị nước "nuốt" mất rồi!</p>

    <h3>💙 Màu xanh "sống sót" lâu nhất</h3>
    <p>Màu xanh dương có thể đi sâu hơn trong nước, và một phần được phản xạ trở lại mắt chúng ta. Vì vậy ta thấy biển có màu xanh!</p>

    <p><strong>Thí nghiệm suy nghĩ:</strong> Vì sao ở biển nông gần bờ nước lại trong suốt, còn ở biển sâu lại xanh đậm? 🤔</p>`,
    reflection: 'Tại sao ở độ sâu khác nhau, nước biển có những sắc thái xanh khác nhau? Và vì sao nước trong hồ bơi lại không xanh như nước biển?'
  },
  'Vì sao mặt trời nóng?': {
    title: '☀️ Vì sao mặt trời nóng?',
    content: `<p>Chào bạn! Visao sẽ giải thích tại sao mặt trời lại nóng đến vậy! ☀️</p>
    
    <h3>🔥 Lò lửa khổng lồ trong vũ trụ</h3>
    <p>Mặt trời giống như một lò lửa khổng lồ, nhưng không phải đốt gỗ hay than! Nó đang thực hiện phản ứng hạt nhân - quá trình mạnh mẽ nhất trong vũ trụ.</p>

    <h3>⚛️ Phản ứng nhiệt hạch</h3>
    <p>Trong lõi mặt trời, 4 nguyên tử hydro kết hợp thành 1 nguyên tử helium. Quá trình này giải phóng năng lượng khổng lồ!</p>

    <h3>🌡️ Nhiệt độ kinh hoàng</h3>
    <p>Lõi mặt trời có nhiệt độ khoảng 15 triệu độ C! Bề mặt "chỉ" khoảng 5.500 độ C - vẫn đủ nóng để làm tan chảy mọi thứ trên Trái Đất!</p>

    <p><strong>So sánh thú vị:</strong> Nếu mặt trời có kích thước quả bóng đá, Trái Đất sẽ chỉ bằng hạt tiêu! 🌍</p>`,
    reflection: 'Giải thích tại sao mặt trời có thể duy trì nhiệt độ cao trong hàng tỷ năm? Và vì sao phản ứng hạt nhân trong mặt trời khác với bom nguyên tử?'
  },
  'Tại sao có gió?': {
    title: '💨 Tại sao có gió?',
    content: `<p>Chào bạn! Visao sẽ giải thích tại sao có gió nhé! 💨</p>
    
    <h3>🌡️ Không khí nóng và lạnh</h3>
    <p>Gió xuất hiện vì không khí nóng và lạnh có tính chất khác nhau. Không khí nóng nhẹ hơn, không khí lạnh nặng hơn!</p>

    <h3>⬆️ Không khí nóng bay lên</h3>
    <p>Khi mặt trời làm nóng mặt đất, không khí ở đó cũng nóng lên và bay lên cao. Điều này tạo ra một "khoảng trống".</p>

    <h3>➡️ Không khí lạnh lao vào</h3>
    <p>Không khí lạnh từ những nơi khác sẽ lao vào để lấp đầy khoảng trống đó. Sự di chuyển này chính là gió!</p>

    <p><strong>Ví dụ đơn giản:</strong> Như khi bạn mở cửa tủ lạnh, không khí lạnh sẽ "chảy" ra ngoài vậy! ❄️</p>`,
    reflection: 'Tại sao gió biển thường mạnh vào ban ngày và yếu vào ban đêm? Giải thích sự khác biệt về nhiệt độ giữa đất liền và mặt nước.'
  },
  'Tại sao có ngày và đêm?': {
    title: '🌍 Tại sao có ngày và đêm?',
    content: `<p>Chào bạn! Visao sẽ giải thích tại sao có ngày và đêm nhé! 🌍</p>
    
    <h3>🔄 Trái Đất tự quay quanh trục</h3>
    <p>Trái Đất của chúng ta không đứng yên! Nó liên tục quay quanh một trục tưởng tượng từ Bắc Cực đến Nam Cực. Một vòng quay hoàn chỉnh mất 24 giờ.</p>

    <h3>☀️ Mặt trời chiếu sáng một nửa</h3>
    <p>Mặt trời chiếu sáng rất mạnh, nhưng nó chỉ có thể chiếu sáng một nửa Trái Đất tại một thời điểm. Nửa được chiếu sáng là ban ngày, nửa còn lại là ban đêm!</p>

    <h3>🌅 Sự chuyển đổi liên tục</h3>
    <p>Khi Trái Đất quay, nơi bạn đang đứng sẽ lần lượt đi từ ban ngày sang ban đêm và ngược lại. Đó là lý do tại sao có bình minh và hoàng hôn!</p>

    <h3>🌍 Không phải nơi nào cũng giống nhau</h3>
    <p>Ở xích đạo, ngày và đêm gần như bằng nhau quanh năm. Nhưng ở Bắc Cực và Nam Cực, có thể có 6 tháng liên tục là ngày hoặc đêm!</p>

    <p><strong>Thí nghiệm thú vị:</strong> Bạn có thể dùng quả cam và đèn pin để mô phỏng hiện tượng này! 🍊</p>`,
    reflection: 'Tại sao ở các vĩ độ khác nhau, độ dài ngày và đêm lại khác nhau? Và vì sao có hiện tượng "ngày cực" và "đêm cực" ở Bắc Cực và Nam Cực?'
  },
  'Vì sao mưa rơi từ trên xuống?': {
    title: '🌧️ Vì sao mưa rơi từ trên xuống?',
    content: `<p>Chào bạn! Visao sẽ giải thích tại sao mưa lại rơi từ trên xuống nhé! 🌧️</p>
    
    <h3>🌪️ Quá trình hình thành mưa</h3>
    <p>Mưa bắt đầu từ hơi nước trong không khí. Khi hơi nước gặp lạnh, nó ngưng tụ thành những giọt nước nhỏ li ti, tạo thành mây.</p>

    <h3>💧 Giọt nước lớn dần</h3>
    <p>Trong mây, các giọt nước nhỏ liên tục va chạm và kết hợp với nhau. Khi giọt nước đủ lớn và nặng, nó không thể "bay" trong không khí nữa.</p>

    <h3>⬇️ Trọng lực kéo xuống</h3>
    <p>Trọng lực của Trái Đất sẽ kéo những giọt nước nặng này xuống dưới. Đó chính là mưa! Giống như khi bạn thả một viên bi, nó sẽ rơi xuống vậy.</p>

    <h3>🌊 Tại sao không rơi ngang?</h3>
    <p>Mặc dù có gió thổi ngang, nhưng lực hút của Trái Đất mạnh hơn nhiều so với lực đẩy của gió. Vì vậy mưa vẫn rơi xuống dưới!</p>

    <p><strong>Thí nghiệm thú vị:</strong> Bạn có thể quan sát hiện tượng tương tự khi nhỏ nước từ ống hút xuống ly! 💧</p>`,
    reflection: 'Tại sao có những lúc mưa rơi xiên thay vì thẳng xuống? Và vì sao có những loại mưa khác nhau như mưa phùn, mưa rào?'
  },
  'Tại sao chim bay được?': {
    title: '🦅 Tại sao chim bay được?',
    content: `<p>Chào bạn! Visao sẽ giải thích tại sao chim lại bay được nhé! 🦅</p>
    
    <h3>🦋 Cấu trúc cơ thể đặc biệt</h3>
    <p>Chim có cấu trúc cơ thể được thiết kế hoàn hảo cho việc bay. Xương của chúng rỗng và nhẹ, giúp giảm trọng lượng cơ thể.</p>

    <h3>🪶 Bộ lông vũ kỳ diệu</h3>
    <p>Lông vũ của chim có cấu trúc đặc biệt với các sợi lông nhỏ móc vào nhau, tạo thành bề mặt mượt mà và chắc chắn. Điều này giúp tạo ra lực nâng khi bay.</p>

    <h3>💪 Cơ ngực mạnh mẽ</h3>
    <p>Chim có cơ ngực rất phát triển, chiếm đến 30% trọng lượng cơ thể! Những cơ này giúp chim đập cánh mạnh mẽ để tạo ra lực đẩy.</p>

    <h3>🌬️ Nguyên lý khí động học</h3>
    <p>Khi chim đập cánh, không khí chảy qua cánh tạo ra lực nâng (giống như máy bay). Hình dạng cánh cong giúp tối ưu hóa lực nâng này.</p>

    <h3>🎯 Các kỹ thuật bay khác nhau</h3>
    <p>Chim sử dụng nhiều kỹ thuật bay khác nhau: đập cánh liên tục, lượn theo gió, bay theo đàn để tiết kiệm năng lượng.</p>

    <p><strong>Thí nghiệm thú vị:</strong> Bạn có thể thử làm máy bay giấy để hiểu nguyên lý bay! ✈️</p>`,
    reflection: 'Tại sao một số loài chim có thể bay rất cao và xa, trong khi một số loài chỉ bay được quãng ngắn? Và vì sao chim di cư có thể bay hàng nghìn km?'
  }
}; 