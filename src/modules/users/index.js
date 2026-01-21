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
  DatePicker,
  Row,
  Col,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import { handleApiError } from '../../utils/errorHelper';
import './index.css';

const { Option } = Select;

const ROLE_OPTIONS = [
  { value: 'marketing_sales', label: 'Marketing/Sales' },
  { value: 'ip_executive', label: 'IP Executive' },
  { value: 'ip_manager', label: 'IP Manager' },
  { value: 'director', label: 'Giám đốc' },
  { value: 'ceo', label: 'Tổng giám đốc' },
  { value: 'accountant', label: 'Kế toán' },
  { value: 'admin', label: 'Hành chính' },
];

const ROLE_LABELS = ROLE_OPTIONS.reduce((acc, r) => {
  acc[r.value] = r.label;
  return acc;
}, {});

const ROLE_COLORS = {
  admin: 'gold',
  marketing_sales: 'purple',
  ip_executive: 'geekblue',
  ip_manager: 'blue',
  director: 'red',
  ceo: 'volcano',
  accountant: 'green',
};

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
  const [fieldPermissions, setFieldPermissions] = useState({});

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await axios.get('/api/permissions/current', {
        params: { module: 'users' },
      });
      setFieldPermissions(response.data.permissions || {});
    } catch (error) {
      setFieldPermissions({});
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    const level = fieldPermissions.list;
    if (!level && !isAdmin()) return;
    if (level === 'N') return;

    setLoading(true);
    try {
      const response = await axios.get('/api/users', {
        params: { search, role: roleFilter, page },
      });
      setUsers(response.data.users);
      setTotal(response.data.userCount);
    } catch (error) {
      handleApiError(error, 'Lỗi khi tải dữ liệu nhân viên');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page, fieldPermissions, isAdmin]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({
      role: 'marketing_sales',
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
      handleApiError(error, 'Lỗi khi xóa nhân viên');
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
      handleApiError(error, 'Lỗi khi lưu nhân viên');
    }
  };

  const getRoleText = (role) => {
    return ROLE_LABELS[role] || role;
  };

  const getRoleColor = (role) => {
    return ROLE_COLORS[role] || 'default';
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const listLevel = fieldPermissions.list;
  const createLevel = fieldPermissions.create;
  const updateLevel = fieldPermissions.update;
  const deleteLevel = fieldPermissions.delete;

  const canViewUsers = listLevel ? listLevel !== 'N' : isAdmin();
  const canCreateUser = createLevel ? createLevel === 'W' || createLevel === 'A' : isAdmin();
  const canUpdateUser = updateLevel ? updateLevel === 'W' || updateLevel === 'A' : isAdmin();
  const canDeleteUser = deleteLevel ? deleteLevel === 'W' || deleteLevel === 'A' : isAdmin();

  if (!canViewUsers) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2>Bạn không có quyền truy cập trang này</h2>
        <p>Vui lòng liên hệ quản trị hệ thống để được cấp quyền.</p>
      </div>
    );
  }

  const columns = [
    { title: 'STT', key: 'stt', width: 70, render: (_, __, index) => index + 1 },
    { title: 'User_ID', dataIndex: 'userId', key: 'userId', width: 160 },
    { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username', width: 140 },
    { title: 'Họ và tên', dataIndex: 'fullName', key: 'fullName', width: 180 },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
    { title: 'Số điện thoại', dataIndex: 'phone', key: 'phone', width: 140 },
    { title: 'Trạng thái tài khoản', dataIndex: 'status', key: 'status', width: 160, render: (status) => {
      if (status === 'active') return <Tag color="green">Hoạt động</Tag>;
      if (status === 'locked') return <Tag color="orange">Khóa</Tag>;
      return <Tag color="red">Không hoạt động</Tag>;
    }},
    { title: 'Công ty', dataIndex: 'company', key: 'company', width: 140 },
    { title: 'Phòng ban', dataIndex: 'department', key: 'department', width: 140 },
    { title: 'Chức danh', dataIndex: 'position', key: 'position', width: 140 },
    { title: 'Vai trò hệ thống (Role)', dataIndex: 'role', key: 'role', width: 160, render: (role) => (<Tag color={getRoleColor(role)}>{getRoleText(role)}</Tag>) },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          {canUpdateUser && (
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              Sửa
            </Button>
          )}
          {canDeleteUser && (
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
          )}
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
            {ROLE_OPTIONS.map((role) => (
              <Option key={role.value} value={role.value}>
                {role.label}
              </Option>
            ))}
          </Select>
          {canCreateUser && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Thêm nhân viên
            </Button>
          )}
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ background: '#fafafa', padding: 16 }}>
              <Row gutter={[16, 12]}>
                <Col xs={24} sm={12} md={8}>Loại nhân sự: {record.employmentType}</Col>
                <Col xs={24} sm={12} md={8}>QL trực tiếp (User_ID): {record.managerId}</Col>
                <Col xs={24} sm={12} md={8}>Ngày vào làm: {record.joinDate}</Col>
                <Col xs={24} sm={12} md={8}>Scope dữ liệu: {record.dataScope === 'company' ? 'Toàn công ty' : record.dataScope === 'department' ? 'Phòng ban' : 'Cá nhân'}</Col>
                <Col xs={24} sm={12} md={8}>Quyền phê duyệt: {record.approveRight ? 'Có' : 'Không'}</Col>
                <Col xs={24} sm={12} md={8}>Quyền xem tài chính: {record.financeViewRight ? 'Có' : 'Không'}</Col>
                <Col xs={24} sm={12} md={8}>Quyền xuất dữ liệu: {record.exportDataRight ? 'Có' : 'Không'}</Col>
                <Col xs={24} sm={12} md={8}>Ngày tạo: {record.createdAt}</Col>
                <Col xs={24} sm={12} md={8}>Người tạo: {record.createdBy}</Col>
                <Col xs={24} sm={12} md={8}>Ngày cập nhật: {record.updatedAt}</Col>
                <Col xs={24} sm={12} md={8}>Người cập nhật: {record.updatedBy}</Col>
                <Col xs={24} sm={12} md={8}>Ngày nghỉ việc: {record.offboardDate}</Col>
                <Col xs={24}>Ghi chú: {record.notes}</Col>
              </Row>
            </div>
          ),
        }}
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
        width={1000}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="userId" label="User_ID">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="role"
                label="Vai trò hệ thống (Role)"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
              >
                <Select>
                  {ROLE_OPTIONS.map((role) => (
                    <Option key={role.value} value={role.value}>
                      {role.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Trạng thái tài khoản" initialValue="active">
                <Select>
                  <Option value="active">Hoạt động</Option>
                  <Option value="inactive">Không hoạt động</Option>
                  <Option value="locked">Khóa</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              {!editingUser && (
                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                >
                  <Input.Password />
                </Form.Item>
              )}
            </Col>
            <Col span={8}>
              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
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
            </Col>
            <Col span={8}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="employmentType" label="Loại nhân sự">
                <Select>
                  <Option value="Chính thức">Chính thức</Option>
                  <Option value="Thời vụ">Thời vụ</Option>
                  <Option value="Cộng tác viên">Cộng tác viên</Option>
                  <Option value="Hợp đồng khoán">Hợp đồng khoán</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="company" label="Công ty">
                <Select allowClear showSearch optionFilterProp="children">
                  <Option value="Mega One">Mega One</Option>
                  <Option value="Mega IPGuard">Mega IPGuard</Option>
                  <Option value="Anneco">Anneco</Option>
                  <Option value="Đại Minh">Đại Minh</Option>
                  <Option value="Mega Next">Mega Next</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="department" label="Phòng ban">
                <Select allowClear showSearch optionFilterProp="children">
                  <Option value="Sale">Sale</Option>
                  <Option value="Marketing">Marketing</Option>
                  <Option value="Legal">Legal</Option>
                  <Option value="Accountant">Accountant</Option>
                  <Option value="HR">HR</Option>
                  <Option value="BOD">BOD</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="position" label="Chức danh">
                <Select allowClear>
                  <Option value="Nhân viên">Nhân viên</Option>
                  <Option value="Quản lý">Quản lý</Option>
                  <Option value="Giám đốc">Giám đốc</Option>
                  <Option value="Tổng giám đốc">Tổng giám đốc</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="managerId" label="Cấp quản lý trực tiếp (User_ID)">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="joinDate"
                label="Ngày vào làm"
                getValueProps={(i) => ({ value: i ? dayjs(i) : null })}
                getValueFromEvent={(e) => (e ? e.format('YYYY-MM-DD') : null)}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dataScope" label="Scope dữ liệu">
                <Select>
                  <Option value="company">Toàn công ty</Option>
                  <Option value="department">Phòng ban</Option>
                  <Option value="personal">Cá nhân</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="approveRight" label="Quyền phê duyệt">
                <Select>
                  <Option value={true}>Có</Option>
                  <Option value={false}>Không</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="financeViewRight" label="Quyền xem tài chính">
                <Select>
                  <Option value={true}>Có</Option>
                  <Option value={false}>Không</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="exportDataRight" label="Quyền xuất dữ liệu">
                <Select>
                  <Option value={true}>Có</Option>
                  <Option value={false}>Không</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="createdAt"
                label="Ngày tạo"
                getValueProps={(i) => ({ value: i ? dayjs(i) : null })}
                getValueFromEvent={(e) => (e ? e.format('YYYY-MM-DD') : null)}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="createdBy" label="Người tạo (User_ID)">
                <Select showSearch allowClear optionFilterProp="children">
                  {users.map((u) => (
                    <Option key={u.id} value={u.id}>
                      {u.fullName} ({u.id})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="updatedAt"
                label="Ngày cập nhật"
                getValueProps={(i) => ({ value: i ? dayjs(i) : null })}
                getValueFromEvent={(e) => (e ? e.format('YYYY-MM-DD') : null)}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="updatedBy" label="Người cập nhật (User_ID)">
                <Select showSearch allowClear optionFilterProp="children">
                  {users.map((u) => (
                    <Option key={u.id} value={u.id}>
                      {u.fullName} ({u.id})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="offboardDate"
                label="Ngày nghỉ việc"
                getValueProps={(i) => ({ value: i ? dayjs(i) : null })}
                getValueFromEvent={(e) => (e ? e.format('YYYY-MM-DD') : null)}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="notes" label="Ghi chú">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>

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

