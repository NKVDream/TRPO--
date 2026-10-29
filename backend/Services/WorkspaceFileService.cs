using Hub.Models;

namespace Hub.Services;

// Работает только с копиями внутри data/files. Произвольные пути API не принимает.
public sealed class WorkspaceFileService
{
    public const long MaxFileSize = 20 * 1024 * 1024;
    private readonly string _root;

    public WorkspaceFileService(IWebHostEnvironment environment)
    {
        _root = Path.Combine(environment.ContentRootPath, "data", "files");
        Directory.CreateDirectory(_root);
    }

    public IReadOnlyList<WorkspaceFile> GetAll()
    {
        var files = new List<WorkspaceFile>();
        foreach (var directory in Directory.EnumerateDirectories(_root))
        {
            var id = Path.GetFileName(directory);
            var path = FindPath(id);
            if (path is not null) files.Add(Describe(id, path));
        }
        return files.OrderBy(file => file.Name).ToList();
    }

    public string? FindPath(string id)
    {
        if (!Guid.TryParseExact(id, "D", out _)) return null;
        var directory = Path.Combine(_root, id);
        if (!Directory.Exists(directory) || IsLink(directory)) return null;
        return Directory.EnumerateFiles(directory).FirstOrDefault(path => !IsLink(path));
    }

    public static bool IsValidName(string name)
    {
        return !string.IsNullOrWhiteSpace(name) && name.Length <= 180 &&
            name == name.Trim() && name is not "." and not ".." &&
            !name.Any(character => char.IsControl(character) || "<>:\"/\\|?*".Contains(character)) &&
            !name.EndsWith('.') && !IsReservedWindowsName(name);
    }

    private static bool IsReservedWindowsName(string name)
    {
        var stem = name.Split('.')[0].ToUpperInvariant();
        return stem is "CON" or "PRN" or "AUX" or "NUL" ||
            (stem.Length == 4 && (stem.StartsWith("COM") || stem.StartsWith("LPT")) &&
                stem[3] is >= '1' and <= '9');
    }

    public async Task<WorkspaceFile> UploadAsync(IFormFile file, CancellationToken cancellationToken)
    {
        var name = Path.GetFileName(file.FileName.Replace('\\', '/'));
        if (!IsValidName(name)) throw new ArgumentException("Недопустимое имя файла");
        if (file.Length > MaxFileSize) throw new ArgumentException("Максимальный размер — 20 МБ");

        var id = Guid.NewGuid().ToString();
        var directory = Path.Combine(_root, id);
        Directory.CreateDirectory(directory);
        var path = Path.Combine(directory, name);
        try
        {
            await using (var stream = new FileStream(path, FileMode.CreateNew))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }
            return Describe(id, path);
        }
        catch
        {
            if (File.Exists(path)) File.Delete(path);
            Directory.Delete(directory);
            throw;
        }
    }

    public WorkspaceFile Update(string id, string path, UpdateFileRequest request)
    {
        if (!IsValidName(request.Name)) throw new ArgumentException("Недопустимое имя файла");
        if (request.Hidden && !OperatingSystem.IsWindows())
            throw new ArgumentException("Атрибут «скрытый» поддерживается только в Windows");
        if (request.ModifiedUtc is { Year: < 1980 or > 2100 })
            throw new ArgumentException("Укажите год изменения от 1980 до 2100");

        var destination = Path.Combine(Path.GetDirectoryName(path)!, request.Name);
        // Снимаем ReadOnly перед изменением, затем устанавливаем выбранное значение.
        SetReadOnly(path, false);
        if (!string.Equals(path, destination, StringComparison.Ordinal))
        {
            File.Move(path, destination);
            path = destination;
        }
        if (request.ModifiedUtc is not null)
            File.SetLastWriteTimeUtc(path, request.ModifiedUtc.Value.UtcDateTime);
        if (OperatingSystem.IsWindows())
        {
            var attributes = File.GetAttributes(path);
            File.SetAttributes(path, request.Hidden
                ? attributes | FileAttributes.Hidden
                : attributes & ~FileAttributes.Hidden);
        }
        SetReadOnly(path, request.ReadOnly);
        return Describe(id, path);
    }

    private static void SetReadOnly(string path, bool readOnly)
    {
        var attributes = File.GetAttributes(path);
        File.SetAttributes(path, readOnly
            ? attributes | FileAttributes.ReadOnly
            : attributes & ~FileAttributes.ReadOnly);
    }

    private static bool IsLink(string path) =>
        File.GetAttributes(path).HasFlag(FileAttributes.ReparsePoint);

    private static WorkspaceFile Describe(string id, string path)
    {
        var info = new FileInfo(path);
        return new(id, info.Name, info.Length, info.IsReadOnly,
            info.Attributes.HasFlag(FileAttributes.Hidden), info.LastWriteTimeUtc,
            OperatingSystem.IsWindows());
    }
}
