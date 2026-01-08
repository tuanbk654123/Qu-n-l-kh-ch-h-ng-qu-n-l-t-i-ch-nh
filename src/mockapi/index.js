import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { customersData } from './fakedb/customers';
import { businessesData } from './fakedb/businesses';
import { tasksData } from './fakedb/tasks';
import { transactionsData } from './fakedb/transactions';
import { usersData, setCurrentUser, getCurrentUser } from './fakedb/users';

const mock = new MockAdapter(axios, { delayResponse: 500 });

// API Authentication
mock.onPost('/api/auth/login').reply((config) => {
  const { username, password } = JSON.parse(config.data);
  const user = usersData.find(
    (u) => (u.username === username || u.email === username) && u.password === password
  );
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    setCurrentUser(userWithoutPassword);
    return [200, { user: userWithoutPassword, token: 'mock-token-' + user.id }];
  }
  return [401, { message: 'Tên đăng nhập hoặc mật khẩu không đúng' }];
});

mock.onPost('/api/auth/logout').reply(() => {
  setCurrentUser(null);
  return [200, { message: 'Đăng xuất thành công' }];
});

mock.onGet('/api/auth/me').reply(() => {
  const user = getCurrentUser();
  if (user) {
    return [200, { user }];
  }
  return [401, { message: 'Chưa đăng nhập' }];
});

// API Quản lý nhân viên (chỉ admin)
mock.onGet('/api/users').reply((config) => {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return [403, { message: 'Không có quyền truy cập' }];
  }

  const { search, page = 1, role } = config.params || {};
  let users = [...usersData];

  if (search) {
    users = users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.username.toLowerCase().includes(search.toLowerCase()),
    );
  }

  if (role) {
    users = users.filter((user) => user.role === role);
  }

  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  // Remove password from response
  const usersWithoutPassword = users.map(({ password, ...user }) => user);

  return [
    200,
    {
      users: usersWithoutPassword.slice(start, end),
      userCount: users.length,
    },
  ];
});

mock.onGet(/\/api\/users\/\d+/).reply((config) => {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return [403, { message: 'Không có quyền truy cập' }];
  }

  const id = parseInt(config.url.split('/').pop());
  const user = usersData.find((u) => u.id === id);
  if (user) {
    const { password, ...userWithoutPassword } = user;
    return [200, userWithoutPassword];
  }
  return [404, { message: 'User not found' }];
});

mock.onPost('/api/users').reply((config) => {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return [403, { message: 'Không có quyền truy cập' }];
  }

  const newUser = JSON.parse(config.data);
  const id = Math.max(...usersData.map((u) => u.id)) + 1;
  usersData.push({ ...newUser, id });
  const { password, ...userWithoutPassword } = { ...newUser, id };
  return [200, userWithoutPassword];
});

mock.onPut(/\/api\/users\/\d+/).reply((config) => {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return [403, { message: 'Không có quyền truy cập' }];
  }

  const id = parseInt(config.url.split('/').pop());
  const updatedUser = JSON.parse(config.data);
  const index = usersData.findIndex((u) => u.id === id);
  if (index !== -1) {
    usersData[index] = { ...usersData[index], ...updatedUser };
    const { password, ...userWithoutPassword } = usersData[index];
    return [200, userWithoutPassword];
  }
  return [404, { message: 'User not found' }];
});

mock.onDelete(/\/api\/users\/\d+/).reply((config) => {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return [403, { message: 'Không có quyền truy cập' }];
  }

  const id = parseInt(config.url.split('/').pop());
  const index = usersData.findIndex((u) => u.id === id);
  if (index !== -1) {
    usersData.splice(index, 1);
    return [200, { message: 'User deleted' }];
  }
  return [404, { message: 'User not found' }];
});

// API Quản lý khách hàng
mock.onGet('/api/customers').reply((config) => {
  const { search, page = 1 } = config.params || {};
  let customers = [...customersData];

  if (search) {
    customers = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.email.toLowerCase().includes(search.toLowerCase()) ||
        customer.phone.includes(search),
    );
  }

  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return [
    200,
    {
      customers: customers.slice(start, end),
      customerCount: customers.length,
    },
  ];
});

