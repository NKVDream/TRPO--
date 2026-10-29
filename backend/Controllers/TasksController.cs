using System.Globalization;
using Hub.Data;
using Hub.Models;
using Microsoft.AspNetCore.Mvc;

namespace Hub.Controllers;

[ApiController]
[Route("api/tasks")]
public sealed class TasksController(TaskRepository tasks) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll() => Ok(tasks.GetAll());

    [HttpPut("{id}")]
    public IActionResult Save(string id, SaveTaskRequest request)
    {
        if (request.DueDate is not null &&
            !DateOnly.TryParseExact(request.DueDate, "yyyy-MM-dd", CultureInfo.InvariantCulture,
                DateTimeStyles.None, out _))
        {
            return BadRequest(new { error = "Дата должна иметь формат ГГГГ-ММ-ДД" });
        }
        tasks.Save(id, request);
        return Ok(new { id });
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(string id) => tasks.Delete(id) ? NoContent() : NotFound();
}
