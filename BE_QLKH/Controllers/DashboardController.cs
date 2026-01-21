using BE_QLKH.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Globalization;

namespace BE_QLKH.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IMongoCollection<Customer> _customers;
    private readonly IMongoCollection<Cost> _costs;

    public DashboardController(IMongoClient client, IOptions<MongoDbSettings> options)
    {
        var db = client.GetDatabase(options.Value.DatabaseName);
        _customers = db.GetCollection<Customer>("customers");
        _costs = db.GetCollection<Cost>("costs");
    }

    private static IEnumerable<Customer> FilterCustomersByDate(IEnumerable<Customer> customers, string? fromDate, string? toDate)
    {
        DateTime? from = null;
        DateTime? to = null;

        if (!string.IsNullOrWhiteSpace(fromDate) &&
            DateTime.TryParseExact(fromDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var fromParsed))
        {
            from = fromParsed.Date;
        }

        if (!string.IsNullOrWhiteSpace(toDate) &&
            DateTime.TryParseExact(toDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var toParsed))
        {
            to = toParsed.Date;
        }

        if (!from.HasValue && !to.HasValue)
        {
            return customers;
        }

        return customers.Where(c =>
        {
            if (string.IsNullOrWhiteSpace(c.JoinDate))
            {
                return false;
            }

            if (!DateTime.TryParseExact(c.JoinDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
            {
                return false;
            }

            if (from.HasValue && date.Date < from.Value)
            {
                return false;
            }

            if (to.HasValue && date.Date > to.Value)
            {
                return false;
            }

            return true;
        });
    }

    private static IEnumerable<Cost> FilterCostsByDate(IEnumerable<Cost> costs, string? fromDate, string? toDate)
    {
        DateTime? from = null;
        DateTime? to = null;

        if (!string.IsNullOrWhiteSpace(fromDate) &&
            DateTime.TryParseExact(fromDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var fromParsed))
        {
            from = fromParsed.Date;
        }

        if (!string.IsNullOrWhiteSpace(toDate) &&
            DateTime.TryParseExact(toDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var toParsed))
        {
            to = toParsed.Date;
        }

        if (!from.HasValue && !to.HasValue)
        {
            return costs;
        }

        return costs.Where(c =>
        {
            var dateStr = string.IsNullOrWhiteSpace(c.VoucherDate) ? c.RequestDate : c.VoucherDate;
            if (string.IsNullOrWhiteSpace(dateStr))
            {
                return false;
            }

            if (!DateTime.TryParseExact(dateStr, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
            {
                return false;
            }

            if (from.HasValue && date.Date < from.Value)
            {
                return false;
            }

            if (to.HasValue && date.Date > to.Value)
            {
                return false;
            }

            return true;
        });
    }

    [HttpGet("overview")]
    public async Task<ActionResult<object>> GetOverview([FromQuery] string? fromDate, [FromQuery] string? toDate)
    {
        var allCustomers = await _customers.Find(_ => true).ToListAsync();
        var filteredCustomers = FilterCustomersByDate(allCustomers, fromDate, toDate);
        var totalCustomers = filteredCustomers.Count();
        var activeCustomers = filteredCustomers.Count(c => c.Status == "active");

        var allCosts = await _costs.Find(_ => true).ToListAsync();
        var filteredCosts = FilterCostsByDate(allCosts, fromDate, toDate);

        var revenueCosts = filteredCosts.Where(c => c.TransactionType == "Thu" && c.PaymentStatus == "Đã thanh toán");
        var totalRevenue = revenueCosts.Sum(c => c.TotalAmount);

        var expenseCosts = filteredCosts.Where(c => c.TransactionType == "Chi" && c.PaymentStatus == "Đã thanh toán");
        var totalExpense = expenseCosts.Sum(c => c.TotalAmount);

        return Ok(new
        {
            totalCustomers,
            activeCustomers,
            totalRevenue,
            totalExpense
        });
    }

    [HttpGet("transactions")]
    public async Task<ActionResult<object>> GetTransactions([FromQuery] string? fromDate, [FromQuery] string? toDate)
    {
        var allCosts = await _costs.Find(_ => true).ToListAsync();
        var filteredCosts = FilterCostsByDate(allCosts, fromDate, toDate);

        var transactions = filteredCosts.Select(c => new
        {
            date = string.IsNullOrWhiteSpace(c.VoucherDate) ? c.RequestDate : c.VoucherDate,
            type = c.TransactionType == "Thu" ? "revenue" : "expense",
            amount = c.TotalAmount,
            status = c.PaymentStatus == "Đã thanh toán" ? "completed" : "pending",
            description = c.Content,
            transactionType = c.TransactionType,
            paymentStatus = c.PaymentStatus
        });

        return Ok(new
        {
            transactions
        });
    }
}
