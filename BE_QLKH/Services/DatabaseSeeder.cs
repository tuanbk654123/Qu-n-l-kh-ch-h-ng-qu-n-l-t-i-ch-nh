using BE_QLKH.Models;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Text;

namespace BE_QLKH.Services;

public class DatabaseSeeder : IHostedService
{
    private readonly IMongoClient _client;
    private readonly MongoDbSettings _settings;

    public DatabaseSeeder(IMongoClient client, IOptions<MongoDbSettings> options)
    {
        _client = client;
        _settings = options.Value;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var db = _client.GetDatabase(_settings.DatabaseName);

        var existingCollections = await db.ListCollectionNames().ToListAsync(cancellationToken);

        async Task EnsureCollection(string name)
        {
            if (!existingCollections.Contains(name))
            {
                await db.CreateCollectionAsync(name, cancellationToken: cancellationToken);
            }
        }

        await EnsureCollection("users");
        await EnsureCollection("customers");
        await EnsureCollection("costs");
        await EnsureCollection("roles");
        await EnsureCollection("modules");
        await EnsureCollection("fields");
        await EnsureCollection("field_permissions");

        var usersCollection = db.GetCollection<User>("users");
        if (await usersCollection.CountDocumentsAsync(_ => true, cancellationToken: cancellationToken) == 0)
        {
            var now = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");

            var defaultUsers = new List<User>
            {
                new User
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    LegacyId = 1,
                    UserId = "U001",
                    Username = "admin",
                    FullName = "Quản trị hệ thống",
                    Email = "admin@example.com",
                    PasswordHash = HashPassword("123456"),
                    RoleCode = "admin",
                    Status = "active",
                    CreatedAt = now,
                    UpdatedAt = now,
                    CreatedBy = 0,
                    UpdatedBy = 0
                },
                new User
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    LegacyId = 2,
                    UserId = "U002",
                    Username = "ceo",
                    FullName = "Tổng giám đốc",
                    Email = "ceo@example.com",
                    PasswordHash = HashPassword("123456"),
                    RoleCode = "ceo",
                    Status = "active",
                    CreatedAt = now,
                    UpdatedAt = now,
                    CreatedBy = 0,
                    UpdatedBy = 0
                },
                new User
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    LegacyId = 3,
                    UserId = "U003",
                    Username = "director",
                    FullName = "Giám đốc",
                    Email = "director@example.com",
                    PasswordHash = HashPassword("123456"),
                    RoleCode = "director",
                    Status = "active",
                    CreatedAt = now,
                    UpdatedAt = now,
                    CreatedBy = 0,
                    UpdatedBy = 0
                },
                new User
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    LegacyId = 4,
                    UserId = "U004",
                    Username = "accountant",
                    FullName = "Kế toán",
                    Email = "accountant@example.com",
                    PasswordHash = HashPassword("123456"),
                    RoleCode = "accountant",
                    Status = "active",
                    CreatedAt = now,
                    UpdatedAt = now,
                    CreatedBy = 0,
                    UpdatedBy = 0
                },
                new User
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    LegacyId = 5,
                    UserId = "U005",
                    Username = "sales",
                    FullName = "Marketing/Sales",
                    Email = "sales@example.com",
                    PasswordHash = HashPassword("123456"),
                    RoleCode = "marketing_sales",
                    Status = "active",
                    CreatedAt = now,
                    UpdatedAt = now,
                    CreatedBy = 0,
                    UpdatedBy = 0
                }
            };

            await usersCollection.InsertManyAsync(defaultUsers, cancellationToken: cancellationToken);
        }

        var customersCollection = db.GetCollection<Customer>("customers");
        if (await customersCollection.CountDocumentsAsync(_ => true, cancellationToken: cancellationToken) == 0)
        {
            var customers = new List<Customer>
            {
                new Customer
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    LegacyId = 1,
                    Name = "Nguyễn Văn A",
                    Email = "nguyenvana@example.com",
                    Phone = "0901234567",
                    Address = "123 Đường ABC, Quận 1, TP.HCM",
                    Company = "Công ty ABC",
                    TaxCode = "0101234567",
                    RepresentativeName = "Nguyễn Văn A",
                    RepresentativePosition = "Giám đốc",
                    RepresentativePhone = "0901234567",
                    BusinessNeeds = "Cần tư vấn giải pháp quản lý kho",
                    BusinessScale = "50-100 nhân sự",
                    BusinessIndustry = "Sản xuất",
                    CopyrightStatus = "Đã đăng ký",
                    TrademarkStatus = "Đã bảo hộ",
                    PatentStatus = "Không có",
                    IndustrialDesign = "Đang thẩm định",
                    ContractStatus = "Đang thực hiện",
                    Status = "active",
                    TotalOrders = 15,
                    TotalRevenue = 50000000m,
                    JoinDate = "2023-01-15",
                    Notes = "Khách hàng VIP",
                    ProductsServices = "Phần mềm quản lý",
                    IpGroup = "Nhóm 1",
                    ConsultingStatus = "Đã tư vấn",
                    FilingStatus = "Đã viết hồ sơ",
                    DocumentLink = "https://drive.google.com/drive/u/0/folders/1",
                    Authorization = "Đã có",
                    ApplicationReviewStatus = "Đang xét duyệt",
                    Priority = "Mức 1",
                    ContractPaid = "50%",
                    ContractValue = 100000000m,
                    StartDate = "2023-01-20",
                    EndDate = "2023-12-20",
                    ImplementationDays = 330,
                    PotentialLevel = "Cao",
                    SourceClassification = "Đối tác",
                    NsnnSource = ""
                },
                new Customer
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    LegacyId = 2,
                    Name = "Trần Thị B",
                    Email = "tranthib@example.com",
                    Phone = "0902345678",
                    Address = "456 Đường XYZ, Quận 2, TP.HCM",
                    Company = "Công ty XYZ",
                    TaxCode = "0102345678",
                    RepresentativeName = "Trần Thị B",
                    RepresentativePosition = "Trưởng phòng mua hàng",
                    RepresentativePhone = "0902345678",
                    BusinessNeeds = "Tìm kiếm nguồn nguyên liệu mới",
                    BusinessScale = "10-50 nhân sự",
                    BusinessIndustry = "Thương mại",
                    CopyrightStatus = "Chưa có",
                    TrademarkStatus = "Đang đăng ký",
                    PatentStatus = "Không có",
                    IndustrialDesign = "Không có",
                    ContractStatus = "Sắp hết hạn",
                    Status = "active",
                    TotalOrders = 8,
                    TotalRevenue = 25000000m,
                    JoinDate = "2023-03-20",
                    Notes = "",
                    ProductsServices = "Thực phẩm sạch",
                    IpGroup = "Nhóm 2",
                    ConsultingStatus = "Đang tư vấn",
                    FilingStatus = "Chưa triển khai",
                    DocumentLink = "",
                    Authorization = "Chưa có",
                    ApplicationReviewStatus = "Chưa có",
                    Priority = "Mức 2",
                    ContractPaid = "0%",
                    ContractValue = 50000000m,
                    StartDate = "2023-04-01",
                    EndDate = "2023-10-01",
                    ImplementationDays = 180,
                    PotentialLevel = "Trung bình",
                    SourceClassification = "Vãng lai",
                    NsnnSource = ""
                },
                new Customer
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    LegacyId = 3,
                    Name = "Lê Văn C",
                    Email = "levanc@example.com",
                    Phone = "0903456789",
                    Address = "789 Đường DEF, Quận 3, TP.HCM",
                    Company = "Công ty DEF",
                    TaxCode = "0103456789",
                    RepresentativeName = "Lê Văn C",
                    RepresentativePosition = "Phó Giám đốc",
                    RepresentativePhone = "0903456789",
                    BusinessNeeds = "Mở rộng thị trường miền Bắc",
                    BusinessScale = "100-200 nhân sự",
                    BusinessIndustry = "Xây dựng",
                    CopyrightStatus = "Đã đăng ký",
                    TrademarkStatus = "Đã bảo hộ",
                    PatentStatus = "Đã có bằng",
                    IndustrialDesign = "Đã bảo hộ",
                    ContractStatus = "Đã thanh lý",
                    Status = "inactive",
                    TotalOrders = 3,
                    TotalRevenue = 8000000m,
                    JoinDate = "2022-11-10",
                    Notes = "Khách hàng cũ",
                    ProductsServices = "Vật liệu xây dựng",
                    IpGroup = "Nhóm 3",
                    ConsultingStatus = "Đã tư vấn",
                    FilingStatus = "Đã viết hồ sơ",
                    DocumentLink = "https://drive.google.com/drive/u/0/folders/3",
                    Authorization = "Đã có",
                    ApplicationReviewStatus = "Được duyệt",
                    Priority = "Mức 3",
                    ContractPaid = "100%",
                    ContractValue = 200000000m,
                    StartDate = "2022-12-01",
                    EndDate = "2023-06-01",
                    ImplementationDays = 180,
                    PotentialLevel = "Thấp",
                    SourceClassification = "NSNN",
                    NsnnSource = "Sở TC Huế"
                },
                new Customer
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    LegacyId = 4,
                    Name = "Phạm Thị D",
                    Email = "phamthid@example.com",
                    Phone = "0904567890",
                    Address = "321 Đường GHI, Quận 4, TP.HCM",
                    Company = "Công ty GHI",
                    TaxCode = "0104567890",
                    RepresentativeName = "Phạm Thị D",
                    RepresentativePosition = "Kế toán trưởng",
                    RepresentativePhone = "0904567890",
                    BusinessNeeds = "Nâng cấp hệ thống phần mềm kế toán",
                    BusinessScale = "20-30 nhân sự",
                    BusinessIndustry = "Dịch vụ",
                    CopyrightStatus = "Không áp dụng",
                    TrademarkStatus = "Chưa đăng ký",
                    PatentStatus = "Không có",
                    IndustrialDesign = "Không có",
                    ContractStatus = "Đang đàm phán gia hạn",
                    Status = "active",
                    TotalOrders = 12,
                    TotalRevenue = 40000000m,
                    JoinDate = "2023-02-05",
                    Notes = "",
                    ProductsServices = "Dịch vụ kế toán",
                    IpGroup = "Nhóm 4",
                    ConsultingStatus = "Chưa tư vấn",
                    FilingStatus = "Chưa triển khai",
                    DocumentLink = "",
                    Authorization = "Chưa có",
                    ApplicationReviewStatus = "Chưa có",
                    Priority = "Mức 2",
                    ContractPaid = "0%",
                    ContractValue = 30000000m,
                    StartDate = "",
                    EndDate = "",
                    ImplementationDays = 0,
                    PotentialLevel = "Trung bình",
                    SourceClassification = "Sự kiện",
                    NsnnSource = ""
                },
                new Customer
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    LegacyId = 5,
                    Name = "Hoàng Văn E",
                    Email = "hoangvane@example.com",
                    Phone = "0905678901",
                    Address = "654 Đường JKL, Quận 5, TP.HCM",
                    Company = "Công ty JKL",
                    TaxCode = "0105678901",
                    RepresentativeName = "Hoàng Văn E",
                    RepresentativePosition = "Giám đốc điều hành",
                    RepresentativePhone = "0905678901",
                    BusinessNeeds = "Tư vấn tái cấu trúc doanh nghiệp",
                    BusinessScale = "500+ nhân sự",
                    BusinessIndustry = "Công nghệ",
                    CopyrightStatus = "Đã đăng ký nhiều bản quyền",
                    TrademarkStatus = "Thương hiệu mạnh",
                    PatentStatus = "Sở hữu 5 bằng sáng chế",
                    IndustrialDesign = "Đã đăng ký",
                    ContractStatus = "Hợp đồng dài hạn",
                    Status = "active",
                    TotalOrders = 20,
                    TotalRevenue = 75000000m,
                    JoinDate = "2022-09-15",
                    Notes = "Khách hàng thân thiết",
                    ProductsServices = "Giải pháp AI",
                    IpGroup = "Nhóm 1",
                    ConsultingStatus = "Đã tư vấn",
                    FilingStatus = "Đang viết hồ sơ",
                    DocumentLink = "https://drive.google.com/drive/u/0/folders/5",
                    Authorization = "Đã có",
                    ApplicationReviewStatus = "Có OA chưa phản hồi",
                    Priority = "Mức 1",
                    ContractPaid = "80%",
                    ContractValue = 500000000m,
                    StartDate = "",
                    EndDate = "",
                    ImplementationDays = 0,
                    PotentialLevel = "Cao",
                    SourceClassification = "Đối tác",
                    NsnnSource = ""
                }
            };

            await customersCollection.InsertManyAsync(customers, cancellationToken: cancellationToken);
        }

        var costsCollection = db.GetCollection<Cost>("costs");
        if (await costsCollection.CountDocumentsAsync(_ => true, cancellationToken: cancellationToken) == 0)
        {
            var costs = new List<Cost>
            {
                new Cost
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    LegacyId = 1,
                    Requester = "Nguyễn Văn A",
                    Department = "Kinh doanh",
                    RequestDate = "2023-01-15",
                    ProjectCode = "TACs25ND80",
                    TransactionType = "Chi",
                    TransactionObject = "Nhà hàng Biển Đông",
                    Content = "Chi phí tiếp khách",
                    Description = "Tiếp khách dự án TACs25ND80",
                    AmountBeforeTax = 5000000m,
                    TaxRate = "10%",
                    TotalAmount = 5500000m,
                    PaymentMethod = "Chuyển khoản",
                    Bank = "Vietcombank",
                    AccountNumber = "0011001234567",
                    VoucherType = "Hóa đơn",
                    VoucherNumber = "HD001234",
                    VoucherDate = "2023-01-15",
                    Attachment = "hoadon_tiepkhach.pdf",
                    PaymentStatus = "Đã thanh toán",
                    RejectionReason = "",
                    Note = "Đã duyệt bởi Giám đốc"
                },
                new Cost
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    LegacyId = 2,
                    Requester = "Trần Thị B",
                    Department = "Hành chính",
                    RequestDate = "2023-01-20",
                    ProjectCode = "",
                    TransactionType = "Chi",
                    TransactionObject = "Công ty VPP Hồng Hà",
                    Content = "Mua văn phòng phẩm",
                    Description = "Mua giấy, bút cho văn phòng",
                    AmountBeforeTax = 2000000m,
                    TaxRate = "8%",
                    TotalAmount = 2160000m,
                    PaymentMethod = "Tiền mặt",
                    Bank = "",
                    AccountNumber = "",
                    VoucherType = "Hóa đơn",
                    VoucherNumber = "HD005678",
                    VoucherDate = "2023-01-20",
                    Attachment = "hoadon_vpp.pdf",
                    PaymentStatus = "Đã thanh toán",
                    RejectionReason = "",
                    Note = ""
                },
                new Cost
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    LegacyId = 3,
                    Requester = "Lê Văn C",
                    Department = "Kỹ thuật",
                    RequestDate = "2023-02-01",
                    ProjectCode = "STCHue25ND80",
                    TransactionType = "Tạm ứng",
                    TransactionObject = "Lê Văn C",
                    Content = "Tạm ứng công tác phí",
                    Description = "Đi công tác Huế triển khai dự án",
                    AmountBeforeTax = 3000000m,
                    TaxRate = "No VAT",
                    TotalAmount = 3000000m,
                    PaymentMethod = "Chuyển khoản",
                    Bank = "Techcombank",
                    AccountNumber = "1903456789012",
                    VoucherType = "Phiếu chi",
                    VoucherNumber = "PC001",
                    VoucherDate = "2023-02-01",
                    Attachment = "de_nghi_tam_ung.pdf",
                    PaymentStatus = "Đợi duyệt",
                    RejectionReason = "",
                    Note = ""
                },
                new Cost
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    LegacyId = 4,
                    Requester = "Phạm Thị D",
                    Department = "Kế toán",
                    RequestDate = "2023-02-05",
                    ProjectCode = "",
                    TransactionType = "Thu",
                    TransactionObject = "Khách hàng XYZ",
                    Content = "Thu tiền hợp đồng đợt 1",
                    Description = "Khách hàng thanh toán 50% giá trị hợp đồng",
                    AmountBeforeTax = 50000000m,
                    TaxRate = "10%",
                    TotalAmount = 55000000m,
                    PaymentMethod = "Chuyển khoản",
                    Bank = "Vietinbank",
                    AccountNumber = "111222333",
                    VoucherType = "Phiếu thu",
                    VoucherNumber = "PT001",
                    VoucherDate = "2023-02-05",
                    Attachment = "unc_khachhang.pdf",
                    PaymentStatus = "Đã thanh toán",
                    RejectionReason = "",
                    Note = ""
                },
                new Cost
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    LegacyId = 5,
                    Requester = "Hoàng Văn E",
                    Department = "Marketing",
                    RequestDate = "2023-02-10",
                    ProjectCode = "SCTQTri25ND80",
                    TransactionType = "Hoàn ứng",
                    TransactionObject = "Hoàng Văn E",
                    Content = "Hoàn ứng chi phí chạy quảng cáo",
                    Description = "Chi phí chạy quảng cáo Facebook tháng 1",
                    AmountBeforeTax = 1500000m,
                    TaxRate = "No VAT",
                    TotalAmount = 1500000m,
                    PaymentMethod = "Tiền mặt",
                    Bank = "",
                    AccountNumber = "",
                    VoucherType = "Phiếu thu",
                    VoucherNumber = "PT002",
                    VoucherDate = "2023-02-10",
                    Attachment = "bang_ke_chi_phi.xlsx",
                    PaymentStatus = "Quản lý duyệt",
                    RejectionReason = "",
                    Note = ""
                }
            };

            await costsCollection.InsertManyAsync(costs, cancellationToken: cancellationToken);
        }

        var rolesCollection = db.GetCollection<Role>("roles");
        if (await rolesCollection.CountDocumentsAsync(_ => true, cancellationToken: cancellationToken) == 0)
        {
            var defaultRoles = new List<Role>
            {
                new Role { Code = "marketing_sales", Name = "Marketing/Sales", IsActive = true },
                new Role { Code = "ip_executive", Name = "IP Executive", IsActive = true },
                new Role { Code = "ip_manager", Name = "IP Manager", IsActive = true },
                new Role { Code = "accountant", Name = "Kế toán", IsActive = true },
                new Role { Code = "director", Name = "Giám đốc", IsActive = true },
                new Role { Code = "ceo", Name = "Tổng giám đốc", IsActive = true },
                new Role { Code = "admin", Name = "Hành chính", IsActive = true }
            };

            await rolesCollection.InsertManyAsync(defaultRoles, cancellationToken: cancellationToken);
        }

        var modulesCollection = db.GetCollection<ModuleDef>("modules");
        if (await modulesCollection.CountDocumentsAsync(_ => true, cancellationToken: cancellationToken) == 0)
        {
            var defaultModules = new List<ModuleDef>
            {
                new ModuleDef { Code = "qlkh", Name = "Quản lý khách hàng", IsActive = true },
                new ModuleDef { Code = "qlcp", Name = "Quản lý chi phí", IsActive = true },
                new ModuleDef { Code = "dashboard", Name = "Dashboard", IsActive = true },
                new ModuleDef { Code = "users", Name = "Quản lý nhân viên", IsActive = true }
            };

            await modulesCollection.InsertManyAsync(defaultModules, cancellationToken: cancellationToken);
        }

        var fieldsCollection = db.GetCollection<FieldDef>("fields");
        if (await fieldsCollection.CountDocumentsAsync(_ => true, cancellationToken: cancellationToken) == 0)
        {
            var fieldDefs = new List<FieldDef>
            {
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "name", Label = "Doanh nghiệp", GroupCode = "group_general", GroupLabel = "I. Nhóm thông tin chung", OrderIndex = 1 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "businessScale", Label = "Quy mô DN", GroupCode = "group_general", GroupLabel = "I. Nhóm thông tin chung", OrderIndex = 2 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "taxCode", Label = "Mã số thuế", GroupCode = "group_general", GroupLabel = "I. Nhóm thông tin chung", OrderIndex = 3 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "address", Label = "Địa chỉ", GroupCode = "group_general", GroupLabel = "I. Nhóm thông tin chung", OrderIndex = 4 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "representativeName", Label = "Người đại diện", GroupCode = "group_general", GroupLabel = "I. Nhóm thông tin chung", OrderIndex = 5 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "representativePosition", Label = "Chức vụ", GroupCode = "group_general", GroupLabel = "I. Nhóm thông tin chung", OrderIndex = 6 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "idNumber", Label = "CCCD/Hộ chiếu", GroupCode = "group_general", GroupLabel = "I. Nhóm thông tin chung", OrderIndex = 7 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "phone", Label = "SĐT DN", GroupCode = "group_general", GroupLabel = "I. Nhóm thông tin chung", OrderIndex = 8 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "email", Label = "Email DN", GroupCode = "group_general", GroupLabel = "I. Nhóm thông tin chung", OrderIndex = 9 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "contactPerson", Label = "Người liên hệ", GroupCode = "group_general", GroupLabel = "I. Nhóm thông tin chung", OrderIndex = 10 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "contactPhone", Label = "SĐT người liên hệ", GroupCode = "group_general", GroupLabel = "I. Nhóm thông tin chung", OrderIndex = 11 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "contactEmail", Label = "Email người liên hệ", GroupCode = "group_general", GroupLabel = "I. Nhóm thông tin chung", OrderIndex = 12 },

                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "businessNeeds", Label = "Nhu cầu DN", GroupCode = "group_need", GroupLabel = "II. Nhu cầu - Lead - Tiềm năng", OrderIndex = 1 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "potentialLevel", Label = "Mức độ tiềm năng", GroupCode = "group_need", GroupLabel = "II. Nhu cầu - Lead - Tiềm năng", OrderIndex = 2 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "priority", Label = "Ưu tiên", GroupCode = "group_need", GroupLabel = "II. Nhu cầu - Lead - Tiềm năng", OrderIndex = 3 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "sourceClassification", Label = "Phân loại nguồn", GroupCode = "group_need", GroupLabel = "II. Nhu cầu - Lead - Tiềm năng", OrderIndex = 4 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "nsnnSource", Label = "Nguồn NSNN", GroupCode = "group_need", GroupLabel = "II. Nhu cầu - Lead - Tiềm năng", OrderIndex = 5 },

                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "brandName", Label = "Thương hiệu", GroupCode = "group_core_ip", GroupLabel = "III. Thông tin SHTT cốt lõi", OrderIndex = 1 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "productsServices", Label = "Sản phẩm/DV", GroupCode = "group_core_ip", GroupLabel = "III. Thông tin SHTT cốt lõi", OrderIndex = 2 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "ipGroup", Label = "Nhóm SHTT", GroupCode = "group_core_ip", GroupLabel = "III. Thông tin SHTT cốt lõi", OrderIndex = 3 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "owner", Label = "Chủ sở hữu", GroupCode = "group_core_ip", GroupLabel = "III. Thông tin SHTT cốt lõi", OrderIndex = 4 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "protectionTerritory", Label = "Lãnh thổ bảo hộ", GroupCode = "group_core_ip", GroupLabel = "III. Thông tin SHTT cốt lõi", OrderIndex = 5 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "authorization", Label = "Uỷ quyền", GroupCode = "group_core_ip", GroupLabel = "III. Thông tin SHTT cốt lõi", OrderIndex = 6 },

                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "filingStatus", Label = "Tình trạng nộp đơn", GroupCode = "group_legal", GroupLabel = "IV. Hồ sơ đơn – văn bằng – pháp lý", OrderIndex = 1 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "filingDate", Label = "Ngày nộp đơn", GroupCode = "group_legal", GroupLabel = "IV. Hồ sơ đơn – văn bằng – pháp lý", OrderIndex = 2 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "applicationCode", Label = "Mã đơn/Công bố/VB", GroupCode = "group_legal", GroupLabel = "IV. Hồ sơ đơn – văn bằng – pháp lý", OrderIndex = 3 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "issueDate", Label = "Ngày cấp", GroupCode = "group_legal", GroupLabel = "IV. Hồ sơ đơn – văn bằng – pháp lý", OrderIndex = 4 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "expiryDate", Label = "Ngày hết hạn", GroupCode = "group_legal", GroupLabel = "IV. Hồ sơ đơn – văn bằng – pháp lý", OrderIndex = 5 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "applicationReviewStatus", Label = "Tình trạng xét duyệt", GroupCode = "group_legal", GroupLabel = "IV. Hồ sơ đơn – văn bằng – pháp lý", OrderIndex = 6 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "processingDeadline", Label = "Hạn xử lý", GroupCode = "group_legal", GroupLabel = "IV. Hồ sơ đơn – văn bằng – pháp lý", OrderIndex = 7 },

                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "renewalCycle", Label = "Chu kỳ gia hạn", GroupCode = "group_renewal", GroupLabel = "V. Gia hạn & nhắc việc", OrderIndex = 1 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "renewalDate", Label = "Ngày cần gia hạn", GroupCode = "group_renewal", GroupLabel = "V. Gia hạn & nhắc việc", OrderIndex = 2 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "reminderDate", Label = "Ngày nhắc (trước 3 tháng)", GroupCode = "group_renewal", GroupLabel = "V. Gia hạn & nhắc việc", OrderIndex = 3 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "reminderStatus", Label = "Trạng thái nhắc", GroupCode = "group_renewal", GroupLabel = "V. Gia hạn & nhắc việc", OrderIndex = 4 },

                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "consultingStatus", Label = "Tình trạng tư vấn", GroupCode = "group_contract", GroupLabel = "VI. Hợp đồng – tài chính", OrderIndex = 1 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "contractStatus", Label = "Tình trạng hợp đồng", GroupCode = "group_contract", GroupLabel = "VI. Hợp đồng – tài chính", OrderIndex = 2 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "contractNumber", Label = "Số hợp đồng", GroupCode = "group_contract", GroupLabel = "VI. Hợp đồng – tài chính", OrderIndex = 3 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "contractValue", Label = "Giá trị hợp đồng", GroupCode = "group_contract", GroupLabel = "VI. Hợp đồng – tài chính", OrderIndex = 4 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "stateFee", Label = "Lệ phí NN", GroupCode = "group_contract", GroupLabel = "VI. Hợp đồng – tài chính", OrderIndex = 5 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "additionalFee", Label = "Phí phát sinh", GroupCode = "group_contract", GroupLabel = "VI. Hợp đồng – tài chính", OrderIndex = 6 },

                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "createdBy", Label = "Người tạo", GroupCode = "group_system", GroupLabel = "VII. Hệ thống – kiểm soát", OrderIndex = 1 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "updatedBy", Label = "Người cập nhật", GroupCode = "group_system", GroupLabel = "VII. Hệ thống – kiểm soát", OrderIndex = 2 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "updatedAt", Label = "Ngày cập nhật", GroupCode = "group_system", GroupLabel = "VII. Hệ thống – kiểm soát", OrderIndex = 3 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", Code = "documentLink", Label = "Link hồ sơ giấy tờ", GroupCode = "group_system", GroupLabel = "VII. Hệ thống – kiểm soát", OrderIndex = 4 },

                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "requester", Label = "Người đề nghị", GroupCode = "group_request", GroupLabel = "I. Nhóm thông tin đề nghị – hành chính", OrderIndex = 1 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "department", Label = "Phòng ban", GroupCode = "group_request", GroupLabel = "I. Nhóm thông tin đề nghị – hành chính", OrderIndex = 2 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "priority", Label = "Ưu tiên", GroupCode = "group_request", GroupLabel = "I. Nhóm thông tin đề nghị – hành chính", OrderIndex = 3 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "requestDate", Label = "Ngày phát sinh giao dịch", GroupCode = "group_request", GroupLabel = "I. Nhóm thông tin đề nghị – hành chính", OrderIndex = 4 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "projectCode", Label = "Mã dự án", GroupCode = "group_request", GroupLabel = "I. Nhóm thông tin đề nghị – hành chính", OrderIndex = 5 },

                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "content", Label = "Nội dung", GroupCode = "group_content", GroupLabel = "II. Nhóm nội dung chi phí", OrderIndex = 1 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "description", Label = "Diễn giải", GroupCode = "group_content", GroupLabel = "II. Nhóm nội dung chi phí", OrderIndex = 2 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "transactionType", Label = "Loại giao dịch", GroupCode = "group_content", GroupLabel = "II. Nhóm nội dung chi phí", OrderIndex = 3 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "voucherType", Label = "Loại chứng từ", GroupCode = "group_content", GroupLabel = "II. Nhóm nội dung chi phí", OrderIndex = 4 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "transactionObject", Label = "Đối tượng Thu/Chi", GroupCode = "group_content", GroupLabel = "II. Nhóm nội dung chi phí", OrderIndex = 5 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "note", Label = "Ghi chú", GroupCode = "group_content", GroupLabel = "II. Nhóm nội dung chi phí", OrderIndex = 6 },

                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "amountBeforeTax", Label = "Số tiền (Chưa thuế)", GroupCode = "group_finance", GroupLabel = "III. Nhóm tiền – thuế", OrderIndex = 1 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "taxRate", Label = "Thuế suất", GroupCode = "group_finance", GroupLabel = "III. Nhóm tiền – thuế", OrderIndex = 2 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "totalAmount", Label = "Tổng tiền", GroupCode = "group_finance", GroupLabel = "III. Nhóm tiền – thuế", OrderIndex = 3 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "taxCode", Label = "Mã số thuế", GroupCode = "group_finance", GroupLabel = "III. Nhóm tiền – thuế", OrderIndex = 4 },

                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "voucherNumber", Label = "Số hóa đơn / Chứng từ / Hợp đồng", GroupCode = "group_voucher", GroupLabel = "IV. Nhóm hóa đơn – chứng từ", OrderIndex = 1 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "voucherDate", Label = "Ngày hóa đơn / Chứng từ / Hợp đồng", GroupCode = "group_voucher", GroupLabel = "IV. Nhóm hóa đơn – chứng từ", OrderIndex = 2 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "attachment", Label = "File đính kèm", GroupCode = "group_voucher", GroupLabel = "IV. Nhóm hóa đơn – chứng từ", OrderIndex = 3 },

                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "paymentMethod", Label = "Phương thức thanh toán", GroupCode = "group_payment", GroupLabel = "V. Nhóm thanh toán", OrderIndex = 1 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "accountNumber", Label = "Tài khoản", GroupCode = "group_payment", GroupLabel = "V. Nhóm thanh toán", OrderIndex = 2 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "bank", Label = "Ngân hàng", GroupCode = "group_payment", GroupLabel = "V. Nhóm thanh toán", OrderIndex = 3 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "paymentStatus", Label = "Trạng thái thanh toán", GroupCode = "group_payment", GroupLabel = "V. Nhóm thanh toán", OrderIndex = 4 },

                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "managerApproval", Label = "Quản lý duyệt", GroupCode = "group_control", GroupLabel = "VI. Nhóm phê duyệt – kiểm soát", OrderIndex = 1 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "directorApproval", Label = "Giám đốc duyệt", GroupCode = "group_control", GroupLabel = "VI. Nhóm phê duyệt – kiểm soát", OrderIndex = 2 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "accountantReview", Label = "Kế toán review", GroupCode = "group_control", GroupLabel = "VI. Nhóm phê duyệt – kiểm soát", OrderIndex = 3 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "adjustReason", Label = "Lý do điều chỉnh", GroupCode = "group_control", GroupLabel = "VI. Nhóm phê duyệt – kiểm soát", OrderIndex = 4 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "rejectionReason", Label = "Lý do từ chối", GroupCode = "group_control", GroupLabel = "VI. Nhóm phê duyệt – kiểm soát", OrderIndex = 5 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", Code = "riskFlag", Label = "Cờ kiểm soát rủi ro", GroupCode = "group_control", GroupLabel = "VI. Nhóm phê duyệt – kiểm soát", OrderIndex = 6 },

                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "dashboard", Code = "overview", Label = "Tổng quan", GroupCode = "group_dashboard", GroupLabel = "I. Dashboard", OrderIndex = 1 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "dashboard", Code = "kpi", Label = "Chỉ số KPI", GroupCode = "group_dashboard", GroupLabel = "I. Dashboard", OrderIndex = 2 },

                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "users", Code = "list", Label = "Danh sách nhân viên", GroupCode = "group_users", GroupLabel = "I. Nhân viên", OrderIndex = 1 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "users", Code = "detail", Label = "Chi tiết nhân viên", GroupCode = "group_users", GroupLabel = "I. Nhân viên", OrderIndex = 2 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "users", Code = "create", Label = "Thêm nhân viên", GroupCode = "group_users", GroupLabel = "I. Nhân viên", OrderIndex = 3 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "users", Code = "update", Label = "Sửa nhân viên", GroupCode = "group_users", GroupLabel = "I. Nhân viên", OrderIndex = 4 },
                new FieldDef { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "users", Code = "delete", Label = "Xóa nhân viên", GroupCode = "group_users", GroupLabel = "I. Nhân viên", OrderIndex = 5 }
            };

            await fieldsCollection.InsertManyAsync(fieldDefs, cancellationToken: cancellationToken);
        }

        var fieldPermissionsCollection = db.GetCollection<FieldPermission>("field_permissions");
        if (await fieldPermissionsCollection.CountDocumentsAsync(_ => true, cancellationToken: cancellationToken) == 0)
        {
            var fieldPermissions = new List<FieldPermission>();

            void AddQlkhPermissions(string fieldCode)
            {
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", FieldCode = fieldCode, RoleCode = "marketing_sales", PermissionLevel = "W" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", FieldCode = fieldCode, RoleCode = "ip_executive", PermissionLevel = "W" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", FieldCode = fieldCode, RoleCode = "ip_manager", PermissionLevel = "W" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", FieldCode = fieldCode, RoleCode = "accountant", PermissionLevel = "R" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", FieldCode = fieldCode, RoleCode = "director", PermissionLevel = "A" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", FieldCode = fieldCode, RoleCode = "ceo", PermissionLevel = "A" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlkh", FieldCode = fieldCode, RoleCode = "admin", PermissionLevel = "W" });
            }

            void AddQlcpPermissions(string fieldCode)
            {
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", FieldCode = fieldCode, RoleCode = "marketing_sales", PermissionLevel = "W" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", FieldCode = fieldCode, RoleCode = "ip_executive", PermissionLevel = "W" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", FieldCode = fieldCode, RoleCode = "ip_manager", PermissionLevel = "R" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", FieldCode = fieldCode, RoleCode = "accountant", PermissionLevel = "W" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", FieldCode = fieldCode, RoleCode = "director", PermissionLevel = "R" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", FieldCode = fieldCode, RoleCode = "ceo", PermissionLevel = "R" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "qlcp", FieldCode = fieldCode, RoleCode = "admin", PermissionLevel = "W" });
            }

            void AddDashboardPermissions(string fieldCode)
            {
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "dashboard", FieldCode = fieldCode, RoleCode = "marketing_sales", PermissionLevel = "R" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "dashboard", FieldCode = fieldCode, RoleCode = "ip_executive", PermissionLevel = "R" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "dashboard", FieldCode = fieldCode, RoleCode = "ip_manager", PermissionLevel = "R" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "dashboard", FieldCode = fieldCode, RoleCode = "accountant", PermissionLevel = "R" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "dashboard", FieldCode = fieldCode, RoleCode = "director", PermissionLevel = "A" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "dashboard", FieldCode = fieldCode, RoleCode = "ceo", PermissionLevel = "A" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "dashboard", FieldCode = fieldCode, RoleCode = "admin", PermissionLevel = "R" });
            }

            void AddUsersPermissions(string fieldCode)
            {
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "users", FieldCode = fieldCode, RoleCode = "marketing_sales", PermissionLevel = "N" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "users", FieldCode = fieldCode, RoleCode = "ip_executive", PermissionLevel = "N" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "users", FieldCode = fieldCode, RoleCode = "ip_manager", PermissionLevel = "R" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "users", FieldCode = fieldCode, RoleCode = "accountant", PermissionLevel = "N" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "users", FieldCode = fieldCode, RoleCode = "director", PermissionLevel = "R" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "users", FieldCode = fieldCode, RoleCode = "ceo", PermissionLevel = "R" });
                fieldPermissions.Add(new FieldPermission { Id = ObjectId.GenerateNewId().ToString(), ModuleCode = "users", FieldCode = fieldCode, RoleCode = "admin", PermissionLevel = "W" });
            }

            string[] qlkhFieldCodes =
            {
                "name",
                "businessScale",
                "taxCode",
                "address",
                "representativeName",
                "representativePosition",
                "idNumber",
                "phone",
                "email",
                "contactPerson",
                "contactPhone",
                "contactEmail",
                "businessNeeds",
                "potentialLevel",
                "priority",
                "sourceClassification",
                "nsnnSource",
                "brandName",
                "productsServices",
                "ipGroup",
                "owner",
                "protectionTerritory",
                "authorization",
                "filingStatus",
                "filingDate",
                "applicationCode",
                "issueDate",
                "expiryDate",
                "applicationReviewStatus",
                "processingDeadline",
                "renewalCycle",
                "renewalDate",
                "reminderDate",
                "reminderStatus",
                "consultingStatus",
                "contractStatus",
                "contractNumber",
                "contractValue",
                "stateFee",
                "additionalFee",
                "createdBy",
                "updatedBy",
                "updatedAt",
                "documentLink"
            };

            foreach (var code in qlkhFieldCodes)
            {
                AddQlkhPermissions(code);
            }

            string[] qlcpFieldCodes =
            {
                "requester",
                "department",
                "priority",
                "requestDate",
                "projectCode",
                "content",
                "description",
                "transactionType",
                "voucherType",
                "transactionObject",
                "note",
                "amountBeforeTax",
                "taxRate",
                "totalAmount",
                "taxCode",
                "voucherNumber",
                "voucherDate",
                "attachment",
                "paymentMethod",
                "accountNumber",
                "bank",
                "paymentStatus",
                "managerApproval",
                "directorApproval",
                "accountantReview",
                "adjustReason",
                "rejectionReason",
                "riskFlag"
            };

            foreach (var code in qlcpFieldCodes)
            {
                AddQlcpPermissions(code);
            }

            string[] dashboardFieldCodes =
            {
                "overview",
                "kpi"
            };

            foreach (var code in dashboardFieldCodes)
            {
                AddDashboardPermissions(code);
            }

            string[] usersFieldCodes =
            {
                "list",
                "detail",
                "create",
                "update",
                "delete"
            };

            foreach (var code in usersFieldCodes)
            {
                AddUsersPermissions(code);
            }

            if (fieldPermissions.Count > 0)
            {
                await fieldPermissionsCollection.InsertManyAsync(fieldPermissions, cancellationToken: cancellationToken);
            }
        }
    }

    private static string HashPassword(string password)
    {
        var passwordBytes = Encoding.UTF8.GetBytes(password);
        var hashBytes = System.Security.Cryptography.SHA256.HashData(passwordBytes);
        return Convert.ToHexString(hashBytes);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
