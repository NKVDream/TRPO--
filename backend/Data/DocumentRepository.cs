using Hub.Models;

namespace Hub.Data;

public sealed class DocumentRepository(HubDatabase database)
{
    public IReadOnlyList<DocumentSummary> GetAll()
    {
        using var connection = database.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT id, name, updated FROM documents ORDER BY updated DESC";
        using var reader = command.ExecuteReader();
        var documents = new List<DocumentSummary>();
        while (reader.Read())
        {
            documents.Add(new(reader.GetString(0), reader.GetString(1), reader.GetString(2)));
        }
        return documents;
    }

    public TextDocument? GetById(string id)
    {
        using var connection = database.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT name, content FROM documents WHERE id = $id";
        command.Parameters.AddWithValue("$id", id);
        using var reader = command.ExecuteReader();
        return reader.Read() ? new(id, reader.GetString(0), reader.GetString(1)) : null;
    }

    public void Save(string id, SaveDocumentRequest document)
    {
        using var connection = database.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO documents (id, name, content, updated)
            VALUES ($id, $name, $content, $updated)
            ON CONFLICT(id) DO UPDATE SET
                name = $name, content = $content, updated = $updated
            """;
        command.Parameters.AddWithValue("$id", id);
        command.Parameters.AddWithValue("$name", document.Name.Trim());
        command.Parameters.AddWithValue("$content", document.Content);
        command.Parameters.AddWithValue("$updated", DateTime.UtcNow.ToString("O"));
        command.ExecuteNonQuery();
    }

    public bool Delete(string id)
    {
        using var connection = database.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM documents WHERE id = $id";
        command.Parameters.AddWithValue("$id", id);
        return command.ExecuteNonQuery() > 0;
    }
}
