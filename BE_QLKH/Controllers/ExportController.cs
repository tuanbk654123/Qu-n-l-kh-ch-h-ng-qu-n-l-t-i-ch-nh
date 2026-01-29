using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO.Compression;

namespace BE_QLKH.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExportController : ControllerBase
{
    [HttpPost("word")]
    public async Task<IActionResult> ExportWord([FromForm] IFormFile file, [FromForm] string data)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Vui lòng upload file template");

        List<Dictionary<string, string>>? dataList;
        try 
        {
            // Try to deserialize as List first (Bulk export)
            dataList = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, string>>>(data);
        }
        catch
        {
            try
            {
                // Fallback: deserialize as Single Dictionary and wrap in List
                var single = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(data);
                dataList = single != null ? new List<Dictionary<string, string>> { single } : null;
            }
            catch
            {
                return BadRequest("Dữ liệu thay thế không đúng định dạng JSON");
            }
        }

        if (dataList == null || dataList.Count == 0)
            return BadRequest("Dữ liệu thay thế không được để trống");

        // If only 1 item, return DOCX
        if (dataList.Count == 1)
        {
            var resultBytes = await GenerateDocx(file, dataList[0]);
            return File(resultBytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "exported_document.docx");
        }

        // If multiple items, return ZIP
        using var zipStream = new MemoryStream();
        using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Create, true))
        {
            for (int i = 0; i < dataList.Count; i++)
            {
                var replacements = dataList[i];
                var bytes = await GenerateDocx(file, replacements);
                
                // Naming: Use _FileName if present, otherwise Document_i.docx
                string fileName = $"Document_{i + 1}.docx";
                if (replacements.ContainsKey("_FileName") && !string.IsNullOrWhiteSpace(replacements["_FileName"]))
                {
                    fileName = replacements["_FileName"];
                    if (!fileName.EndsWith(".docx", StringComparison.OrdinalIgnoreCase))
                        fileName += ".docx";
                }
                
                var entry = archive.CreateEntry(fileName);
                using var entryStream = entry.Open();
                await entryStream.WriteAsync(bytes, 0, bytes.Length);
            }
        }

        zipStream.Position = 0;
        return File(zipStream.ToArray(), "application/zip", "exported_documents.zip");
    }

    private async Task<byte[]> GenerateDocx(IFormFile templateFile, Dictionary<string, string> replacements)
    {
        using var memoryStream = new MemoryStream();
        await templateFile.CopyToAsync(memoryStream);
        memoryStream.Position = 0;
        
        using (var doc = WordprocessingDocument.Open(memoryStream, true))
        {
            if (doc.MainDocumentPart?.Document?.Body != null)
            {
                var body = doc.MainDocumentPart.Document.Body;
                var textElements = body.Descendants<Text>().ToList();
                var sortedReplacements = replacements.OrderByDescending(k => k.Key.Length).ToList();

                foreach (var text in textElements)
                {
                    foreach (var kvp in sortedReplacements)
                    {
                        if (text.Text.Contains(kvp.Key))
                        {
                            text.Text = text.Text.Replace(kvp.Key, kvp.Value);
                        }
                    }
                }
                doc.Save();
            }
        }
        return memoryStream.ToArray();
    }
}
