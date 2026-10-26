using Hub.Models;

namespace Hub.Data;

public sealed class ProjectRepository(HubDatabase database)
{
    public IReadOnlyList<ProjectSummary> GetAll()
    {
        using var connection = database.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT id, name, updated FROM projects ORDER BY updated DESC";

        using var reader = command.ExecuteReader();
        var projects = new List<ProjectSummary>();
        while (reader.Read())
        {
            projects.Add(new ProjectSummary(
                reader.GetString(0), reader.GetString(1), reader.GetString(2)));
        }

        return projects;
    }

    public Project? GetById(string id)
    {
        using var connection = database.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT name, content FROM projects WHERE id = $id";
        command.Parameters.AddWithValue("$id", id);

        using var reader = command.ExecuteReader();
        return reader.Read()
            ? new Project(id, reader.GetString(0), reader.GetString(1))
            : null;
    }

    public void Save(string id, SaveProjectRequest request)
    {
        using var connection = database.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO projects (id, name, content, updated)
            VALUES ($id, $name, $content, $updated)
            ON CONFLICT(id) DO UPDATE SET
                name = $name, content = $content, updated = $updated
            """;
        command.Parameters.AddWithValue("$id", id);
        command.Parameters.AddWithValue("$name", request.Name);
        command.Parameters.AddWithValue("$content", request.Content);
        command.Parameters.AddWithValue("$updated", DateTime.UtcNow.ToString("O"));
        command.ExecuteNonQuery();
    }
}
