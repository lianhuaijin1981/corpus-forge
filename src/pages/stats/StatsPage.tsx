import { Typography, Card, Row, Col, Statistic, Progress } from 'antd'
import {
  DatabaseOutlined,
  EditOutlined,
  AuditOutlined,
  UserOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'

const { Title, Text } = Typography

// 语料增长趋势（Mock）
const growthOption = {
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
  yAxis: { type: 'value' },
  series: [{ data: [120, 200, 350, 480, 620, 800], type: 'line', smooth: true, areaStyle: {} }],
  grid: { left: 40, right: 20, bottom: 30 },
}

// 语料类型分布
const typeOption = {
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    data: [
      { value: 580, name: '文本' },
      { value: 210, name: '音频' },
      { value: 95, name: '视频' },
      { value: 115, name: '图片' },
    ],
  }],
}

export default function StatsPage() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>统计分析</Title>

      {/* 核心指标 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small"><Statistic title="语料总量" value={1000} prefix={<DatabaseOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="标注任务" value={24} prefix={<EditOutlined />} valueStyle={{ color: '#1677ff' }} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="待审核" value={18} prefix={<AuditOutlined />} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="活跃用户" value={56} prefix={<UserOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
      </Row>

      {/* 图表 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={14}>
          <Card size="small" title="语料增长趋势">
            <ReactECharts option={growthOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col span={10}>
          <Card size="small" title="语料类型分布">
            <ReactECharts option={typeOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      {/* 标注统计 */}
      <Card size="small" title="标注统计">
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small" style={{ background: '#f6ffed' }}>
              <Statistic title="已完成标注" value={2458} suffix="/ 3000" />
              <Progress percent={82} strokeColor="#52c41a" size="small" />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ background: '#e6f4ff' }}>
              <Statistic title="平均标注时长" value={3.2} suffix="分钟/条" />
              <Text type="secondary" style={{ fontSize: 12 }}>较上月 -0.5min</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ background: '#fffbe6' }}>
              <Statistic title="通过率" value={91.5} suffix="%" />
              <Text type="secondary" style={{ fontSize: 12 }}>较上月 +2.3%</Text>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}
