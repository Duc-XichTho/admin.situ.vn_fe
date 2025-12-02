# Test Embedding Feature với OpenAI

## Tổng quan
Hệ thống embedding đã được nâng cấp để sử dụng OpenAI's `text-embedding-3-small` model với cấu trúc chunking mới. Dữ liệu được lưu trong bảng `embedingData` thay vì trường `vector_detail`.

## Cấu hình cần thiết

### 1. Environment Variables
```env
OPENAI_API_KEY=your_openai_api_key
```

### 2. Database Setup
```sql
-- Tạo bảng embedingData nếu chưa có
CREATE TABLE IF NOT EXISTS embedingData (
    id SERIAL PRIMARY KEY,
    k9Id INTEGER NOT NULL REFERENCES k9(id),
    type VARCHAR NOT NULL DEFAULT 'detail',
    chunkIndex INTEGER NOT NULL DEFAULT 0,
    chunkText TEXT NOT NULL,
    chunkVector JSONB NOT NULL,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

-- Tạo indexes
CREATE INDEX IF NOT EXISTS idx_embedingdata_k9id ON embedingData(k9Id);
CREATE INDEX IF NOT EXISTS idx_embedingdata_k9id_chunkindex ON embedingData(k9Id, chunkIndex);
CREATE INDEX IF NOT EXISTS idx_embedingdata_type ON embedingData(type);
```

## Test Cases

### 1. Test Embedding Creation

#### 1.1 Tạo embedding cho một K9
```bash
curl -X POST http://localhost:3000/api/k9/embed/1 \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Sample K9",
    "chunksCreated": 3,
    "embeddingResults": [
      {
        "chunkIndex": 0,
        "textLength": 950,
        "embeddingLength": 1536
      }
    ]
  },
  "message": "Embedding completed for K9 ID 1"
}
```

#### 1.2 Tạo embedding cho tất cả K9
```bash
curl -X POST http://localhost:3000/api/k9/embed-all \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Sample K9 1",
      "chunksCreated": 2
    },
    {
      "id": 2,
      "title": "Sample K9 2",
      "chunksCreated": 3
    }
  ],
  "message": "Bulk embedding completed successfully"
}
```

### 2. Test Vector Search

#### 2.1 Tìm kiếm với text query
```bash
curl -X POST http://localhost:3000/api/k9/search/vector \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Khái niệm và nguồn gốc của JTBD",
    "limit": 5,
    "threshold": 0.3
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "query": "Khái niệm và nguồn gốc của JTBD",
    "results": [
      {
        "k9Id": 123,
        "title": "Job To Be Done Framework",
        "type": "library",
        "category": "business",
        "bestSimilarity": 0.85,
        "chunks": [
          {
            "chunkIndex": 0,
            "chunkText": "Nội dung chunk tương đồng...",
            "similarity": 0.85
          }
        ]
      }
    ],
    "totalFound": 3,
    "totalProcessed": 150,
    "topSimilarities": [...]
  },
  "message": "Vector search completed successfully"
}
```

#### 2.2 Chuyển đổi text thành vector
```bash
curl -X POST http://localhost:3000/api/k9/convert-to-vector \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Khái niệm và nguồn gốc của JTBD"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "vector": [0.1, 0.2, 0.3, ...]
  },
  "message": "Text converted to vector successfully"
}
```

#### 2.3 Tìm kiếm với pre-converted vector
```bash
curl -X POST http://localhost:3000/api/k9/search/pre-converted-vector \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, 0.3, ...],
    "limit": 5,
    "threshold": 0.3
  }'
```

### 3. Test Embedding Statistics

```bash
curl -X GET http://localhost:3000/api/k9/stats/embedding
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "embedded": 85,
    "nonEmbedded": 15,
    "totalChunks": 250,
    "embeddingRate": "85.00"
  },
  "message": "Embedding statistics retrieved successfully"
}
```

## Test Frontend Features

### 1. Test AI Chat Tab với Embedding Search

#### 1.1 Bật embedding search
1. Mở AI Chat tab
2. Bật switch "📚 Kho dữ liệu"
3. Gửi câu hỏi: "Khái niệm và nguồn gốc của JTBD"

**Expected Behavior:**
- Switch hiển thị "🔍 Đang tìm kiếm..." trong quá trình tìm kiếm
- Kết quả embedding được hiển thị trong message
- Thông tin chunks được hiển thị
- Có thể click để xem chi tiết

#### 1.2 Test embedding detail modal
1. Click vào một kết quả embedding
2. Modal hiển thị thông tin chi tiết
3. Kiểm tra hiển thị chunks với similarity scores

**Expected Behavior:**
- Modal hiển thị đầy đủ thông tin K9
- Chunks được hiển thị với similarity scores
- Responsive design trên mobile

#### 1.3 Test multiple search attempts
1. Gửi câu hỏi phức tạp: "Phân tích tác động của AI đến thị trường tài chính"
2. Kiểm tra log để xem các phương pháp tìm kiếm

**Expected Behavior:**
- Hệ thống thử nhiều cách tìm kiếm khác nhau
- Log hiển thị: "Priority keywords", "All keywords", "Original query"
- Kết quả tốt nhất được chọn