mock.onGet(/\/api\/customers\/\d+/).reply((config) => {
  const id = parseInt(config.url.split('/').pop());
  const customer = customersData.find((c) => c.id === id);
  return customer ? [200, customer] : [404, { message: 'Customer not found' }];
});

mock.onPost('/api/customers').reply((config) => {
  const newCustomer = JSON.parse(config.data);
  const id = Math.max(...customersData.map((c) => c.id)) + 1;
  customersData.push({ ...newCustomer, id });
  return [200, { ...newCustomer, id }];
});

mock.onPut(/\/api\/customers\/\d+/).reply((config) => {
  const id = parseInt(config.url.split('/').pop());
  const updatedCustomer = JSON.parse(config.data);
  const index = customersData.findIndex((c) => c.id === id);
  if (index !== -1) {
    customersData[index] = { ...updatedCustomer, id };
    return [200, customersData[index]];
  }
  return [404, { message: 'Customer not found' }];
});

mock.onDelete(/\/api\/customers\/\d+/).reply((config) => {
  const id = parseInt(config.url.split('/').pop());
  const index = customersData.findIndex((c) => c.id === id);
  if (index !== -1) {
    customersData.splice(index, 1);
    return [200, { message: 'Customer deleted' }];
  }
  return [404, { message: 'Customer not found' }];
});

// API Quản lý doanh nghiệp
mock.onGet('/api/businesses').reply((config) => {
  const { search, page = 1 } = config.params || {};
  let businesses = [...businessesData];

  if (search) {
    businesses = businesses.filter(
      (business) =>
        business.name.toLowerCase().includes(search.toLowerCase()) ||
        business.taxCode.includes(search) ||
        business.contactPerson.toLowerCase().includes(search.toLowerCase()),
    );
  }

  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return [
    200,
    {
      businesses: businesses.slice(start, end),
      businessCount: businesses.length,
    },
  ];
});

mock.onGet(/\/api\/businesses\/\d+/).reply((config) => {
  const id = parseInt(config.url.split('/').pop());
  const business = businessesData.find((b) => b.id === id);
  return business ? [200, business] : [404, { message: 'Business not found' }];
});

mock.onPost('/api/businesses').reply((config) => {
  const newBusiness = JSON.parse(config.data);
  const id = Math.max(...businessesData.map((b) => b.id)) + 1;
  businessesData.push({ ...newBusiness, id });
  return [200, { ...newBusiness, id }];
});

mock.onPut(/\/api\/businesses\/\d+/).reply((config) => {
  const id = parseInt(config.url.split('/').pop());
  const updatedBusiness = JSON.parse(config.data);
  const index = businessesData.findIndex((b) => b.id === id);
  if (index !== -1) {
    businessesData[index] = { ...updatedBusiness, id };
    return [200, businessesData[index]];
  }
  return [404, { message: 'Business not found' }];
});

mock.onDelete(/\/api\/businesses\/\d+/).reply((config) => {
  const id = parseInt(config.url.split('/').pop());
  const index = businessesData.findIndex((b) => b.id === id);
  if (index !== -1) {
    businessesData.splice(index, 1);
    return [200, { message: 'Business deleted' }];
  }
  return [404, { message: 'Business not found' }];
});

// API Quản lý công việc
mock.onGet('/api/tasks').reply((config) => {
  const { search, status, page = 1 } = config.params || {};
  let tasks = [...tasksData];

  if (search) {
    tasks = tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase()),
    );
  }

  if (status) {
    tasks = tasks.filter((task) => task.status === status);
  }

  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return [
    200,
    {
      tasks: tasks.slice(start, end),
      taskCount: tasks.length,
    },
  ];
});

mock.onGet(/\/api\/tasks\/\d+/).reply((config) => {
  const id = parseInt(config.url.split('/').pop());
  const task = tasksData.find((t) => t.id === id);
  return task ? [200, task] : [404, { message: 'Task not found' }];
});

