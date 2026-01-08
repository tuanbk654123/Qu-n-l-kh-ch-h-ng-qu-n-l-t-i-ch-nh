// Mock data cho Quản lý nhân viên
export const usersData = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@company.com',
    password: 'admin123', // Trong thực tế nên hash password
    fullName: 'Nguyễn Văn Admin',
    phone: '0901234567',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    role: 'admin',
    department: 'Quản lý',
    position: 'Giám đốc',
    status: 'active',
    avatar: null,
    joinDate: '2020-01-15',
    salary: 50000000,
  },
  {
    id: 2,
    username: 'manager1',
    email: 'manager1@company.com',
    password: 'manager123',
    fullName: 'Trần Thị Manager',
    phone: '0902345678',
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    role: 'manager',
    department: 'Kinh doanh',
    position: 'Trưởng phòng',
    status: 'active',
    avatar: null,
    joinDate: '2021-03-20',
    salary: 30000000,
  },
  {
    id: 3,
    username: 'staff1',
    email: 'staff1@company.com',
    password: 'staff123',
    fullName: 'Lê Văn Staff',
    phone: '0903456789',
    address: '789 Đường DEF, Quận 3, TP.HCM',
    role: 'user',
    department: 'Kinh doanh',
    position: 'Nhân viên',
    status: 'active',
    avatar: null,
    joinDate: '2022-05-10',
    salary: 15000000,
  },
  {
    id: 4,
    username: 'staff2',
    email: 'staff2@company.com',
    password: 'staff123',
    fullName: 'Phạm Thị Staff',
    phone: '0904567890',
    address: '321 Đường GHI, Quận 4, TP.HCM',
    role: 'user',
    department: 'Kế toán',
    position: 'Nhân viên',
    status: 'active',
    avatar: null,
    joinDate: '2022-06-15',
    salary: 15000000,
  },
  {
    id: 5,
    username: 'manager2',
    email: 'manager2@company.com',
    password: 'manager123',
    fullName: 'Hoàng Văn Manager',
    phone: '0905678901',
    address: '654 Đường JKL, Quận 5, TP.HCM',
    role: 'manager',
    department: 'Kế toán',
    position: 'Trưởng phòng',
    status: 'active',
    avatar: null,
    joinDate: '2021-08-20',
    salary: 28000000,
  },
  {
    id: 6,
    username: 'staff3',
    email: 'staff3@company.com',
    password: 'staff123',
    fullName: 'Vũ Thị Staff',
    phone: '0906789012',
    address: '987 Đường MNO, Quận 6, TP.HCM',
    role: 'user',
    department: 'IT',
    position: 'Nhân viên',
    status: 'active',
    avatar: null,
    joinDate: '2023-01-10',
    salary: 18000000,
  },
];

// Current logged in user (sẽ được set khi login)
export let currentUser = null;

export const setCurrentUser = (user) => {
  currentUser = user;
  // Lưu vào localStorage
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }
};

export const getCurrentUser = () => {
  if (currentUser) return currentUser;
  const stored = localStorage.getItem('currentUser');
  if (stored) {
    currentUser = JSON.parse(stored);
    return currentUser;
  }
  return null;
};

