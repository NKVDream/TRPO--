using System.ComponentModel.DataAnnotations;

namespace Hub.Models;

public sealed record OrganizerTask(
    string Id, string Title, string Notes, string? DueDate, string Priority, bool Completed);

public sealed class SaveTaskRequest
{
    [Required, StringLength(200)]
    public string Title { get; init; } = string.Empty;

    [Required(AllowEmptyStrings = true), StringLength(10_000)]
    public string Notes { get; init; } = string.Empty;

    public string? DueDate { get; init; }

    [Required, RegularExpression("^(low|normal|high)$")]
    public string Priority { get; init; } = "normal";

    public bool Completed { get; init; }
}