mock.onPost('/api/tasks').reply((config) => {
  const newTask = JSON.parse(config.data);
  const id = Math.max(...tasksData.map((t) => t.id)) + 1;
  tasksData.push({ ...newTask, id });
  return [200, { ...newTask, id }];
});

mock.onPut(/\/api\/tasks\/\d+/).reply((config) => {
  const id = parseInt(config.url.split('/').pop());
  const updatedTask = JSON.parse(config.data);
  const index = tasksData.findIndex((t) => t.id === id);
  if (index !== -1) {
    tasksData[index] = { ...updatedTask, id };
    return [200, tasksData[index]];
  }
  return [404, { message: 'Task not found' }];
});

mock.onDelete(/\/api\/tasks\/\d+/).reply((config) => {
  const id = parseInt(config.url.split('/').pop());
  const index = tasksData.findIndex((t) => t.id === id);
  if (index !== -1) {
    tasksData.splice(index, 1);
    return [200, { message: 'Task deleted' }];
  }
  return [404, { message: 'Task not found' }];
});

// API Quản lý thu chi
mock.onGet('/api/transactions').reply((config) => {
  const { search, type, page = 1, pageSize = 10, startDate, endDate } = config.params || {};
  let transactions = [...transactionsData];

  if (search) {
    transactions = transactions.filter(
      (transaction) =>
        transaction.description.toLowerCase().includes(search.toLowerCase()) ||
        transaction.reference.includes(search),
    );
  }

  if (type) {
    transactions = transactions.filter((transaction) => transaction.type === type);
  }

  if (startDate && endDate) {
    transactions = transactions.filter(
      (transaction) =>
        transaction.date >= startDate && transaction.date <= endDate,
    );
  }

  // Nếu pageSize lớn (như 1000) thì trả về tất cả
  if (pageSize >= 1000) {
    return [
      200,
      {
        transactions: transactions,
        transactionCount: transactions.length,
      },
    ];
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return [
    200,
    {
      transactions: transactions.slice(start, end),
      transactionCount: transactions.length,
    },
  ];
});

mock.onGet('/api/transactions/summary').reply(() => {
  const totalRevenue = transactionsData
    .filter((t) => t.type === 'revenue' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactionsData
    .filter((t) => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalRevenue - totalExpense;

  return [
    200,
    {
      totalRevenue,
      totalExpense,
      balance,
    },
  ];
});

mock.onGet(/\/api\/transactions\/\d+/).reply((config) => {
  const id = parseInt(config.url.split('/').pop());
  const transaction = transactionsData.find((t) => t.id === id);
  return transaction
    ? [200, transaction]
    : [404, { message: 'Transaction not found' }];
});

mock.onPost('/api/transactions').reply((config) => {
  const newTransaction = JSON.parse(config.data);
  const id = Math.max(...transactionsData.map((t) => t.id)) + 1;
  transactionsData.push({ ...newTransaction, id });
  return [200, { ...newTransaction, id }];
});

mock.onPut(/\/api\/transactions\/\d+/).reply((config) => {
  const id = parseInt(config.url.split('/').pop());
  const updatedTransaction = JSON.parse(config.data);
  const index = transactionsData.findIndex((t) => t.id === id);
  if (index !== -1) {
    transactionsData[index] = { ...updatedTransaction, id };
    return [200, transactionsData[index]];
  }
  return [404, { message: 'Transaction not found' }];
});

mock.onDelete(/\/api\/transactions\/\d+/).reply((config) => {
  const id = parseInt(config.url.split('/').pop());
  const index = transactionsData.findIndex((t) => t.id === id);
  if (index !== -1) {
    transactionsData.splice(index, 1);
    return [200, { message: 'Transaction deleted' }];
  }
  return [404, { message: 'Transaction not found' }];
});

// Initialize mock adapter
export default mock;

// Export for use in App.js
export { mock };
