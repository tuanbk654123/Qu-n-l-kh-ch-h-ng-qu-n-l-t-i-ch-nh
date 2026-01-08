import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Select, DatePicker } from 'antd';
import {
  UserOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import axios from 'axios';
import moment from 'moment';
import './index.css';

const { Option } = Select;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalBusinesses: 0,
    totalTasks: 0,
    totalRevenue: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [timeRange, setTimeRange] = useState('month');
  const [selectedDate, setSelectedDate] = useState(moment('2024-01', 'YYYY-MM'));

  useEffect(() => {
    fetchStats();
    fetchTransactions();
  }, [timeRange, selectedDate]);

  const fetchStats = async () => {
    try {
      const [customersRes, businessesRes, tasksRes, transactionsRes] = await Promise.all([
        axios.get('/api/customers', { params: { page: 1 } }),
        axios.get('/api/businesses', { params: { page: 1 } }),
        axios.get('/api/tasks', { params: { page: 1 } }),
        axios.get('/api/transactions/summary'),
      ]);

      setStats({
        totalCustomers: customersRes.data.customerCount,
        totalBusinesses: businessesRes.data.businessCount,
        totalTasks: tasksRes.data.taskCount,
        totalRevenue: transactionsRes.data.totalRevenue,
      });
    } catch (error) {
      console.error('Lỗi khi tải thống kê:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/transactions', {
        params: { page: 1, pageSize: 1000 },
      });
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Lỗi khi tải giao dịch:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getChartData = () => {
    let filteredTransactions = [...transactions];

    if (timeRange === 'month') {
      const startOfMonth = selectedDate.clone().startOf('month').format('YYYY-MM-DD');
      const endOfMonth = selectedDate.clone().endOf('month').format('YYYY-MM-DD');
      filteredTransactions = filteredTransactions.filter(
        (t) => t.date >= startOfMonth && t.date <= endOfMonth
      );
    } else if (timeRange === 'quarter') {
      const quarter = Math.floor(selectedDate.month() / 3);
      const startOfQuarter = selectedDate.clone().startOf('year').add(quarter * 3, 'months').format('YYYY-MM-DD');
      const endOfQuarter = selectedDate.clone().startOf('year').add(quarter * 3 + 2, 'months').endOf('month').format('YYYY-MM-DD');
      filteredTransactions = filteredTransactions.filter(
        (t) => t.date >= startOfQuarter && t.date <= endOfQuarter
      );
    } else if (timeRange === 'year') {
      const startOfYear = selectedDate.clone().startOf('year').format('YYYY-MM-DD');
      const endOfYear = selectedDate.clone().endOf('year').format('YYYY-MM-DD');
      filteredTransactions = filteredTransactions.filter(
        (t) => t.date >= startOfYear && t.date <= endOfYear
      );
    }

    const categoryData = {};
    filteredTransactions.forEach((t) => {
      if (t.status === 'completed') {
        if (!categoryData[t.category]) {
          categoryData[t.category] = { revenue: 0, expense: 0 };
        }
        if (t.type === 'revenue') {
          categoryData[t.category].revenue += t.amount;
        } else {
          categoryData[t.category].expense += t.amount;
        }
      }
    });

    const pieData = Object.keys(categoryData).map((category) => ({
      name: category,
      value: categoryData[category].revenue + categoryData[category].expense,
      revenue: categoryData[category].revenue,
      expense: categoryData[category].expense,
    }));

    let barData = [];
    if (timeRange === 'month') {
      const daysInMonth = selectedDate.daysInMonth();
      barData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dateStr = selectedDate.clone().date(day).format('YYYY-MM-DD');
        const dayTransactions = filteredTransactions.filter((t) => t.date === dateStr);
        const revenue = dayTransactions
          .filter((t) => t.type === 'revenue' && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = dayTransactions
          .filter((t) => t.type === 'expense' && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          name: `Ngày ${day}`,
          date: dateStr,
          Thu: revenue,
          Chi: expense,
        };
      });
    } else if (timeRange === 'quarter') {
      const quarter = Math.floor(selectedDate.month() / 3);
      barData = [0, 1, 2].map((monthOffset) => {
        const month = quarter * 3 + monthOffset;
        const monthMoment = selectedDate.clone().month(month);
        const startOfMonth = monthMoment.startOf('month').format('YYYY-MM-DD');
        const endOfMonth = monthMoment.endOf('month').format('YYYY-MM-DD');
        const monthTransactions = filteredTransactions.filter(
          (t) => t.date >= startOfMonth && t.date <= endOfMonth
        );
        const revenue = monthTransactions
          .filter((t) => t.type === 'revenue' && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTransactions
          .filter((t) => t.type === 'expense' && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          name: `Tháng ${month + 1}`,
          Thu: revenue,
          Chi: expense,
        };
      });
    } else if (timeRange === 'year') {
      barData = Array.from({ length: 12 }, (_, i) => {
        const monthMoment = selectedDate.clone().month(i);
        const startOfMonth = monthMoment.startOf('month').format('YYYY-MM-DD');
        const endOfMonth = monthMoment.endOf('month').format('YYYY-MM-DD');
        const monthTransactions = filteredTransactions.filter(
          (t) => t.date >= startOfMonth && t.date <= endOfMonth
        );
        const revenue = monthTransactions
          .filter((t) => t.type === 'revenue' && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTransactions
          .filter((t) => t.type === 'expense' && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          name: `T${i + 1}`,
          fullName: `Tháng ${i + 1}`,
          Thu: revenue,
          Chi: expense,
        };
      });
    }

    return { pieData, barData };
  };

  const { pieData, barData } = getChartData();

  const COLORS = ['#0A8FDC', '#49BD65', '#F44D50', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#4299E1'];

  const totalRevenue = barData.reduce((sum, item) => sum + item.Thu, 0);
  const totalExpense = barData.reduce((sum, item) => sum + item.Chi, 0);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard - Tổng quan hệ thống</h1>
        <div className="dashboard-controls">
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 150, marginRight: 16 }}
          >
            <Option value="month">Theo tháng</Option>
            <Option value="quarter">Theo quý</Option>
            <Option value="year">Theo năm</Option>
          </Select>
          <DatePicker
            picker={timeRange === 'year' ? 'year' : timeRange === 'quarter' ? 'quarter' : 'month'}
            value={selectedDate}
            onChange={setSelectedDate}
            format={timeRange === 'year' ? 'YYYY' : timeRange === 'quarter' ? 'YYYY [Q]Q' : 'MM/YYYY'}
          />
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng khách hàng"
              value={stats.totalCustomers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng doanh nghiệp"
              value={stats.totalBusinesses}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng công việc"
              value={stats.totalTasks}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={stats.totalRevenue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
              formatter={(value) => formatCurrency(value)}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card 
            title="Tổng kết thu chi" 
            extra={
              <div>
                <span style={{ color: '#49BD65', marginRight: 16 }}>
                  <ArrowUpOutlined /> Thu: {formatCurrency(totalRevenue)}
                </span>
                <span style={{ color: '#F44D50' }}>
                  <ArrowDownOutlined /> Chi: {formatCurrency(totalExpense)}
                </span>
              </div>
            }
            className="chart-card"
          >
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={barData}
                  margin={{
                    top: 15,
                    right: 0,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 1"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis dataKey="name" dy={10} />
                  <YAxis />
                  <Tooltip 
                    labelStyle={{ color: 'black' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="Thu" fill="#49BD65" barSize={8} />
                  <Bar dataKey="Chi" fill="#F44D50" barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                Không có dữ liệu cho khoảng thời gian này
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Phân bổ theo danh mục" className="chart-card">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    labelStyle={{ color: 'black' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                Không có dữ liệu
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="Biểu đồ thu chi theo thời gian" className="chart-card">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart
                  data={barData}
                  margin={{
                    top: 15,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 1"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis dataKey="name" dy={10} />
                  <YAxis />
                  <Tooltip 
                    labelStyle={{ color: 'black' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Thu" 
                    stroke="#49BD65" 
                    strokeWidth={3}
                    dot={{ fill: '#49BD65', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Chi" 
                    stroke="#F44D50" 
                    strokeWidth={3}
                    dot={{ fill: '#F44D50', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                Không có dữ liệu cho khoảng thời gian này
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
