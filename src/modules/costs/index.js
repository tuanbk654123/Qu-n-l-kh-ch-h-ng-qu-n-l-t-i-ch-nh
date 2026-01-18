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
  Tabs,
  Upload,
  Card,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  DollarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import './index.css';

const { Option } = Select;
const { TextArea } = Input;

const Costs = () => {
  const { user } = useAuth();
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  const [form] = Form.useForm();

  const [fieldPermissions, setFieldPermissions] = useState({});

  const mapFieldToPermissionKey = (field) => {
    const mapping = {
      approverManager: 'managerApproval',
      approverDirector: 'directorApproval',
      adjustmentReason: 'adjustReason',
    };
    return mapping[field] || field;
  };

  const canReadField = (field) => {
    const key = mapFieldToPermissionKey(field);
    const level = fieldPermissions[key];
    return level && level !== 'N';
  };

  const canEditField = (field) => {
    const key = mapFieldToPermissionKey(field);
    const level = fieldPermissions[key];
    return level === 'W' || level === 'A';
  };

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/costs', {
        params: { search, type: typeFilter, status: statusFilter, page },
      });
      setCosts(response.data.costs);
      setTotal(response.data.costCount);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu chi phí');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, page]);

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await axios.get('/api/permissions/current', {
        params: { module: 'qlcp' },
      });
      setFieldPermissions(response.data.permissions || {});
    } catch (error) {
      setFieldPermissions({});
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
    fetchCosts();
  }, [fetchCosts, fetchPermissions]);

  const handleAdd = () => {
    setEditingCost(null);
    form.resetFields();
    form.setFieldsValue({
      requestDate: dayjs(),
      taxRate: '10%',
      paymentStatus: 'Đợi duyệt',
    });
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCost(record);
    const formattedRecord = {
      ...record,
      requestDate: record.requestDate ? dayjs(record.requestDate) : null,
      voucherDate: record.voucherDate ? dayjs(record.voucherDate) : null,
    };
    form.setFieldsValue(formattedRecord);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/costs/${id}`);
      message.success('Xóa phiếu chi thành công');
      fetchCosts();
    } catch (error) {
      message.error('Lỗi khi xóa phiếu chi');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const formattedValues = {
        ...values,
        requestDate: values.requestDate ? values.requestDate.format('YYYY-MM-DD') : null,
        transactionDate: values.transactionDate ? values.transactionDate.format('YYYY-MM-DD') : null,
        voucherDate: values.voucherDate ? values.voucherDate.format('YYYY-MM-DD') : null,
      };

      if (editingCost) {
        await axios.put(`/api/costs/${editingCost.id}`, formattedValues);
        message.success('Cập nhật phiếu chi thành công');
      } else {
        await axios.post('/api/costs', formattedValues);
        message.success('Tạo phiếu chi thành công');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchCosts();
    } catch (error) {
      message.error('Lỗi khi lưu phiếu chi');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Đã thanh toán': 'green',
      'Đợi duyệt': 'orange',
      'Quản lý duyệt': 'blue',
      'Giám đốc duyệt': 'cyan',
      'Huỷ': 'red',
      'Thanh toán 1 phần': 'purple',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Nội dung',
      dataIndex: 'content',
      key: 'content',
      width: 200,
      hidden: !canReadField('content'),
    },
    {
      title: 'Người đề nghị',
      dataIndex: 'requester',
      key: 'requester',
      width: 150,
      hidden: !canReadField('requester'),
    },
    {
      title: 'Số tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 150,
      align: 'right',
      render: (amount) => <b>{formatCurrency(amount)}</b>,
      hidden: !canReadField('totalAmount'),
    },
    {
      title: 'Loại',
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: 100,
      render: (type) => (
        <Tag color={type === 'Thu' || type === 'Hoàn ứng' ? 'blue' : 'volcano'}>
          {type}
        </Tag>
      ),
      hidden: !canReadField('transactionType'),
    },
    {
      title: 'Số chứng từ',
      dataIndex: 'voucherNumber',
      key: 'voucherNumber',
      width: 120,
      hidden: !canReadField('voucherNumber'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 150,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
      hidden: !canReadField('paymentStatus'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const visibleColumns = columns.filter((col) => !col.hidden);

  const calculateTotal = (changedValues, allValues) => {
    if (changedValues.amountBeforeTax || changedValues.taxRate) {
      const amount = parseFloat(allValues.amountBeforeTax) || 0;
      let rate = 0;
      if (allValues.taxRate === '10%') rate = 0.1;
      else if (allValues.taxRate === '8%') rate = 0.08;
      else if (allValues.taxRate === '5%') rate = 0.05;
      
      const vat = amount * rate;
      const total = amount + vat;
      form.setFieldsValue({ vatAmount: vat });
      form.setFieldsValue({ totalAmount: total });
    }
  };

  const renderGeneralInfo = () => (
    <>
      <Row gutter={16}>
        {canReadField('requester') && (
          <Col span={12}>
            <Form.Item
              name="requester"
              label="Người đề nghị"
              rules={[{ required: true, message: 'Vui lòng nhập người đề nghị' }]}
            >
              <Input disabled={!canEditField('requester')} />
            </Form.Item>
          </Col>
        )}
        {canReadField('department') && (
          <Col span={12}>
            <Form.Item
              name="department"
              label="Phòng ban"
            >
              <Select allowClear disabled={!canEditField('department')}>
                <Option value="Marketing">Marketing</Option>
                <Option value="Pháp chế">Pháp chế</Option>
                <Option value="Hành chính">Hành chính</Option>
                <Option value="Kế toán">Kế toán</Option>
              </Select>
            </Form.Item>
          </Col>
        )}
      </Row>
      <Row gutter={16}>
        {canReadField('requestDate') && (
          <Col span={12}>
            <Form.Item
              name="requestDate"
              label="Ngày đề nghị"
              rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" disabled={!canEditField('requestDate')} />
            </Form.Item>
          </Col>
        )}
        <Col span={12}>
          <Form.Item
            name="transactionDate"
            label="Ngày phát sinh giao dịch"
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        {canReadField('projectCode') && (
          <Col span={12}>
            <Form.Item
              name="projectCode"
              label="Mã dự án"
            >
              <Select allowClear disabled={!canEditField('projectCode')}>
                <Option value="TACs25ND80">TACs25ND80</Option>
                <Option value="STCHue25ND80">STCHue25ND80</Option>
                <Option value="SCTQTri25ND80">SCTQTri25ND80</Option>
                <Option value="SCTCT25ND80">SCTCT25ND80</Option>
                <Option value="SNNLD25MTQG">SNNLD25MTQG</Option>
                <Option value="Dịch vụ SHTT">Dịch vụ SHTT</Option>
              </Select>
            </Form.Item>
          </Col>
        )}
        {canReadField('priority') && (
          <Col span={12}>
            <Form.Item
              name="priority"
              label="Ưu tiên"
            >
              <Select allowClear disabled={!canEditField('priority')}>
                <Option value="Mức 1">Mức 1</Option>
                <Option value="Mức 2">Mức 2</Option>
                <Option value="Mức 3">Mức 3</Option>
                <Option value="Mức 4">Mức 4</Option>
                <Option value="Mức 5">Mức 5</Option>
              </Select>
            </Form.Item>
          </Col>
        )}
      </Row>
      <Row gutter={16}>
        {canReadField('transactionType') && (
          <Col span={12}>
            <Form.Item
              name="transactionType"
              label="Loại giao dịch"
              rules={[{ required: true, message: 'Vui lòng chọn loại giao dịch' }]}
            >
              <Select disabled={!canEditField('transactionType')}>
                <Option value="Chi">Chi</Option>
                <Option value="Thu">Thu</Option>
                <Option value="Hoàn ứng">Hoàn ứng</Option>
                <Option value="Chuyển nội bộ">Chuyển nội bộ</Option>
                <Option value="Tạm ứng">Tạm ứng</Option>
              </Select>
            </Form.Item>
          </Col>
        )}
        {canReadField('transactionObject') && (
          <Col span={12}>
            <Form.Item
              name="transactionObject"
              label="Đối tượng Thu/Chi"
              rules={[{ required: true, message: 'Vui lòng nhập đối tượng' }]}
            >
              <Input disabled={!canEditField('transactionObject')} />
            </Form.Item>
          </Col>
        )}
      </Row>
      <Row gutter={16}>
        {canReadField('taxCode') && (
          <Col span={12}>
            <Form.Item
              name="taxCode"
              label="Mã số thuế"
            >
              <Input disabled={!canEditField('taxCode')} />
            </Form.Item>
          </Col>
        )}
      </Row>
      {canReadField('content') && (
        <Form.Item
          name="content"
          label="Nội dung"
          rules={[{ required: true, message: 'Vui lòng chọn nội dung' }]}
        >
          <Select allowClear disabled={!canEditField('content')}>
            <Option value="Di chuyển">Di chuyển</Option>
            <Option value="Ăn uống">Ăn uống</Option>
            <Option value="Khách sạn">Khách sạn</Option>
            <Option value="Đổ xăng">Đổ xăng</Option>
            <Option value="Thanh toán dịch vụ">Thanh toán dịch vụ</Option>
            <Option value="Khác">Khác</Option>
          </Select>
        </Form.Item>
      )}
      {canReadField('description') && (
        <Form.Item
          name="description"
          label="Diễn giải chi tiết"
        >
          <TextArea rows={3} disabled={!canEditField('description')} />
        </Form.Item>
      )}
    </>
  );

  const renderFinancialInfo = () => (
    <>
      <Row gutter={16}>
        {canReadField('amountBeforeTax') && (
          <Col span={8}>
            <Form.Item
              name="amountBeforeTax"
              label="Số tiền (Chưa thuế)"
              rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
            >
              <Input type="number" suffix="VND" disabled={!canEditField('amountBeforeTax')} />
            </Form.Item>
          </Col>
        )}
        {canReadField('taxRate') && (
          <Col span={8}>
            <Form.Item
              name="taxRate"
              label="Thuế suất"
            >
              <Select disabled={!canEditField('taxRate')}>
                <Option value="No VAT">No VAT</Option>
                <Option value="0%">VAT 0%</Option>
                <Option value="5%">VAT 5%</Option>
                <Option value="8%">VAT 8%</Option>
                <Option value="10%">VAT 10%</Option>
              </Select>
            </Form.Item>
          </Col>
        )}
        {canReadField('totalAmount') && (
          <Col span={8}>
            <Form.Item
              name="totalAmount"
              label="Tổng tiền"
            >
              <Input type="number" suffix="VND" readOnly disabled={!canEditField('totalAmount')} />
            </Form.Item>
          </Col>
        )}
      </Row>
      <Row gutter={16}>
        {canReadField('paymentMethod') && (
          <Col span={8}>
            <Form.Item
              name="paymentMethod"
              label="Phương thức thanh toán"
            >
              <Select disabled={!canEditField('paymentMethod')}>
                <Option value="Tiền mặt">Tiền mặt</Option>
                <Option value="Chuyển khoản">Chuyển khoản</Option>
                <Option value="Ví điện tử">Ví điện tử</Option>
              </Select>
            </Form.Item>
          </Col>
        )}
        {canReadField('bank') && (
          <Col span={8}>
            <Form.Item
              name="bank"
              label="Ngân hàng"
            >
              <Input disabled={!canEditField('bank')} />
            </Form.Item>
          </Col>
        )}
        {canReadField('accountNumber') && (
          <Col span={8}>
            <Form.Item
              name="accountNumber"
              label="Số tài khoản"
            >
              <Input disabled={!canEditField('accountNumber')} />
            </Form.Item>
          </Col>
        )}
      </Row>
    </>
  );

  const renderVoucherInfo = () => (
    <>
      <Row gutter={16}>
        {canReadField('voucherType') && (
          <Col span={8}>
            <Form.Item
              name="voucherType"
              label="Loại chứng từ"
            >
              <Select disabled={!canEditField('voucherType')}>
                <Option value="Hóa đơn">Hóa đơn</Option>
                <Option value="Phiếu thu">Phiếu thu</Option>
                <Option value="Phiếu chi">Phiếu chi</Option>
                <Option value="Hợp đồng">Hợp đồng</Option>
              </Select>
            </Form.Item>
          </Col>
        )}
        {canReadField('voucherNumber') && (
          <Col span={8}>
            <Form.Item
              name="voucherNumber"
              label="Số chứng từ"
            >
              <Input disabled={!canEditField('voucherNumber')} />
            </Form.Item>
          </Col>
        )}
        {canReadField('voucherDate') && (
          <Col span={8}>
            <Form.Item
              name="voucherDate"
              label="Ngày chứng từ"
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" disabled={!canEditField('voucherDate')} />
            </Form.Item>
          </Col>
        )}
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="invoiceNumber"
            label="Số hóa đơn"
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="invoiceSeries"
            label="Ký hiệu hóa đơn"
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="vatAmount"
            label="Tiền VAT"
          >
            <Input type="number" suffix="VND" />
          </Form.Item>
        </Col>
      </Row>
      {canReadField('attachment') && (
        <Form.Item
          name="attachment"
          label="File đính kèm"
        >
          <Upload disabled={!canEditField('attachment')}>
            <Button icon={<UploadOutlined />}>Tải lên file</Button>
          </Upload>
        </Form.Item>
      )}
    </>
  );

  const renderApprovalInfo = () => (
    <>
      <Row gutter={16}>
        {canReadField('paymentStatus') && (
          <Col span={12}>
            <Form.Item
              name="paymentStatus"
              label="Trạng thái thanh toán"
            >
              <Select disabled={!canEditField('paymentStatus')}>
                <Option value="Đợi duyệt">Đợi duyệt</Option>
                <Option value="Quản lý duyệt">Quản lý duyệt</Option>
                <Option value="Giám đốc duyệt">Giám đốc duyệt</Option>
                <Option value="Đã thanh toán">Đã thanh toán</Option>
                <Option value="Thanh toán 1 phần">Thanh toán 1 phần</Option>
                <Option value="Huỷ">Huỷ</Option>
              </Select>
            </Form.Item>
          </Col>
        )}
        {canReadField('rejectionReason') && (
          <Col span={12}>
            <Form.Item
              name="rejectionReason"
              label="Lý do từ chối"
            >
              <Input disabled={!canEditField('rejectionReason')} />
            </Form.Item>
          </Col>
        )}
      </Row>
      <Row gutter={16}>
        {canReadField('approverManager') && (
          <Col span={8}>
            <Form.Item
              name="approverManager"
              label="Quản lý duyệt"
            >
              <Select disabled={!canEditField('approverManager')}>
                <Option value="Chưa duyệt">Chưa duyệt</Option>
                <Option value="Đã duyệt">Đã duyệt</Option>
                <Option value="Tạm ngưng">Tạm ngưng</Option>
                <Option value="Từ chối">Từ chối</Option>
              </Select>
            </Form.Item>
          </Col>
        )}
        {canReadField('approverDirector') && (
          <Col span={8}>
            <Form.Item
              name="approverDirector"
              label="Giám đốc duyệt"
            >
              <Select disabled={!canEditField('approverDirector')}>
                <Option value="Chưa duyệt">Chưa duyệt</Option>
                <Option value="Đã duyệt">Đã duyệt</Option>
                <Option value="Tạm ngưng">Tạm ngưng</Option>
                <Option value="Từ chối">Từ chối</Option>
              </Select>
            </Form.Item>
          </Col>
        )}
        {canReadField('accountantReview') && (
          <Col span={8}>
            <Form.Item
              name="accountantReview"
              label="Kế toán review"
            >
              <Select disabled={!canEditField('accountantReview')}>
                <Option value="Chưa duyệt">Chưa duyệt</Option>
                <Option value="Đã duyệt">Đã duyệt</Option>
                <Option value="Tạm ngưng">Tạm ngưng</Option>
                <Option value="Từ chối">Từ chối</Option>
              </Select>
            </Form.Item>
          </Col>
        )}
      </Row>
      <Row gutter={16}>
        {canReadField('adjustmentReason') && (
          <Col span={12}>
            <Form.Item
              name="adjustmentReason"
              label="Lý do điều chỉnh"
            >
              <Input disabled={!canEditField('adjustmentReason')} />
            </Form.Item>
          </Col>
        )}
        {canReadField('riskFlag') && (
          <Col span={12}>
            <Form.Item
              name="riskFlag"
              label="Cờ kiểm soát rủi ro"
            >
              <Select allowClear>
                <Option value="Có">Có</Option>
                <Option value="Không">Không</Option>
              </Select>
            </Form.Item>
          </Col>
        )}
      </Row>
      {canReadField('note') && (
        <Form.Item
          name="note"
          label="Ghi chú"
        >
          <TextArea rows={3} disabled={!canEditField('note')} />
        </Form.Item>
      )}
    </>
  );

  const renderVendorAndAccounting = () => (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="vendorName"
            label="Nhà cung cấp/Đối tác"
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="vendorTaxCode"
            label="MST nhà cung cấp"
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="costCategory"
            label="Nhóm chi phí"
          >
            <Select allowClear>
              <Option value="Văn phòng phẩm">Văn phòng phẩm</Option>
              <Option value="Đi lại">Đi lại</Option>
              <Option value="Marketing">Marketing</Option>
              <Option value="Dịch vụ">Dịch vụ</Option>
              <Option value="Khác">Khác</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="costSubCategory"
            label="Tiểu mục chi phí"
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="costCenter"
            label="Mã hạch toán (Cost center)"
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  const renderPaymentDeadline = () => (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="payDate"
            label="Ngày thanh toán"
            getValueProps={(i) => ({ value: i ? dayjs(i) : null })}
            getValueFromEvent={(e) => (e ? e.format('YYYY-MM-DD') : null)}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="dueDate"
            label="Hạn thanh toán"
            getValueProps={(i) => ({ value: i ? dayjs(i) : null })}
            getValueFromEvent={(e) => (e ? e.format('YYYY-MM-DD') : null)}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  return (
    <div className="costs-container" style={{ padding: 24 }}>
      <div className="costs-header" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>Quản lý chi phí</h2>
        <Space>
          <Input
            placeholder="Tìm kiếm nội dung, người đề nghị..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: 250 }}
          />
          <Select
            placeholder="Loại giao dịch"
            value={typeFilter}
            onChange={(value) => {
              setTypeFilter(value);
              setPage(1);
            }}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="Chi">Chi</Option>
            <Option value="Thu">Thu</Option>
            <Option value="Hoàn ứng">Hoàn ứng</Option>
            <Option value="Tạm ứng">Tạm ứng</Option>
          </Select>
          <Select
            placeholder="Trạng thái"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="Đợi duyệt">Đợi duyệt</Option>
            <Option value="Đã thanh toán">Đã thanh toán</Option>
            <Option value="Quản lý duyệt">Quản lý duyệt</Option>
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Tạo phiếu
          </Button>
        </Space>
      </div>

      <Table
        columns={visibleColumns}
        dataSource={costs}
        loading={loading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: 10,
          total: total,
          onChange: (page) => setPage(page),
        }}
        scroll={{ x: 1300 }}
      />

      <Modal
        title={editingCost ? 'Cập nhật phiếu' : 'Tạo phiếu mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={calculateTotal}
        >
          <Tabs defaultActiveKey="1">
            <Tabs.TabPane tab="Thông tin chung" key="1">
              {renderGeneralInfo()}
            </Tabs.TabPane>
            <Tabs.TabPane tab="Tài chính" key="2">
              {renderFinancialInfo()}
            </Tabs.TabPane>
            <Tabs.TabPane tab="Chứng từ" key="3">
              {renderVoucherInfo()}
            </Tabs.TabPane>
            <Tabs.TabPane tab="Phê duyệt" key="4">
              {renderApprovalInfo()}
            </Tabs.TabPane>
            <Tabs.TabPane tab="Đối tác & Hạch toán" key="5">
              {renderVendorAndAccounting()}
            </Tabs.TabPane>
            <Tabs.TabPane tab="Thanh toán & Hạn" key="6">
              {renderPaymentDeadline()}
            </Tabs.TabPane>
          </Tabs>

          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingCost ? 'Cập nhật' : 'Lưu phiếu'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Costs;
