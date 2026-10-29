using Hub.Models;
using Hub.Services;
using Microsoft.AspNetCore.Mvc;

namespace Hub.Controllers;

[ApiController]
[Route("api/files")]
public sealed class FilesController(WorkspaceFileService files) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll() => Ok(files.GetAll());

    [HttpPost]
    [RequestSizeLimit(WorkspaceFileService.MaxFileSize + 1024 * 1024)]
    public async Task<IActionResult> Upload([FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await files.UploadAsync(file, cancellationToken));
        }
        catch (ArgumentException error)
        {
            return BadRequest(new { error = error.Message });
        }
        catch (IOException)
        {
            return Conflict(new { error = "Не удалось записать файл" });
        }
    }

    [HttpPut("{id}")]
    public IActionResult Update(string id, UpdateFileRequest request)
    {
        var path = files.FindPath(id);
        if (path is null) return NotFound();
        try
        {
            return Ok(files.Update(id, path, request));
        }
        catch (ArgumentException error)
        {
            return BadRequest(new { error = error.Message });
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException)
        {
            return Conflict(new { error = "Файл занят или изменение запрещено ОС" });
        }
    }

    [HttpGet("{id}/download")]
    public IActionResult Download(string id)
    {
        var path = files.FindPath(id);
        return path is null ? NotFound() : PhysicalFile(path, "application/octet-stream", Path.GetFileName(path));
    }
}
