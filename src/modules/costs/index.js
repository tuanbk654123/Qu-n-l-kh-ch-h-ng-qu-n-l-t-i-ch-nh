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
  notification,
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
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { handleApiError } from '../../utils/errorHelper';
import { useLocation } from 'react-router-dom';
import './index.css';

const { Option } = Select;
const { TextArea } = Input;

const Costs = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { refreshNotifications } = useNotification();
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
  const [rejectReasonModalVisible, setRejectReasonModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch users for notification dropdown
    axios.get('/api/users')
      .then(res => {
        if (res.data && res.data.users) {
          setUsers(res.data.users);
        }
      })
      .catch(err => console.error('Error fetching users:', err));
  }, []);

  useEffect(() => {
    if (location.state?.openCostId) {
      const costId = location.state.openCostId;
      axios.get(`/api/costs/${costId}`)
        .then(response => {
           handleEdit(response.data);
           window.history.replaceState({}, document.title);
        })
        .catch(error => {
          console.error(error);
          message.error('Không thể tải thông tin phiếu chi');
        });
    }
  }, [location.state]);

  const handleApproveAction = () => {
    let updates = {};
    if (canEditField('approverManager')) {
      updates = { approverManager: 'Đã duyệt', paymentStatus: 'Quản lý duyệt' };
    } else if (canEditField('approverDirector')) {
      updates = { approverDirector: 'Đã duyệt', paymentStatus: 'Giám đốc duyệt' };
    }

    if (Object.keys(updates).length > 0) {
      form.setFieldsValue(updates);
      Modal.confirm({
        title: 'Xác nhận duyệt',
        content: 'Bạn có chắc chắn muốn duyệt phiếu chi này?',
        okText: 'Duyệt',
        cancelText: 'Hủy',
        onOk: () => form.submit(),
      });
    } else {
      message.error('Bạn không có quyền duyệt phiếu này');
    }
  };

  const handleRejectAction = () => {
    setRejectReason('');
    setRejectReasonModalVisible(true);
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      message.error('Vui lòng nhập lý do từ chối');
      return;
    }

    let updates = { rejectionReason: rejectReason, paymentStatus: 'Huỷ' };
    if (canEditField('approverManager')) {
      updates.approverManager = 'Từ chối';
    } else if (canEditField('approverDirector')) {
      updates.approverDirector = 'Từ chối';
    }

    form.setFieldsValue(updates);
    setRejectReasonModalVisible(false);
    form.submit();
  };

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
      handleApiError(error, 'Lỗi khi tải dữ liệu chi phí');
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
      transactionDate: record.transactionDate ? dayjs(record.transactionDate) : null,
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
      handleApiError(error, 'Lỗi khi xóa phiếu chi');
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

        // Logic xử lý thông báo và email
        const newStatus = values.paymentStatus;
        const oldStatus = editingCost.paymentStatus;
        let notifData = null;

        // Lấy thông tin người tạo phiếu để biết gửi thông báo cho ai (Nhân viên & Manager của họ)
        let creator = null;
        try {
            if (editingCost && editingCost.createdBy) {
                const res = await axios.get(`/api/users/${editingCost.createdBy}`);
                creator = res.data;
            }
        } catch (e) {
            console.error('Error fetching creator info', e);
        }

        // 1. Nếu bị HUỶ (Từ chối)
        if (newStatus === 'Huỷ' && oldStatus !== 'Huỷ') {
             // Thông báo cho Người yêu cầu (Requester) và Manager của họ
             const userIdsToNotify = [];
             if (creator) {
                userIdsToNotify.push(creator.id);
                if (creator.managerId) userIdsToNotify.push(creator.managerId);
             } else {
                 userIdsToNotify.push(editingCost.createdBy);
                 userIdsToNotify.push(2); // Fallback
             }

             notifData = {
                title: 'Phiếu chi bị từ chối',
                message: `Phiếu chi #${editingCost.id} đã bị từ chối. Lý do: ${values.rejectionReason}`,
                type: 'CostApproval',
                relatedId: editingCost.id.toString(),
                userIds: [...new Set(userIdsToNotify)]
             };

             notification.info({
                 message: '📧 Hệ thống Email (Gmail)',
                 description: `Đã gửi email TỪ CHỐI đến Requester và Manager. Lý do: ${values.rejectionReason}`,
                 placement: 'topRight',
                 duration: 5,
             });
        } 
        // 2. Nếu Manager duyệt -> Chuyển Giám đốc
        else if (newStatus === 'Quản lý duyệt' && oldStatus !== 'Quản lý duyệt') {
             // Gửi cho Manager của người đang duyệt (tức là Giám đốc)
             // user là người đang thao tác (Manager)
             const directorId = user.managerId || 3; // Fallback to CEO

             notifData = {
                title: 'Phiếu chi cần duyệt (GĐ)',
                message: `Manager đã duyệt phiếu #${editingCost.id}. Vui lòng xem xét.`,
                type: 'CostApproval',
                relatedId: editingCost.id.toString(),
                userIds: [directorId]
             };

             notification.success({
                message: '📧 Hệ thống Email (Gmail)',
                description: 'Đã gửi email yêu cầu phê duyệt cho Giám đốc.',
                placement: 'topRight',
                duration: 5,
             });
        } 
        // 3. Nếu Giám đốc duyệt -> Chuyển Kế toán
        else if (newStatus === 'Giám đốc duyệt' && oldStatus !== 'Giám đốc duyệt') {
             // Gửi cho Kế toán (User ID 4)
             notifData = {
                title: 'Phiếu chi đã được duyệt',
                message: `Giám đốc đã duyệt phiếu #${editingCost.id}. Vui lòng thực hiện chi tiền.`,
                type: 'CostApproval',
                relatedId: editingCost.id.toString(),
                userIds: [4] // Accountant
             };

             notification.success({
                message: '📧 Hệ thống Email (Gmail)',
                description: 'Đã gửi email thông báo cho Kế toán.',
                placement: 'topRight',
                duration: 5,
             });
        }
        // 4. Nếu Kế toán hoàn thành (Đã thanh toán)
        else if (newStatus === 'Đã thanh toán' && oldStatus !== 'Đã thanh toán') {
             // Gửi cho Requester và Manager
             const userIdsToNotify = [];
             if (creator) {
                userIdsToNotify.push(creator.id);
                if (creator.managerId) userIdsToNotify.push(creator.managerId);
             } else {
                 userIdsToNotify.push(editingCost.createdBy);
                 userIdsToNotify.push(2);
             }

             notifData = {
                title: 'Phiếu chi đã thanh toán',
                message: `Phiếu chi #${editingCost.id} đã được thanh toán hoàn tất.`,
                type: 'CostApproval',
                relatedId: editingCost.id.toString(),
                userIds: [...new Set(userIdsToNotify)]
             };

             notification.success({
                message: '📧 Hệ thống Email (Gmail)',
                description: 'Đã gửi email xác nhận thanh toán cho Nhân viên và Quản lý.',
                placement: 'topRight',
                duration: 5,
             });
        }

        if (notifData) {
            await axios.post('/api/notifications/create', notifData);
            refreshNotifications(); // Cập nhật chuông ngay lập tức
        }

      } else {
        const res = await axios.post('/api/costs', formattedValues);
        const newCostId = res.data.id;
        message.success('Tạo phiếu chi thành công');
        
        // Gửi thông báo cho những người được chọn
        if (values.notificationRecipients && values.notificationRecipients.length > 0) {
          // Backend đã tự động gửi thông báo dựa trên notificationRecipients
          notification.success({
              message: '📧 Hệ thống Email (Gmail)',
              description: `Đã gửi email yêu cầu phê duyệt cho ${values.notificationRecipients.length} người nhận.`,
              placement: 'topRight',
              duration: 5,
          });
        }
        refreshNotifications();
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchCosts();
    } catch (error) {
      handleApiError(error, 'Lỗi khi lưu phiếu chi');
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
        <Col span={24}>
            <Form.Item
                name="notificationRecipients"
                label="Gửi thông báo đến"
                rules={[{ required: true, message: 'Vui lòng chọn người nhận thông báo' }]}
            >
                <Select
                    mode="multiple"
                    placeholder="Chọn người nhận thông báo"
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                        String(option.children).toLowerCase().includes(input.toLowerCase())
                    }
                >
                    {users.map(u => (
                        <Option key={u.id} value={u.id}>
                            {`${u.fullName} (${u.username})`}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
        </Col>
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
        title={editingCost ? 'Cập nhật phiếu chi' : 'Tạo phiếu chi mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>,
          (editingCost && (canEditField('approverManager') || canEditField('approverDirector'))) ? (
            <>
              <Button key="reject" danger onClick={handleRejectAction}>
                Từ chối
              </Button>
              <Button key="submit" onClick={form.submit} style={{ marginRight: 8 }}>
                Lưu
              </Button>
              <Button key="approve" type="primary" onClick={handleApproveAction}>
                Duyệt
              </Button>
            </>
          ) : (
            <Button key="submit" type="primary" onClick={form.submit}>
              {editingCost ? "Lưu" : "Gửi duyệt"}
            </Button>
          )
        ]}
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
        </Form>
      </Modal>

      <Modal
        title="Lý do từ chối"
        open={rejectReasonModalVisible}
        onOk={confirmReject}
        onCancel={() => setRejectReasonModalVisible(false)}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
      >
        <Input.TextArea 
          rows={4} 
          value={rejectReason} 
          onChange={(e) => setRejectReason(e.target.value)} 
          placeholder="Nhập lý do từ chối..." 
        />
      </Modal>
    </div>
  );
};

export default Costs;