### 2. Test Error Handling

#### 2.1 Test khi không có embedding results
1. Gửi câu hỏi không liên quan: "Cách nấu phở"
2. Kiểm tra thông báo "Không tìm thấy thông tin liên quan"

#### 2.2 Test khi OpenAI API lỗi
1. Tắt internet hoặc sử dụng API key sai
2. Kiểm tra error handling và fallback

### 3. Test Performance

#### 3.1 Test với large datasets
1. Tạo nhiều K9 records với content dài
2. Test embedding creation time
3. Test search response time

#### 3.2 Test memory usage
1. Monitor memory usage khi tạo embedding
2. Kiểm tra chunking strategy có hoạt động đúng

## Test Database Integration

### 1. Kiểm tra bảng embedingData
```sql
-- Kiểm tra dữ liệu embedding
SELECT 
    k9Id,
    COUNT(*) as chunk_count,
    AVG(array_length(chunkVector, 1)) as avg_vector_length
FROM embedingData 
GROUP BY k9Id 
ORDER BY chunk_count DESC;
```

### 2. Kiểm tra relationships
```sql
-- Kiểm tra foreign key constraints
SELECT 
    k.id as k9_id,
    k.title,
    COUNT(e.id) as embedding_count
FROM k9 k
LEFT JOIN embedingData e ON k.id = e.k9Id
WHERE k.show = true
GROUP BY k.id, k.title
ORDER BY embedding_count DESC;
```

### 3. Kiểm tra indexes
```sql
-- Kiểm tra performance của indexes
EXPLAIN ANALYZE 
SELECT * FROM embedingData 
WHERE k9Id = 1 
ORDER BY chunkIndex;
```

## Test Monitoring và Logs

### 1. Kiểm tra console logs
```javascript
// Backend logs
console.log('🔍 Original query:', query);
console.log('🔍 Extracted keywords:', keywords);
console.log('📊 Found results:', results.length);
console.log('✅ Embedding completed for K9 ID:', k9Id);

// Frontend logs
console.log('🔍 Embedding search started');
console.log('📚 Found embedding context');
console.log('❌ No embedding results found');
```

### 2. Kiểm tra error logs
```javascript
// Error handling
console.error('❌ Embedding search error:', error);
console.error('❌ Error fetching K9 detail:', error);
```

## Test Mobile Responsiveness

### 1. Test trên mobile devices
1. Mở AI Chat tab trên mobile
2. Test embedding search switch
3. Test embedding results display
4. Test embedding detail modal

### 2. Test responsive design
1. Resize browser window
2. Kiểm tra layout adaptation
3. Test touch interactions

## Performance Benchmarks

### 1. Embedding Creation
- **Target**: < 5 seconds per K9 record
- **Chunking**: Max 1000 chars per chunk
- **Overlap**: 100 chars between chunks

### 2. Search Performance
- **Target**: < 2 seconds for search response
- **Threshold**: 0.3 for relevance
- **Limit**: 5 results for chat context

### 3. Memory Usage
- **Target**: < 500MB for embedding service
- **Chunking**: Prevents memory overflow
- **Batch processing**: For large datasets

## Security Tests

### 1. API Key Security
- Kiểm tra `OPENAI_API_KEY` không bị expose
- Test với invalid API key
- Test rate limiting

### 2. Input Validation
- Test với malicious input
- Test SQL injection prevention
- Test XSS prevention

## Troubleshooting Guide

### 1. OpenAI API Issues
```bash
# Kiểm tra API key
echo $OPENAI_API_KEY

# Test API connection
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

### 2. Database Issues
```sql
-- Kiểm tra bảng embedingData
SELECT COUNT(*) FROM embedingData;

-- Kiểm tra relationships
SELECT COUNT(*) FROM k9 k 
JOIN embedingData e ON k.id = e.k9Id;
```

### 3. Frontend Issues
```javascript
// Kiểm tra network requests
console.log('API calls:', networkRequests);

// Kiểm tra state management
console.log('Embedding state:', embeddingState);
```

## Success Criteria

### ✅ Embedding Creation
- [ ] Tạo embedding thành công cho K9 records
- [ ] Chunking strategy hoạt động đúng
- [ ] Database relationships được thiết lập

### ✅ Vector Search
- [ ] Tìm kiếm trả về kết quả chính xác
- [ ] Multiple search attempts hoạt động
- [ ] Fallback mechanism hoạt động

### ✅ Frontend Integration
- [ ] Embedding search switch hoạt động
- [ ] Results display đúng format
- [ ] Detail modal hiển thị đầy đủ

### ✅ Performance
- [ ] Response time < 2 seconds
- [ ] Memory usage < 500MB
- [ ] Mobile responsive

### ✅ Error Handling
- [ ] Graceful error handling
- [ ] User-friendly error messages
- [ ] Fallback mechanisms

## Notes

1. **OpenAI API Costs**: Monitor usage và costs
2. **Database Size**: Monitor growth của bảng embedingData
3. **Performance**: Monitor search performance với large datasets
4. **User Experience**: Collect feedback về embedding search quality 
 