using System.ComponentModel.DataAnnotations;

namespace Hub.Models;

public sealed record ProjectSummary(string Id, string Name, string Updated);

public sealed record Project(string Id, string Name, string Content);

public sealed class SaveProjectRequest
{
    [Required(ErrorMessage = "Укажите название проекта")]
    [StringLength(200, ErrorMessage = "Название должно содержать не больше 200 символов")]
    public string Name { get; init; } = string.Empty;

    [Required(ErrorMessage = "Передайте изображение PNG")]
    public string Content { get; init; } = string.Empty;
}
