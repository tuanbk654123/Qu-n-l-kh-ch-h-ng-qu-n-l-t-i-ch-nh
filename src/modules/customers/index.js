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
  Tabs,
  Row,
  Col,
  DatePicker,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
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

  const [fieldPermissions, setFieldPermissions] = useState({});

  const { Option } = Select;
  const { TextArea } = Input;

  const canReadField = (field) => {
    const level = fieldPermissions[field];
    return level && level !== 'N';
  };

  const canEditField = (field) => {
    const level = fieldPermissions[field];
    return level === 'W' || level === 'A';
  };

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

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await axios.get('/api/permissions/current', {
        params: { module: 'qlkh' },
      });
      setFieldPermissions(response.data.permissions || {});
    } catch (error) {
      setFieldPermissions({});
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
    fetchCustomers();
  }, [fetchCustomers, fetchPermissions]);

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCustomer(record);
    const formattedRecord = {
      ...record,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
      filingDate: record.filingDate ? dayjs(record.filingDate) : null,
      issueDate: record.issueDate ? dayjs(record.issueDate) : null,
      expiryDate: record.expiryDate ? dayjs(record.expiryDate) : null,
      processingDeadline: record.processingDeadline ? dayjs(record.processingDeadline) : null,
      renewalDate: record.renewalDate ? dayjs(record.renewalDate) : null,
      reminderDate: record.reminderDate ? dayjs(record.reminderDate) : null,
      updatedAt: record.updatedAt ? dayjs(record.updatedAt) : null,
    };
    form.setFieldsValue(formattedRecord);
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
      const formattedValues = {
        ...values,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
        filingDate: values.filingDate ? values.filingDate.format('YYYY-MM-DD') : null,
        issueDate: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : null,
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : null,
        processingDeadline: values.processingDeadline ? values.processingDeadline.format('YYYY-MM-DD') : null,
        renewalDate: values.renewalDate ? values.renewalDate.format('YYYY-MM-DD') : null,
        reminderDate: values.reminderDate ? values.reminderDate.format('YYYY-MM-DD') : null,
        updatedAt: values.updatedAt ? values.updatedAt.format('YYYY-MM-DD') : null,
      };

      if (editingCustomer) {
        await axios.put(`/api/customers/${editingCustomer.id}`, formattedValues);
        message.success('Cập nhật khách hàng thành công');
      } else {
        await axios.post('/api/customers', formattedValues);
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
      width: 60,
      fixed: 'left',
    },
    {
      title: 'Tên khách hàng',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left',
      hidden: !canReadField('name'),
    },
    {
      title: 'Mã số thuế',
      dataIndex: 'taxCode',
      key: 'taxCode',
      width: 120,
      hidden: !canReadField('taxCode'),
    },
    {
      title: 'Công ty',
      dataIndex: 'company',
      key: 'company',
      width: 150,
    },
    {
      title: 'Người đại diện',
      dataIndex: 'representativeName',
      key: 'representativeName',
      width: 150,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 180,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Mức độ tiềm năng',
      dataIndex: 'potentialLevel',
      key: 'potentialLevel',
      width: 150,
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
    },
    {
      title: 'Tình trạng tư vấn',
      dataIndex: 'consultingStatus',
      key: 'consultingStatus',
      width: 150,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      fixed: 'right',
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

  const tabItems = [
    {
      key: '1',
      label: 'Thông tin chung',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Doanh nghiệp"
              rules={[{ required: true, message: 'Vui lòng nhập tên doanh nghiệp' }]}
            >
              <Input disabled={!canEditField('name')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="businessScale"
              label="Quy mô doanh nghiệp"
            >
              <Select allowClear disabled={!canEditField('businessScale')}>
                <Option value="Siêu nhỏ">Siêu nhỏ</Option>
                <Option value="Nhỏ">Nhỏ</Option>
                <Option value="Vừa">Vừa</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="taxCode"
              label="Mã số thuế"
            >
              <Input disabled={!canEditField('taxCode')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="address"
              label="Địa chỉ"
            >
              <TextArea rows={2} disabled={!canEditField('address')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="representativeName"
              label="Người đại diện"
            >
              <Input disabled={!canEditField('representativeName')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="representativePosition"
              label="Chức vụ"
            >
              <Input disabled={!canEditField('representativePosition')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="idNumber"
              label="CCCD/Hộ chiếu"
            >
              <Input disabled={!canEditField('idNumber')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Số điện thoại"
            >
              <Input disabled={!canEditField('phone')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
            >
              <Input disabled={!canEditField('email')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contactPerson"
              label="Người liên hệ"
            >
              <Input disabled={!canEditField('contactPerson')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contactPhone"
              label="SĐT người liên hệ"
            >
              <Input disabled={!canEditField('contactPhone')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contactEmail"
              label="Email người liên hệ"
              rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
            >
              <Input disabled={!canEditField('contactEmail')} />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: '2',
      label: 'Nhu cầu & SHTT',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="businessNeeds"
              label="Nhu cầu của DN"
            >
              <Select allowClear disabled={!canEditField('businessNeeds')}>
                <Option value="Bản quyền">Bản quyền</Option>
                <Option value="Công bố">Công bố</Option>
                <Option value="Nhãn hiệu">Nhãn hiệu</Option>
                <Option value="Kiểu dáng công nghiệp">Kiểu dáng công nghiệp</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="brandName"
              label="Thương hiệu"
            >
              <Input disabled={!canEditField('brandName')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="productsServices"
              label="Sản phẩm/Dịch vụ đi kèm thương hiệu"
            >
              <Select allowClear disabled={!canEditField('productsServices')}>
                <Option value="Đăng ký">Đăng ký</Option>
                <Option value="Gia hạn">Gia hạn</Option>
                <Option value="Sửa đổi">Sửa đổi</Option>
                <Option value="Phản đối">Phản đối</Option>
                <Option value="Khiếu nại">Khiếu nại</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="ipGroup"
              label="Nhóm SHTT sau khi phân loại"
            >
              <Input disabled={!canEditField('ipGroup')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="owner"
              label="Chủ sở hữu"
            >
              <Input disabled={!canEditField('owner')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="protectionTerritory"
              label="Lãnh thổ bảo hộ"
            >
              <Select allowClear disabled={!canEditField('protectionTerritory')}>
                <Option value="Việt Nam">Việt Nam</Option>
                <Option value="US">US</Option>
                <Option value="Madrid">Madrid</Option>
                <Option value="Wipo">Wipo</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="createdBy"
              label="Người tạo"
            >
              <Input disabled={!canEditField('createdBy')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="startDate"
              label="Ngày bắt đầu"
            >
              <DatePicker style={{ width: '100%' }} disabled={!canEditField('startDate')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="endDate"
              label="Ngày kết thúc"
            >
              <DatePicker style={{ width: '100%' }} disabled={!canEditField('endDate')} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="implementationDays"
              label="Số ngày triển khai"
            >
              <Input type="number" disabled={!canEditField('implementationDays')} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="potentialLevel"
              label="Mức độ tiềm năng"
            >
              <Select allowClear disabled={!canEditField('potentialLevel')}>
                <Option value="Cao">Cao</Option>
                <Option value="Trung bình">Trung bình</Option>
                <Option value="Thấp">Thấp</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="priority"
              label="Ưu tiên"
            >
              <Select allowClear disabled={!canEditField('priority')}>
                <Option value="Mức 1">Mức 1</Option>
                <Option value="Mức 2">Mức 2</Option>
                <Option value="Mức 3">Mức 3</Option>
                <Option value="Mức 4">Mức 4</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: '3',
      label: 'Hợp đồng & Nộp đơn',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="consultingStatus"
              label="Tình trạng tư vấn"
            >
              <Select allowClear disabled={!canEditField('consultingStatus')}>
                <Option value="Chưa tư vấn">Chưa tư vấn</Option>
                <Option value="Đang tư vấn">Đang tư vấn</Option>
                <Option value="Đã tư vấn">Đã tư vấn</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contractStatus"
              label="Tình trạng hợp đồng"
            >
              <Select allowClear disabled={!canEditField('contractStatus')}>
                <Option value="Đã gửi">Đã gửi</Option>
                <Option value="Đợi phản hồi">Đợi phản hồi</Option>
                <Option value="Đã kí">Đã kí</Option>
                <Option value="Tạm ngưng">Tạm ngưng</Option>
                <Option value="Đã thanh toán HĐ">Đã thanh toán HĐ</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="contractNumber"
              label="Số hợp đồng"
            >
              <Input disabled={!canEditField('contractNumber')} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="contractValue"
              label="Giá trị hợp đồng"
            >
              <Input type="number" disabled={!canEditField('contractValue')} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="stateFee"
              label="Lệ phí nhà nước"
            >
              <Input type="number" disabled={!canEditField('stateFee')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="filingStatus"
              label="Tình trạng nộp đơn"
            >
              <Select allowClear disabled={!canEditField('filingStatus')}>
                <Option value="Chưa triển khai">Chưa triển khai</Option>
                <Option value="Đang viết hồ sơ">Đang viết hồ sơ</Option>
                <Option value="Đã viết hồ sơ">Đã viết hồ sơ</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="filingDate"
              label="Ngày nộp đơn"
            >
              <DatePicker style={{ width: '100%' }} disabled={!canEditField('filingDate')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="applicationCode"
              label="Mã đơn/Công bố/Văn bằng"
            >
              <Input disabled={!canEditField('applicationCode')} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="issueDate"
              label="Ngày cấp"
            >
              <DatePicker style={{ width: '100%' }} disabled={!canEditField('issueDate')} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="expiryDate"
              label="Ngày hết hạn"
            >
              <DatePicker style={{ width: '100%' }} disabled={!canEditField('expiryDate')} />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: '4',
      label: 'Nguồn & Gia hạn',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="sourceClassification"
              label="Phân loại nguồn"
            >
              <Select allowClear disabled={!canEditField('sourceClassification')}>
                <Option value="NSNN">NSNN</Option>
                <Option value="Vãng lai">Vãng lai</Option>
                <Option value="Đối tác">Đối tác</Option>
                <Option value="Sự kiện">Sự kiện</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="nsnnSource"
              label="Nguồn NSNN"
            >
              <Select allowClear disabled={!canEditField('nsnnSource')}>
                <Option value="TACs">TACs</Option>
                <Option value="Sở TC Huế">Sở TC Huế</Option>
                <Option value="Sở CT Quảng Trị">Sở CT Quảng Trị</Option>
                <Option value="Sở CT Hậu Giang">Sở CT Hậu Giang</Option>
                <Option value="Chi cục PTNT Lâm Đồng">Chi cục PTNT Lâm Đồng</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="documentLink"
              label="Link hồ sơ giấy tờ"
            >
              <Input disabled={!canEditField('documentLink')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="authorization"
              label="Uỷ quyền"
            >
              <Select allowClear disabled={!canEditField('authorization')}>
                <Option value="Chưa có">Chưa có</Option>
                <Option value="Đã có">Đã có</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="applicationReviewStatus"
              label="Tình trạng xét duyệt đơn"
            >
              <Select allowClear disabled={!canEditField('applicationReviewStatus')}>
                <Option value="Đang xét duyệt">Đang xét duyệt</Option>
                <Option value="Có OA chưa phản hồi">Có OA chưa phản hồi</Option>
                <Option value="Được duyệt">Được duyệt</Option>
                <Option value="Có OA đã phản hồi">Có OA đã phản hồi</Option>
                <Option value="Từ chối">Từ chối</Option>
                <Option value="Hết hạn">Hết hạn</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="processingDeadline"
              label="Hạn xử lý"
            >
              <DatePicker style={{ width: '100%' }} disabled={!canEditField('processingDeadline')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="renewalCycle"
              label="Chu kỳ gia hạn"
            >
              <Select allowClear disabled={!canEditField('renewalCycle')}>
                <Option value="5 năm">5 năm</Option>
                <Option value="10 năm">10 năm</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="renewalDate"
              label="Ngày cần gia hạn"
            >
              <DatePicker style={{ width: '100%' }} disabled={!canEditField('renewalDate')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="reminderDate"
              label="Ngày nhắc hẹn (trước 3 tháng)"
            >
              <DatePicker style={{ width: '100%' }} disabled={!canEditField('reminderDate')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="reminderStatus"
              label="Trạng thái nhắc"
            >
              <Select allowClear disabled={!canEditField('reminderStatus')}>
                <Option value="Chưa nhắc">Chưa nhắc</Option>
                <Option value="Đã nhắc">Đã nhắc</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="additionalFee"
              label="Phí phát sinh"
            >
              <Input type="number" disabled={!canEditField('additionalFee')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="updatedBy"
              label="Người cập nhật"
            >
              <Input disabled={!canEditField('updatedBy')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="updatedAt"
              label="Ngày cập nhật"
            >
              <DatePicker style={{ width: '100%' }} disabled={!canEditField('updatedAt')} />
            </Form.Item>
          </Col>
        </Row>
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
        scroll={{ x: 1800 }}
      />

      <Modal
        title={editingCustomer ? 'Sửa khách hàng' : 'Thêm khách hàng'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changedValues, allValues) => {
            if (changedValues.startDate || changedValues.endDate) {
              const s = allValues.startDate;
              const e = allValues.endDate;
              if (s && e) {
                const diff = dayjs(e).diff(dayjs(s), 'day');
                form.setFieldsValue({ implementationDays: diff >= 0 ? diff : 0 });
              }
            }
          }}
          onFinish={handleSubmit}
        >
          <Tabs defaultActiveKey="1" items={tabItems} />
          
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingCustomer ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Customers;
