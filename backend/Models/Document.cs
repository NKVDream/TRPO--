using System.ComponentModel.DataAnnotations;

namespace Hub.Models;

public sealed record DocumentSummary(string Id, string Name, string Updated);
public sealed record TextDocument(string Id, string Name, string Content);

public sealed class SaveDocumentRequest
{
    [Required, StringLength(200)]
    public string Name { get; init; } = string.Empty;

    [Required(AllowEmptyStrings = true), StringLength(1_000_000)]
    public string Content { get; init; } = string.Empty;
}
