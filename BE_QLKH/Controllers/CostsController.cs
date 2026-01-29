using BE_QLKH.Hubs;
using BE_QLKH.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.Json;

namespace BE_QLKH.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CostsController : ControllerBase
{
    private readonly IMongoCollection<Cost> _costs;
    private readonly IMongoCollection<User> _users;
    private readonly IMongoCollection<Notification> _notifications;
    private readonly IHubContext<NotificationsHub> _hubContext;
    private readonly ILogger<CostsController> _logger;

    public CostsController(
        IMongoClient client, 
        IOptions<MongoDbSettings> options,
        IHubContext<NotificationsHub> hubContext,
        ILogger<CostsController> logger)
    {
        var db = client.GetDatabase(options.Value.DatabaseName);
        _costs = db.GetCollection<Cost>("costs");
        _users = db.GetCollection<User>("users");
        _notifications = db.GetCollection<Notification>("notifications");
        _hubContext = hubContext;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetCosts([FromQuery] string? search, [FromQuery] string? type, [FromQuery] string? status, [FromQuery] int page = 1)
    {
        if (page < 1) page = 1;

        var filter = Builders<Cost>.Filter.Empty;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lowered = search.ToLower();
            filter &= Builders<Cost>.Filter.Or(
                Builders<Cost>.Filter.Where(c => c.Content.ToLower().Contains(lowered)),
                Builders<Cost>.Filter.Where(c => c.Requester.ToLower().Contains(lowered)),
                Builders<Cost>.Filter.Where(c => c.VoucherNumber != null && c.VoucherNumber.ToLower().Contains(lowered))
            );
        }

        if (!string.IsNullOrWhiteSpace(type))
        {
            filter &= Builders<Cost>.Filter.Eq(c => c.TransactionType, type);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            filter &= Builders<Cost>.Filter.Eq(c => c.PaymentStatus, status);
        }

        const int pageSize = 10;
        var skip = (page - 1) * pageSize;

        var total = await _costs.CountDocumentsAsync(filter);
        var costs = await _costs
            .Find(filter)
            .SortByDescending(c => c.LegacyId)
            .Skip(skip)
            .Limit(pageSize)
            .ToListAsync();

        var result = costs.Select(c => new
        {
            id = c.LegacyId,
            requester = c.Requester,
            department = c.Department,
            requestDate = c.RequestDate,
            projectCode = c.ProjectCode,
            transactionType = c.TransactionType,
            transactionObject = c.TransactionObject,
            transactionDate = c.TransactionDate,
            content = c.Content,
            description = c.Description,
            amountBeforeTax = c.AmountBeforeTax,
            taxRate = c.TaxRate,
            totalAmount = c.TotalAmount,
            paymentMethod = c.PaymentMethod,
            bank = c.Bank,
            accountNumber = c.AccountNumber,
            voucherType = c.VoucherType,
            voucherNumber = c.VoucherNumber,
            voucherDate = c.VoucherDate,
            attachment = c.Attachment,
            attachments = c.Attachments,
            paymentStatus = c.PaymentStatus,
            rejectionReason = c.RejectionReason,
            note = c.Note,
            statusHistory = c.StatusHistory,
            createdByUserId = c.CreatedByUserId
        });

        return Ok(new
        {
            costs = result,
            costCount = total
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<object>> GetCostByLegacyId(int id)
    {
        var cost = await _costs.Find(c => c.LegacyId == id).FirstOrDefaultAsync();
        if (cost == null) return NotFound(new { message = "Cost not found" });

        return Ok(new
        {
            id = cost.LegacyId,
            requester = cost.Requester,
            department = cost.Department,
            requestDate = cost.RequestDate,
            projectCode = cost.ProjectCode,
            transactionType = cost.TransactionType,
            transactionObject = cost.TransactionObject,
            transactionDate = cost.TransactionDate,
            content = cost.Content,
            description = cost.Description,
            amountBeforeTax = cost.AmountBeforeTax,
            taxRate = cost.TaxRate,
            totalAmount = cost.TotalAmount,
            paymentMethod = cost.PaymentMethod,
            bank = cost.Bank,
            accountNumber = cost.AccountNumber,
            voucherType = cost.VoucherType,
            voucherNumber = cost.VoucherNumber,
            voucherDate = cost.VoucherDate,
            attachment = cost.Attachment,
            attachments = cost.Attachments,
            paymentStatus = cost.PaymentStatus,
            rejectionReason = cost.RejectionReason,
            note = cost.Note,
            statusHistory = cost.StatusHistory,
            createdByUserId = cost.CreatedByUserId
        });
    }

    [HttpPost]
    public async Task<ActionResult<object>> CreateCost([FromBody] Cost input)
    {
        var userIdStr = User.FindFirst("legacy_id")?.Value;
        if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();
        var userName = User.Identity?.Name ?? "Unknown";

        input.Id = ObjectId.GenerateNewId().ToString();

        var maxLegacyId = await _costs.Find(_ => true)
            .SortByDescending(c => c.LegacyId)
            .Limit(1)
            .FirstOrDefaultAsync();

        input.LegacyId = maxLegacyId != null ? maxLegacyId.LegacyId + 1 : 1;
        input.CreatedByUserId = userId;
        input.PaymentStatus = "Đợi duyệt";
        
        input.StatusHistory = new List<CostStatusHistory>
        {
            new CostStatusHistory
            {
                Status = "Đợi duyệt",
                ChangedByUserId = userId,
                ChangedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                Note = "Tạo mới và gửi duyệt"
            }
        };

        await _costs.InsertOneAsync(input);

        // Notify Selected Recipients
        if (input.NotificationRecipients != null && input.NotificationRecipients.Count > 0)
        {
            foreach (var recipientId in input.NotificationRecipients)
            {
                 await CreateAndSendNotification(recipientId, "Phiếu chi mới cần duyệt", 
                    $"{userName} đã tạo phiếu chi #{input.LegacyId}. Vui lòng duyệt.", "CostApproval", input.LegacyId.ToString());
            }
        }
        else
        {
            // Fallback: Notify Specific Manager if available
            var creator = await _users.Find(u => u.LegacyId == userId).FirstOrDefaultAsync();
            bool managerNotified = false;

            if (creator != null && !string.IsNullOrEmpty(creator.ManagerId) && int.TryParse(creator.ManagerId, out int managerId))
            {
                 await CreateAndSendNotification(managerId, "Phiếu chi mới cần duyệt", 
                    $"{userName} đã tạo phiếu chi #{input.LegacyId}. Vui lòng duyệt.", "CostApproval", input.LegacyId.ToString());
                 managerNotified = true;
            }

            // If no specific manager, notify all managers
            if (!managerNotified)
            {
                await SendNotificationToRole("ip_manager", "Phiếu chi mới cần duyệt", 
                    $"{userName} đã tạo phiếu chi #{input.LegacyId}. Vui lòng duyệt.", "CostApproval", input.LegacyId.ToString());
            }
            
            await SendNotificationToRole("admin", "Phiếu chi mới cần duyệt", 
                $"{userName} đã tạo phiếu chi #{input.LegacyId}. Vui lòng duyệt.", "CostApproval", input.LegacyId.ToString());
        }

        return Ok(new { message = "Tạo phiếu thành công", id = input.LegacyId });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<object>> UpdateCost(int id, [FromBody] Cost input)
    {
        var userIdStr = User.FindFirst("legacy_id")?.Value;
        int.TryParse(userIdStr, out var userId);
        var userName = User.Identity?.Name ?? "Unknown";

        var cost = await _costs.Find(c => c.LegacyId == id).FirstOrDefaultAsync();
        if (cost == null) return NotFound(new { message = "Cost not found" });
        
        // Detect status change and log history
        if (input.PaymentStatus != cost.PaymentStatus)
        {
             cost.StatusHistory.Add(new CostStatusHistory
             {
                 Status = input.PaymentStatus,
                 ChangedByUserId = userId,
                 ChangedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                 Note = !string.IsNullOrEmpty(input.RejectionReason) && input.PaymentStatus == "Huỷ" 
                        ? $"Từ chối: {input.RejectionReason}" 
                        : $"Cập nhật trạng thái: {input.PaymentStatus}"
             });

             // Auto-fill Approver fields based on status change
             if (input.PaymentStatus == "Quản lý duyệt" && string.IsNullOrEmpty(input.ApproverManager))
             {
                 input.ApproverManager = "Đã duyệt";
             }
             else if (input.PaymentStatus == "Giám đốc duyệt" && string.IsNullOrEmpty(input.ApproverDirector))
             {
                 input.ApproverDirector = "Đã duyệt";
             }
             else if (input.PaymentStatus == "Đã thanh toán" && string.IsNullOrEmpty(input.AccountantReview))
             {
                 input.AccountantReview = "Đã duyệt";
             }
             else if (input.PaymentStatus == "Huỷ")
             {
                 var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
                 if (userRole == "ip_manager" || userRole == "quan_ly") input.ApproverManager = "Từ chối";
                 else if (userRole == "giam_doc") input.ApproverDirector = "Từ chối";
                 else if (userRole == "ke_toan") input.AccountantReview = "Từ chối";
             }
        }

        input.Id = cost.Id;
        input.LegacyId = cost.LegacyId;
        input.CreatedByUserId = cost.CreatedByUserId;
        input.StatusHistory = cost.StatusHistory;
        
        // Allow PaymentStatus, RejectionReason, Approver* fields to be updated from input

        await _costs.ReplaceOneAsync(c => c.Id == cost.Id, input);

        return Ok(new { message = "Cập nhật thành công", id = input.LegacyId });
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<object>> DeleteCost(int id)
    {
        var result = await _costs.DeleteOneAsync(c => c.LegacyId == id);
        if (result.DeletedCount == 0) return NotFound(new { message = "Cost not found" });
        return Ok(new { message = "Cost deleted" });
    }

    [HttpPost("{id:int}/approve")]
    public async Task<ActionResult<object>> ApproveCost(int id, [FromBody] JsonElement body)
    {
        var userIdStr = User.FindFirst("legacy_id")?.Value;
        if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var userName = User.Identity?.Name ?? "Unknown";

        List<int> extraRecipients = new List<int>();
        if (body.ValueKind == JsonValueKind.Object && body.TryGetProperty("notificationRecipients", out var recipientsProp))
        {
            if (recipientsProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in recipientsProp.EnumerateArray())
                {
                    if (item.TryGetInt32(out int rid)) extraRecipients.Add(rid);
                }
            }
        }

        var cost = await _costs.Find(c => c.LegacyId == id).FirstOrDefaultAsync();
        if (cost == null) return NotFound(new { message = "Cost not found" });

        // Get Requester Info for hierarchy lookup
        var requester = await _users.Find(u => u.LegacyId == cost.CreatedByUserId).FirstOrDefaultAsync();

        string nextStatus = "";
        List<int> userIdsToNotify = new List<int>();
        string roleToNotifyFallback = "";
        string notificationTitle = "";
        string notificationMsg = "";

        // Workflow Logic
        if (cost.PaymentStatus == "Đợi duyệt")
        {
            if (userRole == "ip_manager" || userRole == "quan_ly" || userRole == "admin")
            {
                nextStatus = "Quản lý duyệt";
                cost.ApproverManager = "Đã duyệt";
                
                // Determine Director to notify
                // Case 1: Requester is Manager -> Notify their Manager (Director)
                // Case 2: Requester is Employee -> Notify their Manager's Manager (Director)
                
                if (requester != null)
                {
                    if (requester.RoleCode == "ip_manager" || requester.RoleCode == "quan_ly")
                    {
                        if (!string.IsNullOrEmpty(requester.ManagerId) && int.TryParse(requester.ManagerId, out int directManagerId))
                        {
                            userIdsToNotify.Add(directManagerId);
                        }
                    }
                    else // Assume Employee
                    {
                        if (!string.IsNullOrEmpty(requester.ManagerId) && int.TryParse(requester.ManagerId, out int managerId))
                        {
                            var managerUser = await _users.Find(u => u.LegacyId == managerId).FirstOrDefaultAsync();
                            if (managerUser != null && !string.IsNullOrEmpty(managerUser.ManagerId))
                            {
                                if (int.TryParse(managerUser.ManagerId, out int directorId))
                                {
                                    userIdsToNotify.Add(directorId);
                                }
                            }
                        }
                    }
                }

                if (userIdsToNotify.Count == 0) roleToNotifyFallback = "giam_doc";
                
                notificationTitle = "Phiếu chi đã được quản lý duyệt";
                notificationMsg = $"Quản lý {userName} đã duyệt phiếu chi #{id}. Chờ giám đốc duyệt.";
            }
            else return BadRequest(new { message = "Bạn không có quyền duyệt phiếu này" });
        }
        else if (cost.PaymentStatus == "Quản lý duyệt")
        {
             if (userRole == "giam_doc" || userRole == "admin")
            {
                nextStatus = "Giám đốc duyệt";
                cost.ApproverDirector = "Đã duyệt";
                
                roleToNotifyFallback = "ke_toan"; // Accountants are usually a pool
                
                notificationTitle = "Phiếu chi đã được giám đốc duyệt";
                notificationMsg = $"Giám đốc {userName} đã duyệt phiếu chi #{id}. Chờ kế toán thanh toán.";
            }
             else return BadRequest(new { message = "Bạn không có quyền duyệt phiếu này" });
        }
        else if (cost.PaymentStatus == "Giám đốc duyệt")
        {
             if (userRole == "ke_toan" || userRole == "admin")
            {
                nextStatus = "Đã thanh toán";
                cost.AccountantReview = "Đã duyệt";
                
                notificationTitle = "Phiếu chi đã được thanh toán";
                notificationMsg = $"Kế toán {userName} đã xác nhận thanh toán phiếu chi #{id}.";
            }
             else return BadRequest(new { message = "Bạn không có quyền duyệt phiếu này" });
        }
        else
        {
            return BadRequest(new { message = "Trạng thái phiếu không hợp lệ để duyệt" });
        }

        cost.PaymentStatus = nextStatus;
        cost.StatusHistory.Add(new CostStatusHistory
        {
            Status = nextStatus,
            ChangedByUserId = userId,
            ChangedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
            Note = $"Được duyệt bởi {userName}"
        });

        await _costs.ReplaceOneAsync(c => c.Id == cost.Id, cost);

        // Send Notifications
        // 1. To Specific Users (Hierarchy)
        if (userIdsToNotify.Count > 0)
        {
            foreach(var uid in userIdsToNotify)
            {
                await CreateAndSendNotification(uid, notificationTitle, notificationMsg, "CostApproval", id.ToString());
            }
        }

        // 2. To Role (Fallback or Required)
        // If specific users notified, maybe skip role unless it's accountant?
        // Let's send to role if NO specific users found, OR if role is 'ke_toan' (pool)
        if (!string.IsNullOrEmpty(roleToNotifyFallback))
        {
            if (userIdsToNotify.Count == 0 || roleToNotifyFallback == "accountant" || roleToNotifyFallback == "ke_toan")
            {
                await SendNotificationToRole(roleToNotifyFallback, notificationTitle, notificationMsg, "CostApproval", id.ToString());
            }
        }
        
        // 3. Always notify Admin (for visibility)
        if (roleToNotifyFallback != "admin") 
             await SendNotificationToRole("admin", notificationTitle, notificationMsg, "CostApproval", id.ToString());

        // 4. Always notify Requester (if not self)
        if (cost.CreatedByUserId != userId)
        {
             await CreateAndSendNotification(cost.CreatedByUserId, notificationTitle, notificationMsg, "CostApproval", id.ToString());
        }

        return Ok(new { message = "Duyệt thành công", status = nextStatus });
    }

    [HttpPost("{id:int}/reject")]
    public async Task<ActionResult<object>> RejectCost(int id, [FromBody] JsonElement body)
    {
        var userIdStr = User.FindFirst("legacy_id")?.Value;
        if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();
        var userName = User.Identity?.Name ?? "Unknown";

        string reason = "";
        if (body.ValueKind == JsonValueKind.Object && body.TryGetProperty("reason", out var reasonProp))
        {
            reason = reasonProp.GetString() ?? "";
        }

        var cost = await _costs.Find(c => c.LegacyId == id).FirstOrDefaultAsync();
        if (cost == null) return NotFound(new { message = "Cost not found" });

        cost.PaymentStatus = "Từ chối";
        cost.RejectionReason = reason;
        cost.StatusHistory.Add(new CostStatusHistory
        {
            Status = "Từ chối",
            ChangedByUserId = userId,
            ChangedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
            Note = $"Từ chối: {reason}"
        });

        await _costs.ReplaceOneAsync(c => c.Id == cost.Id, cost);

        // Notify Requester
        await CreateAndSendNotification(cost.CreatedByUserId, "Phiếu chi bị từ chối", 
            $"{userName} đã từ chối phiếu chi #{id}. Lý do: {reason}", "CostApproval", id.ToString());
            
        // Also notify admin
        await SendNotificationToRole("admin", "Phiếu chi bị từ chối", 
             $"{userName} đã từ chối phiếu chi #{id}. Lý do: {reason}", "CostApproval", id.ToString());

        return Ok(new { message = "Đã từ chối phiếu" });
    }

    private async Task SendNotificationToRole(string roleCode, string title, string message, string type, string relatedId)
    {
        var users = await _users.Find(u => u.RoleCode == roleCode).ToListAsync();
        foreach (var user in users)
        {
            await CreateAndSendNotification(user.LegacyId, title, message, type, relatedId);
        }
    }
    
    private async Task CreateAndSendNotification(int userId, string title, string message, string type, string relatedId)
    {
        var notif = new Notification
        {
            Id = ObjectId.GenerateNewId().ToString(),
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            RelatedId = relatedId,
            IsRead = false,
            CreatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
        };
        
        await _notifications.InsertOneAsync(notif);
        
        try 
        {
            await _hubContext.Clients.Group(userId.ToString()).SendAsync("ReceiveNotification", notif);
        }
        catch 
        {
            // Ignore SignalR errors
        }
    }
}
