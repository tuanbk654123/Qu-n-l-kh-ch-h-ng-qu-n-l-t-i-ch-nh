import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Input,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Popconfirm,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import './index.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form] = Form.useForm();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/customers', {
        params: { search, page },
      });
      setCustomers(response.data.customers);
      setTotal(response.data.customerCount);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu khách hàng');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCustomer(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/customers/${id}`);
      message.success('Xóa khách hàng thành công');
      fetchCustomers();
    } catch (error) {
      message.error('Lỗi khi xóa khách hàng');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingCustomer) {
        await axios.put(`/api/customers/${editingCustomer.id}`, values);
        message.success('Cập nhật khách hàng thành công');
      } else {
        await axios.post('/api/customers', values);
        message.success('Thêm khách hàng thành công');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchCustomers();
    } catch (error) {
      message.error('Lỗi khi lưu khách hàng');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Tên khách hàng',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Công ty',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Tổng đơn hàng',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      align: 'right',
    },
    {
      title: 'Tổng doanh thu',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      align: 'right',
      render: (amount) =>
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(amount),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="customers-container">
      <div className="customers-header">
        <h2>Quản lý khách hàng</h2>
        <Space>
          <Input
            placeholder="Tìm kiếm khách hàng..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: 300 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Thêm khách hàng
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={customers}
        loading={loading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: 10,
          total: total,
          onChange: (page) => setPage(page),
        }}
      />

      <Modal
        title={editingCustomer ? 'Sửa khách hàng' : 'Thêm khách hàng'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Tên khách hàng"
            rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="company"
            label="Công ty"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            initialValue="active"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Ghi chú"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingCustomer ? 'Cập nhật' : 'Thêm mới'}
              </Button>
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Customers;

