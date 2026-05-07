import { Typography, Input, Card, Space, Tag, Button, Empty } from 'antd'
import { SearchOutlined, HistoryOutlined, StarOutlined } from '@ant-design/icons'
import { useState } from 'react'

const { Title, Text } = Typography

// Mock 搜索历史
const mockHistory = [
  { id: 'h-001', keyword: '客服对话', resultCount: 156, createdAt: '2024-03-20' },
  { id: 'h-002', keyword: '情感分析', resultCount: 89, createdAt: '2024-03-18' },
  { id: 'h-003', keyword: 'NER标注', resultCount: 234, createdAt: '2024-03-15' },
]

// Mock 收藏夹
const mockFavorites = [
  { id: 'f-001', corpusTitle: '客服对话语料-产品咨询', folderName: '默认收藏夹' },
  { id: 'f-002', corpusTitle: '意图识别语料-NLU', folderName: 'NLU相关' },
]

export default function SearchPage() {
  const [keyword, setKeyword] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSearch = () => {
    if (keyword.trim()) setSearched(true)
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>语料检索</Title>

      {/* 搜索栏 */}
      <Card size="small" style={{ marginBottom: 24 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            size="large"
            placeholder="输入关键词搜索语料..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Button size="large" type="primary" onClick={handleSearch}>
            搜索
          </Button>
        </Space.Compact>
      </Card>

      {!searched ? (
        <div>
          {/* 搜索历史 */}
          <Card size="small" title="搜索历史" style={{ marginBottom: 16 }}
            extra={<Button type="link" size="small">清空</Button>}
          >
            {mockHistory.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : (
              mockHistory.map(h => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Space>
                    <HistoryOutlined />
                    <Text style={{ cursor: 'pointer' }}>{h.keyword}</Text>
                  </Space>
                  <Text type="secondary">{h.resultCount} 条结果</Text>
                </div>
              ))
            )}
          </Card>

          {/* 我的收藏 */}
          <Card size="small" title="我的收藏">
            {mockFavorites.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : (
              mockFavorites.map(f => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Space>
                    <StarOutlined style={{ color: '#faad14' }} />
                    <Text>{f.corpusTitle}</Text>
                  </Space>
                  <Tag>{f.folderName}</Tag>
                </div>
              ))
            )}
          </Card>
        </div>
      ) : (
        <Card>
          <Empty description={`未找到与"${keyword}"相关的语料`} />
        </Card>
      )}
    </div>
  )
}
