using Hub.Models;

namespace Hub.Data;

public sealed class TaskRepository(HubDatabase database)
{
    public IReadOnlyList<OrganizerTask> GetAll()
    {
        using var connection = database.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT id, title, notes, due_date, priority, completed FROM tasks
            ORDER BY completed, due_date IS NULL, due_date, title
            """;
        using var reader = command.ExecuteReader();
        var tasks = new List<OrganizerTask>();
        while (reader.Read())
        {
            tasks.Add(new(
                reader.GetString(0), reader.GetString(1), reader.GetString(2),
                reader.IsDBNull(3) ? null : reader.GetString(3),
                reader.GetString(4), reader.GetBoolean(5)));
        }
        return tasks;
    }

    public void Save(string id, SaveTaskRequest task)
    {
        using var connection = database.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO tasks (id, title, notes, due_date, priority, completed)
            VALUES ($id, $title, $notes, $due, $priority, $completed)
            ON CONFLICT(id) DO UPDATE SET
                title = $title, notes = $notes, due_date = $due,
                priority = $priority, completed = $completed
            """;
        command.Parameters.AddWithValue("$id", id);
        command.Parameters.AddWithValue("$title", task.Title.Trim());
        command.Parameters.AddWithValue("$notes", task.Notes);
        command.Parameters.AddWithValue("$due", (object?)task.DueDate ?? DBNull.Value);
        command.Parameters.AddWithValue("$priority", task.Priority);
        command.Parameters.AddWithValue("$completed", task.Completed);
        command.ExecuteNonQuery();
    }

    public bool Delete(string id)
    {
        using var connection = database.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM tasks WHERE id = $id";
        command.Parameters.AddWithValue("$id", id);
        return command.ExecuteNonQuery() > 0;
    }
}
