import { useMemo } from 'react'
import { Typography, Card, Row, Col, Statistic, Progress, Button, Tooltip, Space, Tag } from 'antd'
import {
  DatabaseOutlined,
  EditOutlined,
  AuditOutlined,
  UserOutlined,
  DownloadOutlined,
  SyncOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { useCorpusStore } from '../../stores/corpusStore'
import { useAnnotationStore } from '../../stores/annotationStore'
import { useAuthStore } from '../../stores/authStore'
import { useReviewStore } from '../../stores/reviewStore'

const { Title, Text } = Typography

// ============ 导出工具 ============

function exportStatsReport(data: object) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `CorpusForge统计报告_${dayjs().format('YYYYMMDD_HHmmss')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ============ 主组件 ============

export default function StatsPage() {
  const { corpusList } = useCorpusStore()
  const { tasks } = useAnnotationStore()
  const { users } = useAuthStore()
  const { reviews } = useReviewStore()

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  // ---- 语料统计 ----
  const corpusStats = useMemo(() => {
    const byStatus: Record<string, number> = {}
    const byType: Record<string, number> = {}
    const byLanguage: Record<string, number> = {}
    const byLibrary: Record<string, number> = {}

    corpusList.forEach(c => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1
      byType[c.type] = (byType[c.type] || 0) + 1
      const lang = c.metadata?.language || '未知'
      byLanguage[lang] = (byLanguage[lang] || 0) + 1
      if (c.libraryId) byLibrary[c.libraryId] = (byLibrary[c.libraryId] || 0) + 1
    })

    const pendingReview = byStatus['pending_review'] || 0
    const approved = byStatus['approved'] || 0

    return { total: corpusList.length, byStatus, byType, byLanguage, byLibrary, pendingReview, approved }
  }, [corpusList])

  // ---- 标注统计 ----
  const annotationStats = useMemo(() => {
    const byStatus: Record<string, number> = {}
    let totalCorpus = 0
    let totalCompleted = 0

    tasks.forEach(t => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1
      totalCorpus += t.statistics.total
      totalCompleted += t.statistics.completed
    })

    const completionRate = totalCorpus > 0 ? Math.round((totalCompleted / totalCorpus) * 100) : 0

    return {
      total: tasks.length,
      completed: byStatus['completed'] || 0,
      inProgress: byStatus['in_progress'] || 0,
      pending: byStatus['pending'] || 0,
      totalCorpus,
      totalCompleted,
      completionRate,
    }
  }, [tasks])

  // ---- 用户统计 ----
  const userStats = useMemo(() => {
    const active = users.filter(u => u.status === 'active').length
    const byRole: Record<string, number> = {}
    users.forEach(u => u.roles.forEach(r => { byRole[r] = (byRole[r] || 0) + 1 }))
    return { total: users.length, active, byRole }
  }, [users])

  // ---- 审核统计 ----
  const reviewStats = useMemo(() => {
    const approved = reviews.filter(r => r.result === 'approved').length
    const rejected = reviews.filter(r => r.result === 'rejected').length
    const pending = reviews.filter(r => r.status === 'pending').length
    const total = reviews.length
    return { total, approved, rejected, pending, passRate: total > 0 ? Math.round((approved / total) * 100) : 0 }
  }, [reviews])

  // ---- 增长趋势（按月统计语料创建量） ----
  const growthTrendOption = useMemo(() => {
    const monthCount: Record<string, number> = {}
    corpusList.forEach(c => {
      const month = dayjs(c.createdAt).format('YYYY-MM')
      monthCount[month] = (monthCount[month] || 0) + 1
    })

    // 取最近12个月
    const months: string[] = []
    for (let i = 11; i >= 0; i--) {
      months.push(dayjs().subtract(i, 'month').format('YYYY-MM'))
    }

    const values = months.map(m => monthCount[m] || 0)
    // 累计值
    const cumulative: number[] = []
    let sum = 0
    // 先算历史累计（months[0]之前的量）
    corpusList.forEach(c => {
      const month = dayjs(c.createdAt).format('YYYY-MM')
      if (month < months[0]) sum++
    })
    values.forEach(v => {
      sum += v
      cumulative.push(sum)
    })

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { data: ['新增语料', '累计语料'], bottom: 0 },
      xAxis: {
        type: 'category',
        data: months.map(m => m.slice(5)), // 只显示 MM 月
        axisLabel: { fontSize: 11 },
      },
      yAxis: [
        { type: 'value', name: '新增', minInterval: 1, nameTextStyle: { fontSize: 10 } },
        { type: 'value', name: '累计', minInterval: 1, nameTextStyle: { fontSize: 10 } },
      ],
      series: [
        {
          name: '新增语料',
          type: 'bar',
          data: values,
          itemStyle: { color: '#1677ff' },
          barWidth: 16,
          label: { show: true, position: 'top', fontSize: 10, formatter: (p: any) => p.value > 0 ? p.value : '' },
        },
        {
          name: '累计语料',
          type: 'line',
          yAxisIndex: 1,
          data: cumulative,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          itemStyle: { color: '#52c41a' },
          lineStyle: { width: 2 },
        },
      ],
      grid: { left: 40, right: 50, top: 20, bottom: 40 },
    }
  }, [corpusList])

  // ---- 语料类型分布（饼图） ----
  const typeChartOption = useMemo(() => {
    const typeNameMap: Record<string, string> = {
      text: '文本', audio: '音频', video: '视频', image: '图片',
    }
    const typeColorMap: Record<string, string> = {
      text: '#1677ff', audio: '#52c41a', video: '#722ed1', image: '#fa8c16',
    }
    const data = Object.entries(corpusStats.byType).map(([k, v]) => ({
      name: typeNameMap[k] || k,
      value: v,
      itemStyle: { color: typeColorMap[k] || '#8c8c8c' },
    }))
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: data.length > 0 ? data : [{ name: '暂无数据', value: 0 }],
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } },
        label: { formatter: '{b}\n{d}%' },
      }],
    }
  }, [corpusStats.byType])

  // ---- 语料状态分布（柱图） ----
  const statusChartOption = useMemo(() => {
    const statusNameMap: Record<string, string> = {
      draft: '草稿', pending_review: '待审核', approved: '已通过',
      rejected: '已拒绝', archived: '已归档',
    }
    const statusColorMap: Record<string, string> = {
      draft: '#8c8c8c', pending_review: '#fa8c16', approved: '#52c41a',
      rejected: '#ff4d4f', archived: '#bfbfbf',
    }
    const entries = Object.entries(corpusStats.byStatus)
    return {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: entries.map(([k]) => statusNameMap[k] || k),
        axisLabel: { fontSize: 12 },
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        type: 'bar',
        data: entries.map(([k, v]) => ({ value: v, itemStyle: { color: statusColorMap[k] || '#1677ff' } })),
        barWidth: 40,
        label: { show: true, position: 'top' },
      }],
      grid: { left: 40, right: 20, bottom: 40 },
    }
  }, [corpusStats.byStatus])

  // ---- 语言分布（横向柱图） ----
  const langChartOption = useMemo(() => {
    const sorted = Object.entries(corpusStats.byLanguage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'value', minInterval: 1 },
      yAxis: { type: 'category', data: sorted.map(([k]) => k) },
      series: [{
        type: 'bar',
        data: sorted.map(([_, v]) => v),
        itemStyle: { color: '#1677ff' },
        label: { show: true, position: 'right' },
      }],
      grid: { left: 70, right: 40, top: 10, bottom: 30 },
    }
  }, [corpusStats.byLanguage])

  // ---- 标注任务状态（饼图） ----
  const taskStatusOption = useMemo(() => {
    const statusNameMap: Record<string, string> = {
      pending: '待开始', in_progress: '进行中', paused: '已暂停',
      completed: '已完成', stopped: '已停止',
    }
    const statusColorMap: Record<string, string> = {
      pending: '#faad14', in_progress: '#1677ff', paused: '#fa8c16',
      completed: '#52c41a', stopped: '#ff4d4f',
    }
    const byStatus: Record<string, number> = {}
    tasks.forEach(t => { byStatus[t.status] = (byStatus[t.status] || 0) + 1 })
    const data = Object.entries(byStatus).map(([k, v]) => ({
      name: statusNameMap[k] || k,
      value: v,
      itemStyle: { color: statusColorMap[k] || '#8c8c8c' },
    }))
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: '65%',
        data: data.length > 0 ? data : [{ name: '暂无任务', value: 0 }],
      }],
    }
  }, [tasks])

  // ---- 标注任务完成率横向柱图 ----
  const taskProgressOption = useMemo(() => {
    const sorted = [...tasks]
      .filter(t => t.statistics.total > 0)
      .sort((a, b) => {
        const ra = b.statistics.completed / b.statistics.total
        const rb = a.statistics.completed / a.statistics.total
        return ra - rb
      })
      .slice(0, 8)

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          const p = params[0]
          return `${p.name}<br/>完成率：${p.value}%`
        },
      },
      xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
      yAxis: {
        type: 'category',
        data: sorted.map(t => t.name.length > 10 ? t.name.slice(0, 10) + '…' : t.name),
        axisLabel: { fontSize: 11 },
      },
      series: [{
        type: 'bar',
        data: sorted.map(t => ({
          value: Math.round((t.statistics.completed / t.statistics.total) * 100),
          itemStyle: {
            color: t.statistics.completed === t.statistics.total ? '#52c41a' : '#1677ff',
          },
        })),
        label: { show: true, position: 'right', formatter: '{c}%' },
        barWidth: 16,
      }],
      grid: { left: 120, right: 60, top: 10, bottom: 30 },
    }
  }, [tasks])

  // ---- 完整报告数据 ----
  const fullReportData = useMemo(() => ({
    generatedAt: now,
    corpus: corpusStats,
    annotation: annotationStats,
    users: userStats,
    review: reviewStats,
  }), [corpusStats, annotationStats, userStats, reviewStats, now])

  return (
    <div>
      {/* 标题行 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>统计分析</Title>
        <Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <SyncOutlined style={{ marginRight: 4 }} />
            数据更新时间：{now}
          </Text>
          <Tooltip title="下载 JSON 格式统计报告">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => exportStatsReport(fullReportData)}
            >
              导出报告
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* 核心指标 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small" hoverable>
            <Statistic
              title="语料总量"
              value={corpusStats.total}
              prefix={<DatabaseOutlined />}
            />
            <div style={{ marginTop: 4 }}>
              <Tag color="success">已通过 {corpusStats.approved}</Tag>
              <Tag color="warning">待审核 {corpusStats.pendingReview}</Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" hoverable>
            <Statistic
              title="标注任务"
              value={annotationStats.total}
              prefix={<EditOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
            <div style={{ marginTop: 4 }}>
              <Tag color="processing">进行中 {annotationStats.inProgress}</Tag>
              <Tag color="success">已完成 {annotationStats.completed}</Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" hoverable>
            <Statistic
              title="审核中心"
              value={reviewStats.pending}
              suffix="待处理"
              prefix={<AuditOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 4 }}>
              <Tag color="success">通过率 {reviewStats.passRate}%</Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" hoverable>
            <Statistic
              title="活跃用户"
              value={userStats.active}
              suffix={`/ ${userStats.total}`}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {userStats.total > 0 ? Math.round((userStats.active / userStats.total) * 100) : 0}% 活跃率
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 标注完成率快览 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small" style={{ background: '#f6ffed' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />
              <div>
                <Text type="secondary">标注完成率</Text>
                <div>
                  <Text strong style={{ fontSize: 22, color: '#52c41a' }}>{annotationStats.completionRate}%</Text>
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                    ({annotationStats.totalCompleted}/{annotationStats.totalCorpus})
                  </Text>
                </div>
              </div>
            </div>
            <Progress
              percent={annotationStats.completionRate}
              strokeColor="#52c41a"
              size="small"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ background: '#e6f4ff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <RiseOutlined style={{ fontSize: 32, color: '#1677ff' }} />
              <div>
                <Text type="secondary">语料通过率</Text>
                <div>
                  <Text strong style={{ fontSize: 22, color: '#1677ff' }}>
                    {corpusStats.total > 0 ? Math.round((corpusStats.approved / corpusStats.total) * 100) : 0}%
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                    ({corpusStats.approved}/{corpusStats.total})
                  </Text>
                </div>
              </div>
            </div>
            <Progress
              percent={corpusStats.total > 0 ? Math.round((corpusStats.approved / corpusStats.total) * 100) : 0}
              strokeColor="#1677ff"
              size="small"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ background: '#fffbe6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ClockCircleOutlined style={{ fontSize: 32, color: '#faad14' }} />
              <div>
                <Text type="secondary">审核通过率</Text>
                <div>
                  <Text strong style={{ fontSize: 22, color: '#faad14' }}>{reviewStats.passRate}%</Text>
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                    ({reviewStats.approved}/{reviewStats.total})
                  </Text>
                </div>
              </div>
            </div>
            <Progress
              percent={reviewStats.passRate}
              strokeColor="#faad14"
              size="small"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 语料增长趋势 */}
      <Card size="small" title="语料增长趋势（近12个月）" style={{ marginBottom: 24 }}>
        <ReactECharts option={growthTrendOption} style={{ height: 240 }} />
      </Card>

      {/* 语料状态分布 + 类型分布 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={14}>
          <Card size="small" title="语料状态分布">
            <ReactECharts option={statusChartOption} style={{ height: 260 }} />
          </Card>
        </Col>
        <Col span={10}>
          <Card size="small" title="语料类型分布">
            <ReactECharts option={typeChartOption} style={{ height: 260 }} />
          </Card>
        </Col>
      </Row>

      {/* 语言分布 + 标注任务 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card size="small" title="语言分布（Top 8）">
            <ReactECharts option={langChartOption} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="标注任务状态">
            <ReactECharts option={taskStatusOption} style={{ height: 220 }} />
          </Card>
        </Col>
      </Row>

      {/* 标注任务完成率排行 */}
      {tasks.length > 0 && (
        <Card size="small" title="标注任务完成率排行" style={{ marginBottom: 24 }}>
          <ReactECharts option={taskProgressOption} style={{ height: 220 }} />
        </Card>
      )}
    </div>
  )
}
