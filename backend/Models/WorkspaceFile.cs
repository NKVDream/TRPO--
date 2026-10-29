using System.ComponentModel.DataAnnotations;

namespace Hub.Models;

public sealed record WorkspaceFile(
    string Id, string Name, long Size, bool ReadOnly, bool Hidden,
    DateTime ModifiedUtc, bool SupportsHidden);

public sealed class UpdateFileRequest
{
    [Required, StringLength(180)]
    public string Name { get; init; } = string.Empty;
    public bool ReadOnly { get; init; }
    public bool Hidden { get; init; }
    public DateTimeOffset? ModifiedUtc { get; init; }
}
