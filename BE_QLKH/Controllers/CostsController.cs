using BE_QLKH.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;

namespace BE_QLKH.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CostsController : ControllerBase
{
    private readonly IMongoCollection<Cost> _costs;

    public CostsController(IMongoClient client, IOptions<MongoDbSettings> options)
    {
        var db = client.GetDatabase(options.Value.DatabaseName);
        _costs = db.GetCollection<Cost>("costs");
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
                Builders<Cost>.Filter.Where(c => c.VoucherNumber.ToLower().Contains(lowered))
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
            paymentStatus = c.PaymentStatus,
            rejectionReason = c.RejectionReason,
            note = c.Note
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
            paymentStatus = cost.PaymentStatus,
            rejectionReason = cost.RejectionReason,
            note = cost.Note
        });
    }

    [HttpPost]
    public async Task<ActionResult<object>> CreateCost([FromBody] Cost input)
    {
        input.Id = ObjectId.GenerateNewId().ToString();

        var maxLegacyId = await _costs.Find(_ => true)
            .SortByDescending(c => c.LegacyId)
            .Limit(1)
            .FirstOrDefaultAsync();

        input.LegacyId = maxLegacyId != null ? maxLegacyId.LegacyId + 1 : 1;

        await _costs.InsertOneAsync(input);

        return Ok(new
        {
            id = input.LegacyId,
            requester = input.Requester,
            department = input.Department,
            requestDate = input.RequestDate,
            projectCode = input.ProjectCode,
            transactionType = input.TransactionType,
            transactionObject = input.TransactionObject,
            content = input.Content,
            description = input.Description,
            amountBeforeTax = input.AmountBeforeTax,
            taxRate = input.TaxRate,
            totalAmount = input.TotalAmount,
            paymentMethod = input.PaymentMethod,
            bank = input.Bank,
            accountNumber = input.AccountNumber,
            voucherType = input.VoucherType,
            voucherNumber = input.VoucherNumber,
            voucherDate = input.VoucherDate,
            attachment = input.Attachment,
            paymentStatus = input.PaymentStatus,
            rejectionReason = input.RejectionReason,
            note = input.Note
        });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<object>> UpdateCost(int id, [FromBody] Cost input)
    {
        var cost = await _costs.Find(c => c.LegacyId == id).FirstOrDefaultAsync();
        if (cost == null) return NotFound(new { message = "Cost not found" });

        input.Id = cost.Id;
        input.LegacyId = cost.LegacyId;

        await _costs.ReplaceOneAsync(c => c.Id == cost.Id, input);

        return Ok(new
        {
            id = input.LegacyId,
            requester = input.Requester,
            department = input.Department,
            requestDate = input.RequestDate,
            projectCode = input.ProjectCode,
            transactionType = input.TransactionType,
            transactionObject = input.TransactionObject,
            content = input.Content,
            description = input.Description,
            amountBeforeTax = input.AmountBeforeTax,
            taxRate = input.TaxRate,
            totalAmount = input.TotalAmount,
            paymentMethod = input.PaymentMethod,
            bank = input.Bank,
            accountNumber = input.AccountNumber,
            voucherType = input.VoucherType,
            voucherNumber = input.VoucherNumber,
            voucherDate = input.VoucherDate,
            attachment = input.Attachment,
            paymentStatus = input.PaymentStatus,
            rejectionReason = input.RejectionReason,
            note = input.Note
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<object>> DeleteCost(int id)
    {
        var result = await _costs.DeleteOneAsync(c => c.LegacyId == id);
        if (result.DeletedCount == 0) return NotFound(new { message = "Cost not found" });
        return Ok(new { message = "Cost deleted" });
    }
}
