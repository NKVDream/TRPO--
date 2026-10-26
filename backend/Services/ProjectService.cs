using Hub.Data;
using Hub.Models;

namespace Hub.Services;

public sealed class ProjectService(ProjectRepository repository)
{
    private const int MaxImageLength = 12_000_000;
    private const string PngDataUrlPrefix = "data:image/png;base64,";

    public IReadOnlyList<ProjectSummary> GetAll() => repository.GetAll();

    public Project? GetById(string id) => repository.GetById(id);

    // Возвращаем ошибку до записи в БД; null означает успешное сохранение.
    public string? Save(string id, SaveProjectRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 200)
        {
            return "Укажите название длиной до 200 символов";
        }

        if (string.IsNullOrEmpty(request.Content) ||
            !request.Content.StartsWith(PngDataUrlPrefix, StringComparison.Ordinal))
        {
            return "Передайте изображение PNG";
        }

        if (request.Content.Length > MaxImageLength)
        {
            return "Изображение слишком большое";
        }

        repository.Save(id, request);
        return null;
    }
}
