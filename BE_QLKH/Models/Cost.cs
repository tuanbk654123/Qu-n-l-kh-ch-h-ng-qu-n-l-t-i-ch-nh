using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace BE_QLKH.Models;

public class Cost
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("legacy_id")]
    public int LegacyId { get; set; }

    [BsonElement("requester")]
    public string Requester { get; set; } = string.Empty;

    [BsonElement("department")]
    public string Department { get; set; } = string.Empty;

    [BsonElement("request_date")]
    public string RequestDate { get; set; } = string.Empty;

    [BsonElement("project_code")]
    public string ProjectCode { get; set; } = string.Empty;

    [BsonElement("transaction_type")]
    public string TransactionType { get; set; } = string.Empty;

    [BsonElement("transaction_object")]
    public string TransactionObject { get; set; } = string.Empty;

    [BsonElement("content")]
    public string Content { get; set; } = string.Empty;

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("amount_before_tax")]
    public decimal AmountBeforeTax { get; set; }

    [BsonElement("tax_rate")]
    public string TaxRate { get; set; } = string.Empty;

    [BsonElement("total_amount")]
    public decimal TotalAmount { get; set; }

    [BsonElement("payment_method")]
    public string PaymentMethod { get; set; } = string.Empty;

    [BsonElement("bank")]
    public string Bank { get; set; } = string.Empty;

    [BsonElement("account_number")]
    public string AccountNumber { get; set; } = string.Empty;

    [BsonElement("voucher_type")]
    public string VoucherType { get; set; } = string.Empty;

    [BsonElement("voucher_number")]
    public string VoucherNumber { get; set; } = string.Empty;

    [BsonElement("voucher_date")]
    public string VoucherDate { get; set; } = string.Empty;

    [BsonElement("attachment")]
    public string Attachment { get; set; } = string.Empty;

    [BsonElement("payment_status")]
    public string PaymentStatus { get; set; } = string.Empty;

    [BsonElement("rejection_reason")]
    public string RejectionReason { get; set; } = string.Empty;

    [BsonElement("note")]
    public string Note { get; set; } = string.Empty;
}

