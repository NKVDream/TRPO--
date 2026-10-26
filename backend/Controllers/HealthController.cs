using Microsoft.AspNetCore.Mvc;

namespace Hub.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "ok", storage = "SQLite" });
    }
}
