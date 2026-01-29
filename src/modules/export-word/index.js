import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Upload,
  Form,
  Input,
  Button,
  Row,
  Col,
  Typography,
  message,
  Space
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  FileWordOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const { Title } = Typography;

const ExportWord = () => {
  const [form] = Form.useForm();
  const [exportFile, setExportFile] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [fieldPermissions, setFieldPermissions] = useState({});
  const { isAdmin } = useAuth();

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
  }, [fetchPermissions]);

  const canReadField = (field) => {
    if (isAdmin && isAdmin()) return true;
    const level = fieldPermissions[field];
    return level && level !== 'N';
  };

  const canEditField = (field) => {
    if (isAdmin && isAdmin()) return true;
    const level = fieldPermissions[field];
    return level === 'W' || level === 'A';
  };

  const handleExportWord = async () => {
    if (!exportFile) {
      message.error('Vui lòng chọn file template');
      return;
    }

    const formData = new FormData();
    formData.append('file', exportFile);

    // Get current form values
    const values = form.getFieldsValue();
    // values.dataSets is array of { replacements: [{value: '...'}, ...] }
    // We need to convert to array of dictionaries: [{text_1: '...', text_2: '...'}, ...]
    
    // We also need to know the structure of "rows" (text_1, text_2...).
    // Currently, the user defines the rows dynamically.
    // Let's assume the rows are defined in the first column or shared?
    // Actually, to make it simple, let's assume all columns share the same "Row Definitions" (text_1, text_2...).
    // BUT, the user's previous request was dynamic adding of text_n.
    // So let's store the "Row Definitions" in state or use the first dataset as reference?
    // Better: Maintain a list of "Fields" (text_1, text_2...) separately.
    
    const fieldKeys = values.fieldKeys || []; // ['text_1', 'text_2']
    const dataSets = values.dataSets || []; // [{ col_0: 'val', col_1: 'val' ... }] - No, Form.List structure is different.

    // Let's look at the Render structure first.
    // We will use a structure where:
    // fields: [{ key: 'text_1' }, { key: 'text_2' }]
    // dataSets: [{ name: 'Company A', values: { text_1: 'A', text_2: 'B' } }, ...]
    
    // Construct payload
    const payload = (values.dataSets || []).map(ds => {
      const dict = {};
      if (ds.name) {
        dict['_FileName'] = ds.name;
      }
      (values.fields || []).forEach((field, index) => {
        // field.key is the label/id e.g. "text_1"
        // ds.values[index] is the value
        const key = `text_${index + 1}`;
        const val = ds.values?.[index] || '';
        dict[key] = val;
      });
      return dict;
    });

    if (payload.length === 0) {
        message.error('Vui lòng thêm ít nhất một bộ dữ liệu');
        return;
    }

    formData.append('data', JSON.stringify(payload));

    try {
      setExportLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.post('/api/export/word', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob',
      });

      // Check content type to determine extension
      const contentType = response.headers['content-type'];
      const extension = contentType.includes('zip') ? 'zip' : 'docx';
      const defaultName = extension === 'zip' ? 'exported_documents.zip' : 'exported_document.docx';

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', defaultName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Xuất file thành công');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Lỗi khi xuất file');
    } finally {
      setExportLoading(false);
    }
  };

  if (!canReadField('export_doc')) {
    return (
        <Card>
            <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>
                Bạn không có quyền truy cập chức năng này.
            </div>
        </Card>
    );
  }

  return (
    <Card 
        title={<Space><FileWordOutlined /><Title level={4} style={{ marginBottom: 0 }}>Xuất văn bản</Title></Space>}
        style={{ margin: '24px' }}
    >
      <div style={{ overflowX: 'auto' }}>
          <Form 
            layout="vertical" 
            form={form} 
            initialValues={{ 
                fields: [{ key: 'text_1' }], 
                dataSets: [{ name: 'Bộ dữ liệu 1', values: [] }] 
            }}
          >
            <Form.Item label="File Template Word" required>
              <Upload
                beforeUpload={(file) => {
                  setExportFile(file);
                  return false;
                }}
                maxCount={1}
                accept=".docx"
                fileList={exportFile ? [exportFile] : []}
                onRemove={() => setExportFile(null)}
              >
                <Button icon={<UploadOutlined />}>Chọn file template</Button>
              </Upload>
            </Form.Item>

            <div style={{ display: 'flex', gap: '16px', paddingBottom: '16px' }}>
                {/* Column 1: Field Definitions */}
                <div style={{ minWidth: '200px', flexShrink: 0, borderRight: '1px solid #f0f0f0', paddingRight: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Trường dữ liệu</span>
                    </div>
                    
                    {/* Spacer to align with "Tên file" in data columns */}
                    <Form.Item
                        label={<span style={{ fontWeight: 'bold', opacity: 0 }}>Tên file xuất ra</span>}
                        style={{ 
                            marginBottom: '16px', 
                            padding: '8px', 
                            background: 'transparent', 
                            borderRadius: '4px',
                            border: '1px dashed transparent',
                            pointerEvents: 'none'
                        }}
                    >
                        <Input style={{ visibility: 'hidden' }} />
                    </Form.Item>

                    <Form.List name="fields">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }, index) => (
                                    <div key={key} style={{ height: '56px', display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                        <Space>
                                            <span style={{ fontWeight: 500 }}>text_{index + 1}</span>
                                            {fields.length > 1 && (
                                                <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                                            )}
                                        </Space>
                                    </div>
                                ))}
                                <Button type="dashed" onClick={() => add({})} block icon={<PlusOutlined />}>
                                    Thêm trường
                                </Button>
                            </>
                        )}
                    </Form.List>
                </div>

                {/* Columns N: Data Sets */}
                <Form.List name="dataSets">
                    {(dataSets, { add, remove }) => (
                        <>
                            {dataSets.map(({ key, name, ...restField }, colIndex) => (
                                <div key={key} style={{ minWidth: '250px', flexShrink: 0, background: '#fafafa', padding: '12px', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 'bold' }}>Bộ dữ liệu {colIndex + 1}</span>
                                        {dataSets.length > 1 && (
                                            <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red', cursor: 'pointer' }} />
                                        )}
                                    </div>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'name']}
                                        label={<span style={{ fontWeight: 'bold', color: '#1890ff' }}>Tên file xuất ra</span>}
                                        initialValue={`File_${colIndex + 1}`}
                                        rules={[{ required: true, message: 'Nhập tên file' }]}
                                        style={{ 
                                            marginBottom: '16px', 
                                            padding: '8px', 
                                            background: '#e6f7ff', 
                                            borderRadius: '4px',
                                            border: '1px dashed #1890ff'
                                        }}
                                    >
                                        <Input 
                                            prefix={<FileWordOutlined style={{ color: '#1890ff' }} />}
                                            placeholder="Nhập tên file (VD: HopDong_A)" 
                                            style={{ fontWeight: '500' }}
                                        />
                                    </Form.Item>
                                    
                                    {/* Nested List for Values matches the Fields structure */}
                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(prev, curr) => prev.fields !== curr.fields}
                                    >
                                        {({ getFieldValue }) => {
                                            const currentFields = getFieldValue('fields') || [];
                                            return currentFields.map((field, rowIndex) => (
                                                <Form.Item
                                                    key={field?.key || rowIndex} // Use field key or index to track
                                                    name={[name, 'values', rowIndex]} // Access via index
                                                    style={{ marginBottom: '8px', height: '56px' }}
                                                >
                                                    <Input placeholder={`Nhập giá trị...`} />
                                                </Form.Item>
                                            ));
                                        }}
                                    </Form.Item>
                                </div>
                            ))}
                            <div style={{ minWidth: '100px', display: 'flex', alignItems: 'flex-start' }}>
                                <Button type="dashed" onClick={() => add({ values: [] })} icon={<PlusOutlined />} style={{ height: '100%' }}>
                                    Thêm bộ dữ liệu
                                </Button>
                            </div>
                        </>
                    )}
                </Form.List>
            </div>

            <Form.Item style={{ marginTop: '24px' }}>
                <Button 
                    type="primary" 
                    icon={<DownloadOutlined />} 
                    onClick={handleExportWord} 
                    loading={exportLoading}
                    disabled={!canEditField('export_doc')}
                    block
                    size="large"
                >
                  Xuất tất cả
                </Button>
            </Form.Item>
          </Form>
      </div>
    </Card>
  );
};

export default ExportWord;
