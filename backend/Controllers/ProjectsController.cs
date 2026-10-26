using Hub.Models;
using Hub.Services;
using Microsoft.AspNetCore.Mvc;

namespace Hub.Controllers;

[ApiController]
[Route("api/projects")]
public sealed class ProjectsController(ProjectService projects) : ControllerBase
{
    [HttpGet]
    public ActionResult<IReadOnlyList<ProjectSummary>> GetAll()
    {
        return Ok(projects.GetAll());
    }

    [HttpGet("{id}")]
    public ActionResult<Project> GetById(string id)
    {
        var project = projects.GetById(id);
        return project is null ? NotFound() : Ok(project);
    }

    [HttpPut("{id}")]
    public IActionResult Save(string id, [FromBody] SaveProjectRequest request)
    {
        var error = projects.Save(id, request);
        return error is null ? Ok(new { id }) : BadRequest(new { error });
    }
}
