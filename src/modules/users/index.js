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
  Select,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './index.css';

const { Option } = Select;

const Users = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const fetchUsers = useCallback(async () => {
    if (!isAdmin()) return;
    
    setLoading(true);
    try {
      const response = await axios.get('/api/users', {
        params: { search, role: roleFilter, page },
      });
      setUsers(response.data.users);
      setTotal(response.data.userCount);
    } catch (error) {
      if (error.response?.status === 403) {
        message.error('Bạn không có quyền truy cập trang này');
      } else {
        message.error('Lỗi khi tải dữ liệu nhân viên');
      }
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page, isAdmin]);

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [fetchUsers, isAdmin]);

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({
      role: 'user',
      status: 'active',
    });
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/users/${id}`);
      message.success('Xóa nhân viên thành công');
      fetchUsers();
    } catch (error) {
      message.error('Lỗi khi xóa nhân viên');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, values);
        message.success('Cập nhật nhân viên thành công');
      } else {
        await axios.post('/api/users', {
          ...values,
          password: values.password || '123456', // Default password
        });
        message.success('Thêm nhân viên thành công');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      message.error('Lỗi khi lưu nhân viên');
    }
  };

  const getRoleText = (role) => {
    const roles = {
      admin: 'Quản trị viên',
      manager: 'Quản lý',
      user: 'Nhân viên',
    };
    return roles[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'red',
      manager: 'blue',
      user: 'green',
    };
    return colors[role] || 'default';
  };

  if (!isAdmin()) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2>Bạn không có quyền truy cập trang này</h2>
        <p>Chỉ quản trị viên mới có thể truy cập quản lý nhân viên.</p>
      </div>
    );
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
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
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={getRoleColor(role)}>{getRoleText(role)}</Tag>
      ),
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Chức vụ',
      dataIndex: 'position',
      key: 'position',
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
    <div className="users-container">
      <div className="users-header">
        <h2>Quản lý nhân viên</h2>
        <Space>
          <Input
            placeholder="Tìm kiếm nhân viên..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: 300 }}
          />
          <Select
            placeholder="Lọc theo vai trò"
            value={roleFilter}
            onChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="admin">Quản trị viên</Option>
            <Option value="manager">Quản lý</Option>
            <Option value="user">Nhân viên</Option>
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Thêm nhân viên
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={users}
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
        title={editingUser ? 'Sửa nhân viên' : 'Thêm nhân viên'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
          >
            <Input />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
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
          >
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select>
              <Option value="admin">Quản trị viên</Option>
              <Option value="manager">Quản lý</Option>
              <Option value="user">Nhân viên</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="department"
            label="Phòng ban"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="position"
            label="Chức vụ"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            initialValue="active"
          >
            <Select>
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Không hoạt động</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Cập nhật' : 'Thêm mới'}
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

export default Users;

