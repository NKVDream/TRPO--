using Hub.Data;
using Hub.Models;
using Microsoft.AspNetCore.Mvc;

namespace Hub.Controllers;

[ApiController]
[Route("api/documents")]
public sealed class DocumentsController(DocumentRepository documents) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll() => Ok(documents.GetAll());

    [HttpGet("{id}")]
    public IActionResult GetById(string id)
    {
        var document = documents.GetById(id);
        return document is null ? NotFound() : Ok(document);
    }

    [HttpPut("{id}")]
    public IActionResult Save(string id, SaveDocumentRequest request)
    {
        // Проверку обязательных полей и длины выполняет [ApiController].
        documents.Save(id, request);
        return Ok(new { id });
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(string id) => documents.Delete(id) ? NoContent() : NotFound();
}
