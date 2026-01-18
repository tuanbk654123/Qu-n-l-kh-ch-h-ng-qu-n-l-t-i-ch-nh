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
public class CustomersController : ControllerBase
{
    private readonly IMongoCollection<Customer> _customers;

    public CustomersController(IMongoClient client, IOptions<MongoDbSettings> options)
    {
        var db = client.GetDatabase(options.Value.DatabaseName);
        _customers = db.GetCollection<Customer>("customers");
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetCustomers([FromQuery] string? search, [FromQuery] int page = 1)
    {
        if (page < 1) page = 1;

        var filter = Builders<Customer>.Filter.Empty;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lowered = search.ToLower();
            filter &= Builders<Customer>.Filter.Or(
                Builders<Customer>.Filter.Where(c => c.Name.ToLower().Contains(lowered)),
                Builders<Customer>.Filter.Where(c => c.Email.ToLower().Contains(lowered)),
                Builders<Customer>.Filter.Where(c => c.Phone.Contains(search))
            );
        }

        const int pageSize = 10;
        var skip = (page - 1) * pageSize;

        var total = await _customers.CountDocumentsAsync(filter);
        var customers = await _customers
            .Find(filter)
            .Skip(skip)
            .Limit(pageSize)
            .ToListAsync();

        var result = customers.Select(c => new
        {
            id = c.LegacyId,
            name = c.Name,
            email = c.Email,
            phone = c.Phone,
            address = c.Address,
            company = c.Company,
            taxCode = c.TaxCode,
            representativeName = c.RepresentativeName,
            representativePosition = c.RepresentativePosition,
            representativePhone = c.RepresentativePhone,
            businessNeeds = c.BusinessNeeds,
            businessScale = c.BusinessScale,
            businessIndustry = c.BusinessIndustry,
            copyrightStatus = c.CopyrightStatus,
            trademarkStatus = c.TrademarkStatus,
            patentStatus = c.PatentStatus,
            industrialDesign = c.IndustrialDesign,
            contractStatus = c.ContractStatus,
            status = c.Status,
            totalOrders = c.TotalOrders,
            totalRevenue = c.TotalRevenue,
            joinDate = c.JoinDate,
            notes = c.Notes,
            productsServices = c.ProductsServices,
            ipGroup = c.IpGroup,
            consultingStatus = c.ConsultingStatus,
            filingStatus = c.FilingStatus,
            documentLink = c.DocumentLink,
            authorization = c.Authorization,
            applicationReviewStatus = c.ApplicationReviewStatus,
            priority = c.Priority,
            contractPaid = c.ContractPaid,
            contractValue = c.ContractValue,
            startDate = c.StartDate,
            endDate = c.EndDate,
            implementationDays = c.ImplementationDays,
            potentialLevel = c.PotentialLevel,
            sourceClassification = c.SourceClassification,
            nsnnSource = c.NsnnSource
        });

        return Ok(new
        {
            customers = result,
            customerCount = total
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<object>> GetCustomerByLegacyId(int id)
    {
        var customer = await _customers.Find(c => c.LegacyId == id).FirstOrDefaultAsync();
        if (customer == null) return NotFound(new { message = "Customer not found" });

        return Ok(new
        {
            id = customer.LegacyId,
            name = customer.Name,
            email = customer.Email,
            phone = customer.Phone,
            address = customer.Address,
            company = customer.Company,
            taxCode = customer.TaxCode,
            representativeName = customer.RepresentativeName,
            representativePosition = customer.RepresentativePosition,
            representativePhone = customer.RepresentativePhone,
            businessNeeds = customer.BusinessNeeds,
            businessScale = customer.BusinessScale,
            businessIndustry = customer.BusinessIndustry,
            copyrightStatus = customer.CopyrightStatus,
            trademarkStatus = customer.TrademarkStatus,
            patentStatus = customer.PatentStatus,
            industrialDesign = customer.IndustrialDesign,
            contractStatus = customer.ContractStatus,
            status = customer.Status,
            totalOrders = customer.TotalOrders,
            totalRevenue = customer.TotalRevenue,
            joinDate = customer.JoinDate,
            notes = customer.Notes,
            productsServices = customer.ProductsServices,
            ipGroup = customer.IpGroup,
            consultingStatus = customer.ConsultingStatus,
            filingStatus = customer.FilingStatus,
            documentLink = customer.DocumentLink,
            authorization = customer.Authorization,
            applicationReviewStatus = customer.ApplicationReviewStatus,
            priority = customer.Priority,
            contractPaid = customer.ContractPaid,
            contractValue = customer.ContractValue,
            startDate = customer.StartDate,
            endDate = customer.EndDate,
            implementationDays = customer.ImplementationDays,
            potentialLevel = customer.PotentialLevel,
            sourceClassification = customer.SourceClassification,
            nsnnSource = customer.NsnnSource
        });
    }

    [HttpPost]
    public async Task<ActionResult<object>> CreateCustomer([FromBody] Customer input)
    {
        input.Id = ObjectId.GenerateNewId().ToString();

        var maxLegacyId = await _customers.Find(_ => true)
            .SortByDescending(c => c.LegacyId)
            .Limit(1)
            .FirstOrDefaultAsync();

        input.LegacyId = maxLegacyId != null ? maxLegacyId.LegacyId + 1 : 1;

        await _customers.InsertOneAsync(input);

        return Ok(new
        {
            id = input.LegacyId,
            name = input.Name,
            email = input.Email,
            phone = input.Phone,
            address = input.Address,
            company = input.Company,
            taxCode = input.TaxCode,
            representativeName = input.RepresentativeName,
            representativePosition = input.RepresentativePosition,
            representativePhone = input.RepresentativePhone,
            businessNeeds = input.BusinessNeeds,
            businessScale = input.BusinessScale,
            businessIndustry = input.BusinessIndustry,
            copyrightStatus = input.CopyrightStatus,
            trademarkStatus = input.TrademarkStatus,
            patentStatus = input.PatentStatus,
            industrialDesign = input.IndustrialDesign,
            contractStatus = input.ContractStatus,
            status = input.Status,
            totalOrders = input.TotalOrders,
            totalRevenue = input.TotalRevenue,
            joinDate = input.JoinDate,
            notes = input.Notes,
            productsServices = input.ProductsServices,
            ipGroup = input.IpGroup,
            consultingStatus = input.ConsultingStatus,
            filingStatus = input.FilingStatus,
            documentLink = input.DocumentLink,
            authorization = input.Authorization,
            applicationReviewStatus = input.ApplicationReviewStatus,
            priority = input.Priority,
            contractPaid = input.ContractPaid,
            contractValue = input.ContractValue,
            startDate = input.StartDate,
            endDate = input.EndDate,
            implementationDays = input.ImplementationDays,
            potentialLevel = input.PotentialLevel,
            sourceClassification = input.SourceClassification,
            nsnnSource = input.NsnnSource
        });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<object>> UpdateCustomer(int id, [FromBody] Customer input)
    {
        var customer = await _customers.Find(c => c.LegacyId == id).FirstOrDefaultAsync();
        if (customer == null) return NotFound(new { message = "Customer not found" });

        input.Id = customer.Id;
        input.LegacyId = customer.LegacyId;

        await _customers.ReplaceOneAsync(c => c.Id == customer.Id, input);

        return Ok(new
        {
            id = input.LegacyId,
            name = input.Name,
            email = input.Email,
            phone = input.Phone,
            address = input.Address,
            company = input.Company,
            taxCode = input.TaxCode,
            representativeName = input.RepresentativeName,
            representativePosition = input.RepresentativePosition,
            representativePhone = input.RepresentativePhone,
            businessNeeds = input.BusinessNeeds,
            businessScale = input.BusinessScale,
            businessIndustry = input.BusinessIndustry,
            copyrightStatus = input.CopyrightStatus,
            trademarkStatus = input.TrademarkStatus,
            patentStatus = input.PatentStatus,
            industrialDesign = input.IndustrialDesign,
            contractStatus = input.ContractStatus,
            status = input.Status,
            totalOrders = input.TotalOrders,
            totalRevenue = input.TotalRevenue,
            joinDate = input.JoinDate,
            notes = input.Notes,
            productsServices = input.ProductsServices,
            ipGroup = input.IpGroup,
            consultingStatus = input.ConsultingStatus,
            filingStatus = input.FilingStatus,
            documentLink = input.DocumentLink,
            authorization = input.Authorization,
            applicationReviewStatus = input.ApplicationReviewStatus,
            priority = input.Priority,
            contractPaid = input.ContractPaid,
            contractValue = input.ContractValue,
            startDate = input.StartDate,
            endDate = input.EndDate,
            implementationDays = input.ImplementationDays,
            potentialLevel = input.PotentialLevel,
            sourceClassification = input.SourceClassification,
            nsnnSource = input.NsnnSource
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<object>> DeleteCustomer(int id)
    {
        var result = await _customers.DeleteOneAsync(c => c.LegacyId == id);
        if (result.DeletedCount == 0) return NotFound(new { message = "Customer not found" });
        return Ok(new { message = "Customer deleted" });
    }
}
